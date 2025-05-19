// src/components/StudentSchedule.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./StudentSchedule.css"; // Custom CSS for full-screen mode

function StudentSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isScrolling, setIsScrolling] = useState(true);
    const tableRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

    useEffect(() => {
        refreshSchedules();
        const interval = setInterval(refreshSchedules, 30000); // Auto-Refresh every 30 seconds
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000); // Real-Time Clock
        startAutoScroll(); // Start auto-scrolling

        return () => {
            clearInterval(interval);
            clearInterval(clockInterval);
            stopAutoScroll();
        };
    },);

    const refreshSchedules = async () => {
        try {
            const [schedulesResponse, roomsResponse] = await Promise.all([
            axios.get("https://ewuni.onrender.com/schedules"),
            axios.get("https://ewuni.onrender.com/rooms")
            ]);
            setSchedules(schedulesResponse.data);
            setRooms(roomsResponse.data);
        } catch (error) {
            console.error("❌ Error refreshing schedules:", error);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const isCurrentSlot = (timeSlot) => {
        const currentHour = currentTime.getHours();
        const [slotHour] = timeSlot.split(":");
        return parseInt(slotHour) === currentHour;
    };

    // Start Auto-Scrolling
    const startAutoScroll = () => {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

        const container = tableRef.current;
        if (!container) return;

        const scrollSpeed = 1; // Adjust scroll speed (higher is faster)

        scrollIntervalRef.current = setInterval(() => {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
                // Pause for 2 seconds before going back to top
                clearInterval(scrollIntervalRef.current);
                scrollTimeoutRef.current = setTimeout(() => {
                    smoothScrollToTop(container);
                    startAutoScroll();
                }, 2000); // Pause at the bottom for 2 seconds
            } else {
                container.scrollTop += scrollSpeed;
            }
        }, 20);
    };

    // Smooth Scroll to Top Function
    const smoothScrollToTop = (container) => {
        const scrollDuration = 1000; // 1 second smooth scroll duration
        const start = container.scrollTop;
        const change = -start;
        let currentTime = 0;
        const increment = 20;

        function animateScroll() {
            currentTime += increment;
            const val = easeInOutQuad(currentTime, start, change, scrollDuration);
            container.scrollTop = val;
            if (currentTime < scrollDuration) {
                requestAnimationFrame(animateScroll);
            }
        }
        animateScroll();
    };

    // Easing Function (Smooth Transition)
    const easeInOutQuad = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    // Stop Auto-Scrolling
    const stopAutoScroll = () => {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        setIsScrolling(false);
    };

    // Toggle Auto-Scroll
    const toggleAutoScroll = () => {
        if (isScrolling) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
        setIsScrolling(!isScrolling);
    };

    return (
        <div className="schedule-container">
            {/* Header with Logo and Clock */}
            <div className="header-container">
                <div className="logo-container">
                    <img src="https://ewuni.edu.ge/wp-content/uploads/2025/02/logo.png" alt="Logo" />
                </div>
                <div className="clock-container">
                    <h1>{currentTime.toLocaleDateString()}</h1>
                    <h2>{formatTime(currentTime)}</h2>
                </div>
            </div>

            {/* Scrollable Table Container */}
            <div className="schedule-table-container" ref={tableRef} style={{ overflowY: "auto", maxHeight: "80vh" }}>
                <table className="schedule-table">
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
                            <tr key={timeSlot} className={isCurrentSlot(timeSlot) ? "current-slot" : ""}>
                                <td><strong>{timeSlot}</strong></td>
                                {daysOfWeek.map((day) => {
                                    const schedulesAtTime = schedules.filter((s) => {
                                        const startHour = parseInt(s.start_time.split(":")[0]);
                                        const occupiedSlots = Array.from({ length: s.duration }, (_, i) => {
                                            const hour = startHour + i;
                                            return `${String(hour).padStart(2, "0")}:00`;
                                        });

                                        return s.day_of_week === day && occupiedSlots.includes(timeSlot);
                                    });

                                    return (
                                        <td key={day + timeSlot} style={{ backgroundColor: schedulesAtTime.length > 0 ? "#DFF0D8" : "#F8F9FA" }}>
                                            {schedulesAtTime.length > 0 ? (
                                                schedulesAtTime.map((schedule, index) => (
                                                    <div key={index} className="schedule-item">
                                                        <strong>{schedule.course_name}</strong> <br />
                                                        🧑‍🏫 {schedule.professor} <br />
                                                        🏫 {rooms.find(room => room.room_id === schedule.room_id)?.room_name || "Unknown Room"} <br />
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

            {/* Pause/Resume Button */}
            <div className="control-container">
                <button onClick={toggleAutoScroll} className="control-button">
                    {isScrolling ? "Pause Auto-Scroll" : "Resume Auto-Scroll"}
                </button>
            </div>
        </div>
    );
}

export default StudentSchedule;
