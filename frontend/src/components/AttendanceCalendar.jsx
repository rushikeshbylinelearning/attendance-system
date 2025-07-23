// frontend/src/components/AttendanceCalendar.jsx
import React from 'react';
import Calendar from 'react-calendar';
import { Typography } from '@mui/material';
import './styles/AttendanceCalendar.css';

const AttendanceCalendar = ({ logs, onDayClick }) => {
    const logMap = new Map(logs.map(log => [log.attendance_date.split('T')[0], log]));
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const log = logMap.get(dateString);
            if (log) {
                const totalWorkMinutes = (log.sessions || []).reduce((acc, session) => {
                    if (session.start_time && session.end_time) {
                        return acc + (new Date(session.end_time) - new Date(session.start_time));
                    }
                    return acc;
                }, 0) / (1000 * 60);
                const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
                return <Typography variant="caption">{formatDuration(totalWorkMinutes)}</Typography>;
            }
        }
        return null;
    };
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const log = logMap.get(dateString);
            if (log) {
                return log.status.toLowerCase().replace(' ', '-');
            }
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return 'weekend';
            }
        }
        return null;
    };
    return (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <Calendar
                tileContent={tileContent}
                tileClassName={tileClassName}
                onClickDay={(value) => onDayClick(logMap.get(value.toISOString().split('T')[0]) || { attendance_date: value.toISOString() })}
            />
        </div>
    );
};
export default AttendanceCalendar;