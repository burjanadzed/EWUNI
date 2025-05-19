require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" })); // Allow frontend access

// PostgreSQL Connection
const pool = new Pool({
    user: 'ewuni',
    host: 'dpg-d0lmi98gjchc73f7fq1g-a',
    database: 'ewuni',
    password: 'sTGCT89Lvfkjmy5bJjNPbEShPZbHAXIo',
    port: 5432,
});

// Validation Function
const validateCapacity = (capacity) => {
    const parsedCapacity = Number.isInteger(parseInt(capacity)) ? parseInt(capacity) : 0;
    if (parsedCapacity <= 0) {
        throw new Error("Invalid room capacity. Capacity must be a positive number.");
    }
    return parsedCapacity;
};

// Debug log
console.log("✅ Backend is running and connected to the database");

//AI
app.post('/auto-schedule', async (req, res) => {
    try {
        const coursesToSchedule = req.body; // List of courses with professor, students, duration

        // TODO: Implement AI logic here

        res.json({ message: "Auto-scheduling not implemented yet." });
    } catch (err) {
        console.error("❌ Error in auto-schedule:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

//AI
// Function to find an available room based on student count & conflicts
const findAvailableRoom = async (student_count, day_of_week, bookedSlots) => {
    try {
        const result = await pool.query(
            `SELECT room_id FROM rooms 
             WHERE capacity >= $1 
             AND room_id NOT IN (
                 SELECT room_id FROM schedules 
                 WHERE day_of_week = $2 
                 AND (start_time, start_time + (duration * INTERVAL '1 hour')) OVERLAPS ($3, $4)
             ) 
             ORDER BY capacity ASC LIMIT 1`,
            [student_count, day_of_week, bookedSlots]
        );
        return result.rows.length ? result.rows[0].room_id : null;
    } catch (err) {
        console.error("❌ Error finding available room:", err);
        return null;
    }
};

// Route to add a schedule with automatic room allocation
app.post('/schedules', async (req, res) => {
    try {
        console.log("📥 Received data from frontend:", req.body);

        const { course_name, professor, student_count, duration, day_of_week, start_time, room_id } = req.body;

        if (!course_name || !professor || !student_count || !duration || !day_of_week || !start_time || !room_id) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const parsedDuration = parseInt(duration);
        if (parsedDuration < 1 || parsedDuration > 4) {
            return res.status(400).json({ error: "Duration must be between 1 to 4 hours." });
        }

        // Calculate booked time slots
        const startTimeParts = start_time.split(":");
        let startHour = parseInt(startTimeParts[0]);
        const bookedSlots = [];

        for (let i = 0; i < parsedDuration; i++) {
            bookedSlots.push(`${String(startHour).padStart(2, '0')}:00:00`);
            startHour++;
        }

        console.log(`⏳ Booking time slots: ${bookedSlots.join(", ")}`);

        // ✅ Improved Conflict Check: Only conflicts in the same room
        const conflictCheck = await pool.query(
            `SELECT * FROM schedules 
             WHERE day_of_week = $1 
             AND room_id = $2 
             AND ((start_time >= $3 AND start_time < $4) OR 
                 (start_time + (duration * INTERVAL '1 hour') > $3 AND start_time + (duration * INTERVAL '1 hour') <= $4))`,
            [day_of_week, room_id, start_time, bookedSlots[bookedSlots.length - 1]]
        );

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({ error: "Schedule conflict. Another schedule exists in this room at this time." });
        }

        // ✅ Insert the schedule without auto-allocating room (manual selection)
        await pool.query(
            `INSERT INTO schedules (course_name, professor, student_count, duration, room_id, 
                day_of_week, start_time, assigned) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
            [course_name, professor, student_count, duration, room_id, day_of_week, start_time]
        );

        console.log("✅ Schedule saved successfully.");
        res.json({ message: "Schedule saved successfully!" });

    } catch (err) {
        console.error("❌ Error saving schedule:", err);
        res.status(500).json({ error: "Server Error" });
    }
});


// Route to update a schedule
        app.put('/schedules/:id', async (req, res) => {
        try {
        const schedule_id = req.params.id;
        const { course_name, professor, student_count, duration, day_of_week, start_time, room_id } = req.body;

        if (!course_name || !professor || !student_count || !duration || !day_of_week || !start_time || !room_id) {
            return res.status(400).json({ error: "All fields are required, including room selection." });
        }
        // Check if schedule exists
        const checkSchedule = await pool.query("SELECT * FROM schedules WHERE schedule_id = $1", [schedule_id]);
        if (checkSchedule.rows.length === 0) {
            return res.status(404).json({ error: "Schedule not found." });
        }
        
        // Check for conflicts
        const conflictCheck = await pool.query(
            "SELECT * FROM schedules WHERE day_of_week = $1 AND start_time = $2 AND room_id = $3 AND schedule_id != $4",
            [day_of_week, start_time, room_id, schedule_id]
        );

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({ error: "Schedule conflict. Another schedule exists in this room at this time." });
        }

        // Update the schedule
        await pool.query(
            "UPDATE schedules SET course_name = $1, professor = $2, student_count = $3, duration = $4, day_of_week = $5, start_time = $6, room_id = $7 WHERE schedule_id = $8",
            [course_name, professor, student_count, duration, day_of_week, start_time, room_id, schedule_id]
        );

        // Send the success response
        return res.status(200).json({ message: "Schedule updated successfully." });

         } catch (error) {
        console.error("Error updating schedule:", error);
        return res.status(500).json({ error: "An unexpected error occurred while updating the schedule." });
        }
});

// Route to delete a schedule
app.delete('/schedules/:id', async (req, res) => {
    try {
        const schedule_id = req.params.id;

        // Check if schedule exists
        const checkSchedule = await pool.query("SELECT * FROM schedules WHERE schedule_id = $1", [schedule_id]);
        if (checkSchedule.rows.length === 0) {
            return res.status(404).json({ error: "Schedule not found." });
        }

        // Delete schedule
        await pool.query("DELETE FROM schedules WHERE schedule_id = $1", [schedule_id]);

        res.json({ message: "Schedule deleted successfully!" });
    } catch (err) {
        console.error("❌ Error deleting schedule:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// Route to get all schedules
app.get('/schedules', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT schedules.*, rooms.room_name 
             FROM schedules 
             JOIN rooms ON schedules.room_id = rooms.room_id 
             ORDER BY day_of_week, start_time`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error retrieving schedules:", err);
        res.status(500).json({ error: "Server Error" });
    }
});
// Add Rooms
app.post('/rooms', async (req, res) => {
    try {
        const { room_name, capacity } = req.body;

        if (!room_name || !capacity) {
            return res.status(400).json({ error: "Room name and capacity are required." });
        }

        const parsedCapacity = validateCapacity(capacity); // ✅ Use validation function

        const result = await pool.query(
            "INSERT INTO rooms (room_name, capacity) VALUES ($1, $2) RETURNING *",
            [room_name, parsedCapacity]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ Error adding room:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Ensure you have this route in your backend
app.get('/rooms', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM rooms ORDER BY room_name ASC");
        console.log("🏫 Retrieved rooms:", result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error retrieving rooms:", err);
        res.status(500).json({ error: "Server Error" });
    }
});


// Edit Rooms

app.put('/rooms/:id', async (req, res) => {
    try {
        console.log("📥 Received Edit Room request:", req.body);  // Log request data

        const room_id = req.params.id;
        const { room_name, capacity } = req.body;

        if (!room_name || !capacity) {
            return res.status(400).json({ error: "Room name and capacity are required." });
        }

        const checkRoom = await pool.query("SELECT * FROM rooms WHERE room_id = $1", [room_id]);
        if (checkRoom.rows.length === 0) {
            return res.status(404).json({ error: "Room not found." });
        }

        await pool.query(
            "UPDATE rooms SET room_name = $1, capacity = $2 WHERE room_id = $3",
            [room_name, parseInt(capacity), room_id]
        );

        res.json({ message: "Room updated successfully!" });
    } catch (err) {
        console.error("❌ Error updating room:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete Rooms

app.delete('/rooms/:id', async (req, res) => {
    try {
        console.log(`📥 Received Delete Room request for ID: ${req.params.id}`);

        const room_id = req.params.id;

        const checkRoom = await pool.query("SELECT * FROM rooms WHERE room_id = $1", [room_id]);
        if (checkRoom.rows.length === 0) {
            return res.status(404).json({ error: "Room not found." });
        }

        const checkSchedule = await pool.query("SELECT * FROM schedules WHERE room_id = $1", [room_id]);
        if (checkSchedule.rows.length > 0) {
            return res.status(400).json({ error: "Cannot delete room. It is currently assigned to a schedule." });
        }

        await pool.query("DELETE FROM rooms WHERE room_id = $1", [room_id]);

        res.json({ message: "Room deleted successfully!" });
    } catch (err) {
        console.error("❌ Error deleting room:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
