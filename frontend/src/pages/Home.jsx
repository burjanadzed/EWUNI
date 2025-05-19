import React from 'react';
import ScheduleTable from '../components/ScheduleTable';

const Home = () => {
    return (
        <div>
            <h1>Welcome to the Study Scheduler</h1>
            <p>Manage your schedules efficiently.</p>
            <ScheduleTable />
        </div>
    );
};

export default Home;