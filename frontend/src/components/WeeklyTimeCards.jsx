// frontend/src/components/WeeklyTimeCards.jsx

import React, { useMemo } from 'react';
import { Box, Paper, Typography, Grid, Avatar } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import '../styles/WorkSchedule.css'; // Import the corresponding CSS file

// Helper to get the start of the current week (assumes Sunday is the first day)
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

// Helper to format total work minutes into HH:MM Hrs format
const formatWorkHours = (minutes) => {
    if (!minutes || minutes <= 0) return '00:00 Hrs';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} Hrs`;
};

// Renamed from WeeklyTimeCards to a more descriptive name for clarity
const WorkSchedule = ({ logs, shift }) => {

    const weekData = useMemo(() => {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const weekDays = [];
        // Create a Map for efficient lookups of logs by date
        const logMap = new Map((logs || []).map(log => [log.attendance_date.split('T')[0], log]));

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const log = logMap.get(dateString);

            let status = 'No Data';
            const dayOfWeek = currentDate.getDay();

            if (log) {
                status = log.status; // Status from the log (Present, Late, On Leave)
            } else if (dayOfWeek === 0 || dayOfWeek === 6) {
                status = 'Weekend'; // It's a weekend with no log
            } else if (currentDate < today) {
                status = 'Absent'; // It's a past weekday with no log
            }
            
            // Calculate total work time for the day from all sessions
            const totalWorkMinutes = (log?.sessions || []).reduce((acc, session) => {
                if (session.start_time && session.end_time) {
                    return acc + (new Date(session.end_time) - new Date(session.start_time));
                }
                return acc;
            }, 0) / (1000 * 60);

            weekDays.push({
                date: currentDate,
                log,
                status,
                totalWorkMinutes
            });
        }
        return weekDays;
    }, [logs]); // Recalculate only when the logs data changes

    // Color mapping for different statuses
    const statusColors = {
        Present: 'success.main',
        Late: 'success.main', // Late is still a form of Present
        Absent: 'error.main',
        Weekend: 'warning.main',
        'On Leave': 'info.main',
        'No Data': 'text.secondary'
    };

    const startOfWeekFormatted = weekData[0]?.date.toLocaleDateString('en-CA').replace(/-/g, '-');
    const endOfWeekFormatted = weekData[6]?.date.toLocaleDateString('en-CA').replace(/-/g, '-');
    const todayDateString = new Date().toISOString().split('T')[0];

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}><ScheduleIcon sx={{color: 'primary.main'}}/></Avatar>
                <Box>
                    <Typography variant="h6">Work Schedule</Typography>
                    <Typography variant="body2" color="text.secondary">{startOfWeekFormatted} - {endOfWeekFormatted}</Typography>
                </Box>
            </Box>

            <div className="timeline-container">
                {/* The blue bar representing the shift */}
                <Box sx={{
                    position: 'absolute', top: 0, left: '5%', width: '90%',
                    bgcolor: '#e3f2fd', p: 1, borderRadius: 1, zIndex: 5,
                    borderLeft: '4px solid', borderColor: 'primary.main'
                }}>
                    <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                        {shift?.name || 'Morning Shift'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {shift?.startTime} - {shift?.endTime}
                    </Typography>
                </Box>
                
                {/* The gray horizontal line */}
                <div className="timeline-axis"></div>

                <Grid container spacing={1} sx={{ position: 'relative', zIndex: 3 }}>
                    {weekData.map((day) => {
                        const isToday = day.date.toISOString().split('T')[0] === todayDateString;
                        return (
                            <Grid item key={day.date} xs sx={{ textAlign: 'center' }}>
                                <Box sx={{ position: 'relative', pt: 4 }}>
                                    <div className={`timeline-day-dot ${isToday ? 'is-today' : ''}`}></div>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    <Box component="span" sx={{
                                        ml: 0.5,
                                        p: '2px 6px',
                                        borderRadius: '50%',
                                        bgcolor: isToday ? 'primary.main' : 'transparent',
                                        color: isToday ? 'primary.contrastText' : 'inherit'
                                    }}>
                                        {day.date.getDate()}
                                    </Box>
                                </Typography>
                                <Typography variant="body2" sx={{ color: statusColors[day.status] || 'text.secondary', fontWeight: 'bold' }}>
                                    {day.status}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {(day.status === 'Present' || day.status === 'Late') ? formatWorkHours(day.totalWorkMinutes) : ''}
                                </Typography>
                            </Grid>
                        );
                    })}
                </Grid>
            </div>
        </Paper>
    );
};

export default WorkSchedule; // Exporting with a more descriptive name