// DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';

import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Avatar
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import InfoCard from '@/components/InfoCard';
import MyAssetsTable from '@/components/MyAssetsTable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import "../styles/DashboardPage.css";

const useCountUp = (target, duration = 1000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const stepTime = Math.max(duration / target, 20);
        const interval = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= target) clearInterval(interval);
        }, stepTime);
        return () => clearInterval(interval);
    }, [target, duration]);
    return count;
};

const KPI_Card = ({ title, value, icon, color }) => {
    const animatedValue = useCountUp(value, 600);
    return (
        <Card className="kpi-card" elevation={4}>
            <CardContent>
                <Box className="kpi-content">
                    <Box>
                        <Typography color="text.secondary" gutterBottom>{title}</Typography>
                        <Typography variant="h4" component="div" className="kpi-value">
                            {animatedValue}
                        </Typography>
                    </Box>
                    <Avatar className="kpi-avatar" sx={{ bgcolor: color }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <CircularProgress />;
    if (!stats) return <Typography>Could not load dashboard data.</Typography>;

    const totalUsers = stats.usersByRole ? Object.values(stats.usersByRole).reduce((a, b) => a + b, 0) : 0;

    return (
        <Box className="dashboard-container">
            <Typography variant="h4" className="dashboard-title">
                Dashboard Overview
            </Typography>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6} md={4}>
                    <KPI_Card title="Open Tickets" value={stats.openTickets} icon={<AssessmentIcon sx={{ fontSize: 32 }} />} color="error.main" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <KPI_Card title="Total Allocations" value={stats.totalAllocations || 0} icon={<AssignmentTurnedInIcon sx={{ fontSize: 32 }} />} color="info.main" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <KPI_Card title="Total Users" value={totalUsers} icon={<GroupIcon sx={{ fontSize: 32 }} />} color="success.main" />
                </Grid>
            </Grid>
        </Box>
    );
};

const EmployeeDashboard = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));

    const employeeDetails = {
        "Full Name": user.name,
        "Email Address": user.email,
        "Position": user.position,
        "Department": user.department,
        "Employee Code": user.employeeCode,
    };

    return (
        <Box className="dashboard-container">
            <Typography variant="h4" className="dashboard-title">
                Welcome, {user.name}
            </Typography>
            <Typography variant="h6" className="dashboard-subtitle">
                Here is your personal overview and assigned assets.
            </Typography>
            <Box className="info-card-wrapper">
                <InfoCard title="My Profile Details" data={employeeDetails} />
            </Box>
            <Box className="asset-table-wrapper">
                <MyAssetsTable />
            </Box>
        </Box>
    );
};

const DashboardPage = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const isAdminOrTech = user?.role === 'admin' || user?.role === 'technician';

    return (
        <PageLayout>
            <Box className="page-wrapper">
                {isAdminOrTech ? <AdminDashboard /> : <EmployeeDashboard />}
            </Box>
        </PageLayout>
    );
};

export default DashboardPage;
