// frontend/src/components/AttendanceTimeline.jsx
import React, { useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Grid, Chip, Tooltip } from '@mui/material';
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
        <Paper sx={{ p: 2, mt: 3, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Time Logs</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => onWeekChange('prev')} aria-label="previous week">
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="body1" component="span" sx={{ minWidth: {xs: 150, md: 180}, textAlign: 'center' }}>
                        {startOfWeek?.toLocaleDateString()} - {endOfWeek?.toLocaleDateString()}
                    </Typography>
                    <IconButton onClick={() => onWeekChange('next')} aria-label="next week">
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Render a row for each day of the week */}
            {weekDays.map(day => (
                <DailyTimelineRow 
                    key={day.date.toISOString()} 
                    dayData={day}
                    dailyStatusData={dailyStatusData}
                />
            ))}
            
            {/* The time axis at the bottom */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1, ml: {xs: '60px', md:'80px'}, mr: {xs:'40px', md:'120px'} }}>
                 {['09 AM', '12 PM', '03 PM', '06 PM'].map(time => (
                     <Typography key={time} variant="caption" color="text.secondary">{time}</Typography>
                 ))}
            </Box>
        </Paper>
    );
};

export default AttendanceTimeline;