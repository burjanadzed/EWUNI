// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
    const [schedules, setSchedules] = useState([]);
    const [courseName, setCourseName] = useState("");
    const [professor, setProfessor] = useState("");
    const [studentCount, setStudentCount] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("");
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterRoom, setFilterRoom] = useState("");
    const [filterStudentCount, setFilterStudentCount] = useState("");
    const [rooms, setRooms] = useState([]);
    const [roomName, setRoomName] = useState("");
    const [roomCapacity, setRoomCapacity] = useState("");
    const [editingRoom, setEditingRoom] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('');



    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];



        const refreshSchedules = async () => {
            try {
                const [schedulesResponse, roomsResponse] = await Promise.all([
                axios.get("https://ewuni.onrender.com/schedules"),
                axios.get("https://ewuni.onrender.com/rooms")
                ]);
                setSchedules(schedulesResponse.data);
                setRooms(roomsResponse.data);
                console.log("🏫 Fetched rooms:", roomsResponse.data); // ✅ Debug
            } catch (error) {
                console.error("❌ Error refreshing schedules:", error);
            }
        };
    // Fetch schedules from backend
        useEffect(() => {
            const loadRooms = async () => {
                try {
                    const response = await axios.get("https://ewuni.onrender.com/rooms");
                    setRooms(response.data);
                    console.log("🏫 Rooms loaded:", response.data);
                } catch (error) {
                    console.error("❌ Error loading rooms:", error);
                }
            };
            loadRooms();
        }, []);

    
    useEffect(() => {
        axios.get("https://ewuni.onrender.com/schedules")
            .then(response => {
                console.log("📅 Fetched schedules:", response.data);
                setSchedules(response.data);
            })
            .catch(error => console.error("❌ Error fetching schedules:", error));
    }, []); // 👈 Runs only once when the page loads
    
        useEffect(() => {
            refreshSchedules();
        }, []);

        useEffect(() => {
            console.log("🏫 Loaded rooms in frontend:", rooms);
        }, [rooms]);

    const saveRoom = (e) => {
        e.preventDefault();
    
        const requestData = {
            room_name: roomName,
            capacity: parseInt(roomCapacity)
        };
    
        if (editingRoom) {
            // Edit existing room
            axios.put(`https://ewuni.onrender.com/rooms/${editingRoom.room_id}`, requestData)
            .then(response => {
                console.log("✅ Room updated:", response.data);
                alert("Room updated successfully!");
                setRooms(prevRooms => prevRooms.map(room => 
                    room.room_id === editingRoom.room_id ? { ...room, ...requestData } : room
                )); // 👈 Updates state directly
                setEditingRoom(null);
                
            })
           
            .catch(error => {
                console.error("❌ Error updating room:", error.response ? error.response.data.error : error.message);
            });
        } else {
            // Add new room
            axios.post("https://ewuni.onrender.com/rooms", requestData)
            .then(response => {
                console.log("✅ Room added:", response.data);
                setRooms(prevRooms => [...prevRooms, response.data]); // 👈 Adds new room directly
            })
            .catch(error => {
                console.error("❌ Error adding room:", error.response ? error.response.data.error : error.message);
            });
        }
    
        // Reset form
        setRoomName("");
        setRoomCapacity("");
        setEditingRoom(null);
    };
    
    const deleteRoom = (room_id) => {
        if (!window.confirm("Are you sure you want to delete this room?")) return;
    
        axios.delete(`https://ewuni.onrender.com/rooms/${room_id}`)
        .then(response => {
            console.log("🗑 Room deleted:", response.data);
            setRooms(prevRooms => prevRooms.filter(room => room.room_id !== room_id)); // 👈 Removes deleted room
        })
        .catch(error => {
            console.error("❌ Error deleting room:", error.response ? error.response.data.error : error.message);
        });
    };
   

    // Handle form submission (Add or Edit)
    const saveSchedule = (e) => {
        e.preventDefault();

        const requestData = {
            course_name: courseName,
            professor,
            student_count: parseInt(studentCount),
            duration: parseInt(duration),
            day_of_week: dayOfWeek,
            start_time: startTime,
            room_id: parseInt(selectedRoom) // ✅ Add room name here
        };

        if (editingSchedule) {
            // Edit existing schedule
            axios.put(`https://ewuni.onrender.com/schedules/${editingSchedule.schedule_id}`, requestData)
            .then(response => {
                console.log("✅ Schedule updated:", response.data);
                alert("Schedule updated successfully!");
                setEditingSchedule(null);
                refreshSchedules();
            })
            .catch(error => {
                console.error("❌ Error updating schedule:", error.response ? error.response.data.error : error.message);
            });
        } else {
            // Add new schedule
            axios.post("https://ewuni.onrender.com/schedules", requestData)
            .then(response => {
                console.log("✅ Schedule added:", response.data);
                refreshSchedules();
            })
            .catch(error => {
                console.error("❌ Error adding schedule:", error.response ? error.response.data.error : error.message);
                if (error.response && error.response.data && error.response.data.error) {
                    alert(`❌ ${error.response.data.error}`);
                } else {
                    alert("❌ An unexpected error occurred. Please try again.");
                }
            });
        }

        // Reset form
        setCourseName("");
        setProfessor("");
        setStudentCount("");
        setDayOfWeek("");
        setStartTime("");
        setDuration("");
        setSelectedRoom("");
    };

    // Handle "Edit" button click
    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setCourseName(schedule.course_name);
        setProfessor(schedule.professor);
        setStudentCount(schedule.student_count);
        setDayOfWeek(schedule.day_of_week);
        setStartTime(schedule.start_time);
        setDuration(schedule.duration);
        setSelectedRoom(schedule.room_id); // ✅ Set the room name here
    };

    // Handle "Delete" button click
    const handleDelete = (schedule_id) => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;

        axios.delete(`https://ewuni.onrender.com/schedules/${schedule_id}`)
        .then(response => {
            console.log("🗑 Schedule deleted:", response.data);
            alert("Schedule deleted successfully!");
            refreshSchedules();
        })
        .catch(error => {
            console.error("❌ Error deleting schedule:", error.response ? error.response.data.error : error.message);
        });
    };

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", textAlign: "center" }}>
            
            <h1>Manage Rooms</h1>

{/* Room Form for Adding & Editing */}
<form onSubmit={saveRoom} style={{ marginBottom: "20px" }}>
    <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Room Name"
        required
        style={{ padding: "8px", marginRight: "10px" }}
    />
    <input
        type="number"
        value={roomCapacity}
        onChange={(e) => setRoomCapacity(e.target.value)}
        placeholder="Capacity"
        required
        style={{ padding: "8px", marginRight: "10px", width: "100px" }}
    />
    <button type="submit" style={{ padding: "8px 15px" }}>
        {editingRoom ? "Update Room" : "Add Room"}
    </button>
</form>

{/* Room List Table */}
<table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
    <thead>
        <tr>
            <th>Room Name</th>
            <th>Capacity</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        {rooms.map((room) => (
            <tr key={room.room_id}>
                <td>{room.room_name}</td>
                <td>{room.capacity}</td>
                <td>
                    <button onClick={() => setEditingRoom(room)}>✏️ Edit</button>
                    <button onClick={() => deleteRoom(room.room_id)}>🗑 Delete</button>
                </td>
            </tr>
        ))}
    </tbody>
</table>

            <h2>University Scheduling System</h2>

            <form onSubmit={saveSchedule} style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Course Name"
                    required
                />
                <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Professor Name"
                    required
                />
                <input
                    type="number"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    placeholder="Number of Students"
                    required
                />

                {/* Room Selector */}
                <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required>
                    <option value="">Select Room</option>
                    {rooms.map(room => (
                        <option key={room.room_id} value={room.room_id}>
                            {room.room_name} (Capacity: {room.capacity})
                        </option>
                    ))}
                </select>

                {/* Day of the Week Selector */}
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required>
                    <option value="">Select a Day</option>
                    {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>


                {/* Start Time Selector (Only Full Hours) */}
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} required>
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                    ))}
                </select>

                {/* Duration Selector */}
                <select value={duration} onChange={(e) => setDuration(e.target.value)} required>
                    <option value="">Select Duration</option>
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="5">5 Hours</option>
                </select>

                <button type="submit">{editingSchedule ? "Update Schedule" : "Schedule"}</button>
            </form>

            <h3>Weekly Schedule</h3>


{/* Search & Filter Inputs */}
<div style={{ marginBottom: "20px" }}>
    {/* Search Filter */}
    <input 
        type="text" 
        placeholder="Search by Course or Professor" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "8px", width: "250px", marginRight: "10px" }}
    />

    {/* Day Filter */}
    <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} style={{ padding: "8px", marginRight: "10px" }}>
        <option value="">All Days</option>
        {daysOfWeek.map(day => (
            <option key={day} value={day}>{day}</option>
        ))}
    </select>

    {/* Room Filter */}
        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} style={{ padding: "8px", marginRight: "10px" }}>
            <option value="">All Rooms</option>
            {rooms.map(room => (
                <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
            ))}
        </select>

    {/* Student Count Filter */}
    <input 
        type="number" 
        placeholder="Min Students" 
        value={filterStudentCount} 
        onChange={(e) => setFilterStudentCount(e.target.value)}
        style={{ padding: "8px", width: "120px" }}
    />
</div>

{/* Schedule Table */}
<table border="1" cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
    <thead>
        <tr>
            <th>Time</th>
            {daysOfWeek.map((day) => (
                <th key={day}>{day}</th>
            ))}
        </tr>
    </thead>
    <tbody>
        {timeSlots.map((timeSlot) => (
            <tr key={timeSlot}>
                <td><strong>{timeSlot}</strong></td>
                {daysOfWeek.map((day) => {
                    const schedulesAtTime = schedules.filter((s) => {
                        // Calculate all time slots occupied by this schedule
                        const startHour = parseInt(s.start_time.split(":")[0]);
                        const occupiedSlots = Array.from({ length: s.duration }, (_, i) => {
                            const hour = startHour + i;
                            return `${String(hour).padStart(2, "0")}:00`;
                        });

                        // Check if the current time slot is occupied
                        return (
                            s.day_of_week === day &&
                            occupiedSlots.includes(timeSlot)
                        );
                    });

                    return (
                        <td 
                            key={day + timeSlot} 
                            style={{ backgroundColor: schedulesAtTime.length > 0 ? "#DFF0D8" : "#F8F9FA" }}
                        >
                            {schedulesAtTime.length > 0 ? (
                                schedulesAtTime.map((schedule, index) => (
                                    <div key={index} style={{ borderBottom: "1px solid #ccc", padding: "5px" }}>
                                        <strong>{schedule.course_name}</strong> <br />
                                        🧑‍🏫 {schedule.professor} <br />
                                        🏫 {rooms.find(room => room.room_id === schedule.room_id)?.room_name || "Unknown Room"} <br />
                                        👥 {schedule.student_count} students <br />
                                        ⏳ {schedule.duration} hrs <br />
                                        <button onClick={() => handleEdit(schedule)}>✏️ Edit</button>
                                        <button onClick={() => handleDelete(schedule.schedule_id)}>🗑 Delete</button>
                                    </div>
                                ))
                            ) : ""}
                        </td>
                    );
                })}
            </tr>
        ))}
    </tbody>
</table>
        </div>
    );
}

export default AdminPanel;




