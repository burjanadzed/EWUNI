// src/App.js
import React from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import StudentSchedule from './components/StudentSchedule';

function App() {
    const navigate = useNavigate();

    // Function to handle Admin Panel Access
    const handleAdminAccess = (e) => {
        e.preventDefault();
        const password = prompt("Enter Admin Password:");

        if (password === "EWUN!") {
            navigate("/admin");
        } else {
            alert("❌ Incorrect Password. Access Denied.");
        }
    };

    return (
        <div>
            <nav>
                {/* Link for Admin Panel with Password Prompt */}
                <a href="/admin" onClick={handleAdminAccess}>Admin Panel</a> | 
                <Link to="/student">Student Schedule</Link>
            </nav>
            <Routes>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/student" element={<StudentSchedule />} />
                <Route path="*" element={<h2>EWUNI Digital Schedule</h2>} />
            </Routes>
        </div>
    );
}

export default App;
