// frontend/src/components/AttendanceTimeline.jsx
import React, { useMemo } from 'react';
import { Typography, IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DailyTimelineRow from './DailyTimelineRow'; // Assuming DailyTimelineRow is in the same folder or path is correct
import '../styles/AttendanceTimeline.css';

// This is the main Timeline Component that orchestrates the view
const AttendanceTimeline = ({ logs, currentDate, onWeekChange, dailyStatusData }) => {
    
    // useMemo is a performance optimization. It ensures this complex calculation
    // only re-runs when the 'logs' or 'currentDate' props change.
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setHours(0,0,0,0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start week on Sunday

        const days = [];
        const logMap = new Map((logs || []).map(log => [log.attendance_date.split('T')[0], log]));

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            const dateString = d.toISOString().split('T')[0];
            const logForDay = logMap.get(dateString);

            // This ensures every day has a placeholder object, even if no log exists
            days.push({ 
                date: d, 
                log: logForDay 
            });
        }
        return days;
    }, [logs, currentDate]);
    
    // ** THIS IS THE FIX: Derive start and end dates from the calculated weekDays array **
    const startOfWeek = weekDays[0]?.date;
    const endOfWeek = weekDays[6]?.date;

    return (
        <div className="card" style={{ marginTop: 24, overflow: 'hidden' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Typography variant="h6">Time Logs</Typography>
                <div className="flex gap-16" style={{ alignItems: 'center' }}>
                    <Tooltip title="Previous week"><IconButton onClick={() => onWeekChange('prev')}><ChevronLeftIcon /></IconButton></Tooltip>
                    <Typography variant="body1" component="span" style={{ minWidth: 150, textAlign: 'center' }}>
                        {startOfWeek?.toLocaleDateString()} - {endOfWeek?.toLocaleDateString()}
                    </Typography>
                    <Tooltip title="Next week"><IconButton onClick={() => onWeekChange('next')}><ChevronRightIcon /></IconButton></Tooltip>
                </div>
            </div>
            <div className="gap-16" style={{ display: 'flex', flexDirection: 'column' }}>
                {weekDays.map(day => (
                    <DailyTimelineRow 
                        key={day.date.toISOString()} 
                        dayData={day}
                        dailyStatusData={dailyStatusData}
                    />
                ))}
            </div>
            <div className="flex gap-16" style={{ justifyContent: 'space-around', marginTop: 8, marginLeft: 60, marginRight: 40 }}>
                {['09 AM', '12 PM', '03 PM', '06 PM'].map(time => (
                    <Typography key={time} variant="caption" color="text.secondary">{time}</Typography>
                ))}
            </div>
        </div>
    );
};

export default AttendanceTimeline;