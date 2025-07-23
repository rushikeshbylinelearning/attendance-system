import React, { useMemo } from 'react';
import { Typography, Chip, Tooltip } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddTaskIcon from '@mui/icons-material/AddTask';
import PaidIcon from '@mui/icons-material/Paid';
import '../styles/Page.css';

const getNthDayOfMonth = (date, dayOfWeek, n) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    let count = 0;
    while (count < n) {
        if (d.getDay() === dayOfWeek) { count++; }
        if (count < n) {
            d.setDate(d.getDate() + 1);
            if (d.getMonth() !== date.getMonth()) return null;
        }
    }
    return d;
};

const getStatusChipProps = (status) => {
    if (status.includes('Swap')) return { label: 'Swap Approved', color: 'success', icon: <SwapHorizIcon />, tooltip: 'Your swap request was approved.' };
    if (status.includes('Voluntary')) return { label: 'Voluntary Work', color: 'secondary', icon: <AddTaskIcon />, tooltip: 'Your voluntary work request was approved.' };
    if (status.includes('Compensation')) return { label: 'Compensating', color: 'info', icon: <PaidIcon />, tooltip: 'You are working to compensate for time.' };
    if (status === 'Working') return { label: 'Working', color: 'primary', icon: <WorkHistoryIcon />, tooltip: 'This is a scheduled workday.' };
    return { label: 'Off', color: 'default', icon: <EventBusyIcon />, tooltip: 'This is a scheduled day off.' };
};

const SaturdaySchedule = ({ policy, requests = [], count = 6 }) => {
    const schedule = useMemo(() => {
        const approvedRequestsMap = new Map();
        if (requests) {
            requests.forEach(req => {
                if (req.status === 'Approved' && req.leaveDates) {
                    const dateKey = new Date(req.leaveDates[0]).toISOString().split('T')[0];
                    approvedRequestsMap.set(dateKey, req);
                }
            });
        }
        
        const upcomingSaturdays = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        let monthOffset = 0;

        while (upcomingSaturdays.length < count) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
            
            for (let n = 1; n <= 5; n++) {
                const sat = getNthDayOfMonth(targetDate, 6, n); // 6 = Saturday
                if (sat && sat >= today && upcomingSaturdays.length < count) {
                    const dateString = sat.toISOString().split('T')[0];
                    const weekNum = n;
                    let finalStatus;

                    const approvedRequest = approvedRequestsMap.get(dateString);

                    if (approvedRequest) {
                        finalStatus = `${approvedRequest.requestType} Approved`;
                    } else {
                        // --- START OF CORRECTED LOGIC ---
                        // Default to 'Working', then find the conditions that make it 'Off'.
                        // This correctly handles all policies.
                        let isWorkingDay = true; 

                        if (policy === 'All Saturdays Off') {
                            isWorkingDay = false;
                        } else if (policy === 'Week 1 & 3 Off' && (weekNum === 1 || weekNum === 3)) {
                            isWorkingDay = false;
                        } else if (policy === 'Week 2 & 4 Off' && (weekNum === 2 || weekNum === 4)) {
                            isWorkingDay = false;
                        }
                        // If policy is 'All Saturdays Working', isWorkingDay remains true.
                        // If it's the 5th Saturday, isWorkingDay also remains true.
                        
                        finalStatus = isWorkingDay ? 'Working' : 'Off';
                        // --- END OF CORRECTED LOGIC ---
                    }
                    upcomingSaturdays.push({ date: sat, status: finalStatus });
                }
            }
            monthOffset++;
            if (monthOffset > 12) break;
        }
        return upcomingSaturdays;

    }, [policy, requests, count]);

    return (
        <div className="card">
            <Typography variant="h6" gutterBottom>Upcoming Saturday Schedule</Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {schedule.map(({ date, status }) => {
                    const chipProps = getStatusChipProps(status);
                    return (
                        <div key={date.toISOString()} className="flex-between-center">
                            <Typography variant="body1">
                                {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </Typography>
                            <Tooltip title={chipProps.tooltip}>
                                <Chip
                                    label={chipProps.label}
                                    icon={chipProps.icon}
                                    color={chipProps.color}
                                    variant="outlined"
                                    size="small"
                                />
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SaturdaySchedule;