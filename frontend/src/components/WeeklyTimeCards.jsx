// frontend/src/components/WeeklyTimeCards.jsx
import React, { useMemo } from 'react';
import { Typography, Avatar } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import '../styles/WorkSchedule.css';

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

const formatWorkHours = (minutes) => {
    if (!minutes || minutes <= 0) return '00:00 Hrs';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} Hrs`;
};

const WorkSchedule = ({ logs, shift }) => {
    const weekData = useMemo(() => {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const weekDays = [];

        // FIX: Filter out any logs that are null or don't have a valid attendanceDate before creating the map.
        const logMap = new Map(
            (logs || [])
                .filter(log => log && log.attendanceDate) // This is the safeguard
                .map(log => [log.attendanceDate.split('T')[0], log])
        );

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const log = logMap.get(dateString);
            
            let status = 'No Data';
            const dayOfWeek = currentDate.getDay();
            if (log) {
                status = log.status;
            } else if (dayOfWeek === 0 || dayOfWeek === 6) {
                status = 'Weekend';
            } else if (currentDate < today) {
                status = 'Absent';
            }
            
            const totalWorkMinutes = (log?.sessions || []).reduce((acc, session) => {
                // Use camelCase to match the API response
                if (session.startTime && session.endTime) {
                    return acc + (new Date(session.endTime) - new Date(session.startTime));
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
    }, [logs]);

    const statusColors = {
        Present: '#22c55e',
        Late: '#22c55e',
        Absent: '#ef4444',
        Weekend: '#f59e42',
        'On Leave': '#3b82f6',
        'No Data': '#6b7280'
    };
    
    const startOfWeekFormatted = weekData[0]?.date.toLocaleDateString('en-CA');
    const endOfWeekFormatted = weekData[6]?.date.toLocaleDateString('en-CA');
    const todayDateString = new Date().toISOString().split('T')[0];

    return (
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
            <div className="flex gap-16" style={{ alignItems: 'center', marginBottom: 8 }}>
                <Avatar style={{ background: '#e3eafe', marginRight: 16 }}><ScheduleIcon style={{ color: '#2563eb' }} /></Avatar>
                <div>
                    <Typography variant="h6">Work Schedule</Typography>
                    <Typography variant="body2" className="text-muted">{startOfWeekFormatted} - {endOfWeekFormatted}</Typography>
                </div>
            </div>
            <div className="timeline-container" style={{ position: 'relative', marginTop: 16 }}>
                <div style={{ position: 'absolute', top: 0, left: '5%', width: '90%', background: '#e3f2fd', padding: 8, borderRadius: 8, zIndex: 5, borderLeft: '4px solid #2563eb' }}>
                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>{shift?.name || 'Morning Shift'}</Typography>
                    <Typography variant="caption" className="text-muted">{shift?.startTime} - {shift?.endTime}</Typography>
                </div>
                <div className="timeline-axis"></div>
                <div className="flex gap-16" style={{ position: 'relative', zIndex: 3, marginTop: 48 }}>
                    {weekData.map((day) => {
                        const isToday = day.date.toISOString().split('T')[0] === todayDateString;
                        return (
                            <div key={day.date.toISOString()} style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ position: 'relative', paddingTop: 16 }}>
                                    <div className={`timeline-day-dot${isToday ? ' is-today' : ''}`}></div>
                                </div>
                                <Typography variant="body2" className="text-muted">
                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    <span style={{ marginLeft: 4, padding: '2px 6px', borderRadius: '50%', background: isToday ? '#2563eb' : 'transparent', color: isToday ? '#fff' : 'inherit' }}>{day.date.getDate()}</span>
                                </Typography>
                                <Typography variant="body2" style={{ color: statusColors[day.status] || '#6b7280', fontWeight: 'bold' }}>{day.status}</Typography>
                                <Typography variant="caption" className="text-muted">
                                    {(day.status === 'Present' || day.status === 'Late') ? formatWorkHours(day.totalWorkMinutes) : ''}
                                </Typography>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default WorkSchedule;