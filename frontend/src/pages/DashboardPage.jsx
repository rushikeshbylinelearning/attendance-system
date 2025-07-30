// src/pages/DashboardPage.jsx (Corrected)

// Keep all existing imports at the top of your file
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';
import MyAssetsTable from '@/components/MyAssetsTable';
import { Box, Typography, CircularProgress } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIcon from '@mui/icons-material/Phone';
import TabletIcon from '@mui/icons-material/Tablet';
import CategoryIcon from '@mui/icons-material/Category';
import ListAltIcon from '@mui/icons-material/ListAlt';

import '../styles/DashboardPage.css';

// ComponentDetailModal and other components remain unchanged...
const ComponentDetailModal = ({ isOpen, onClose, title, data }) => {
    const [activeFilters, setActiveFilters] = useState({});

    const toCamelCase = (str) => {
        if (!str) return '';
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        ).replace(/\s+/g, '');
    };
    
    const componentConfigurations = {
        Monitor: {
            columns: ['Brand', 'Model', 'Serial Number', 'Screen Size', 'Status'],
            filters: [ { key: 'brand', label: 'Brand' }, { key: 'screenSize', label: 'Screen Size' } ],
            getValue: (item, key) => {
                switch(key) {
                    case 'brand': return item.brand;
                    case 'model': return item.model;
                    case 'serialNumber': return item.serialNumber;
                    case 'screenSize': {
                        if (item.specifications?.screenSize) return item.specifications.screenSize;
                        const match = item.model?.match(/(\d{2,3})\s?(inch|")/i);
                        return match ? `${match[1]}"` : null;
                    }
                    case 'status': return item.status === 'Assigned' ? 'In Use' : 'Available';
                    default: return 'N/A';
                }
            }
        },
        CPU: {
            columns: ['Brand', 'Model', 'Serial Number', 'Processor', 'RAM', 'Storage', 'Status'],
            filters: [ { key: 'brand', label: 'Brand' }, { key: 'processor', label: 'Processor' }, { key: 'ram', label: 'RAM' } ],
            getValue: (item, key) => {
                switch(key) {
                    case 'brand': return item.brand;
                    case 'model': return item.model;
                    case 'serialNumber': return item.serialNumber;
                    case 'processor': return item.specifications?.processor;
                    case 'ram': return item.specifications?.ram;
                    case 'storage': return item.specifications?.storage;
                    case 'status': return item.status === 'Assigned' ? 'In Use' : 'Available';
                    default: return 'N/A';
                }
            }
        },
        Laptop: {
            columns: ['Brand', 'Model', 'Serial Number', 'Processor', 'RAM', 'Storage', 'Status'],
            filters: [ { key: 'brand', label: 'Brand' }, { key: 'ram', label: 'RAM' } ],
            getValue: (item, key) => {
                switch(key) {
                    case 'brand': return item.brand;
                    case 'model': return item.model;
                    case 'serialNumber': return item.serialNumber;
                    case 'processor': return item.specifications?.processor;
                    case 'ram': return item.specifications?.ram;
                    case 'storage': return item.specifications?.storage;
                    case 'status': return item.status === 'Assigned' ? 'In Use' : 'Available';
                    default: return 'N/A';
                }
            }
        },
        default: {
            columns: ['Brand', 'Model', 'Serial Number', 'Status'],
            filters: [{ key: 'brand', label: 'Brand' }],
             getValue: (item, key) => {
                switch(key) {
                    case 'brand': return item.brand;
                    case 'model': return item.model;
                    case 'serialNumber': return item.serialNumber;
                    case 'status': return item.status === 'Assigned' ? 'In Use' : 'Available';
                    default: return 'N/A';
                }
            }
        }
    };

    const componentKey = Object.keys(componentConfigurations).find(key => title.toLowerCase().includes(key.toLowerCase())) || 'default';
    const config = componentConfigurations[componentKey];
    
    useEffect(() => {
        if (isOpen) { setActiveFilters({}); }
        const handleEsc = (event) => { if (event.keyCode === 27) onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleFilterChange = (key, value) => { setActiveFilters(prev => ({ ...prev, [key]: value })); };
    const handleClearFilters = () => { setActiveFilters({}); };
    
    const filterOptions = useMemo(() => {
        if (!data || !config.filters) return {};
        const options = {};
        config.filters.forEach(filter => {
            const values = [...new Set(data.map(item => config.getValue(item, filter.key)))];
            options[filter.key] = values.filter(Boolean).sort();
        });
        return options;
    }, [data, config]);
    
    const filteredData = useMemo(() => {
        if (!Object.keys(activeFilters).length) return data;
        return data.filter(item => {
            return Object.entries(activeFilters).every(([key, value]) => {
                if (!value) return true;
                return config.getValue(item, key) === value;
            });
        });
    }, [data, activeFilters, config]);

    if (!isOpen) return null;

    const areFiltersActive = Object.values(activeFilters).some(v => v);

    return (
        <div className="modal-backdrop-new" onClick={onClose}>
            <div className="modal-container-new" onClick={e => e.stopPropagation()}>
                <div className="modal-header-new">
                    <div className="modal-header-main-new">
                        <div className="modal-title-group-new">
                           <div className="modal-title-icon-new"><ListAltIcon fontSize="inherit" /></div>
                            <h3 className="modal-title-new">{title} Inventory</h3>
                        </div>
                        <p className="modal-subtitle-new">Viewing {filteredData.length} of {data.length} total items.{areFiltersActive && ' (Filters Applied)'}</p>
                    </div>
                    <button className="modal-close-btn-new" onClick={onClose}>×</button>
                </div>
                <div className="modal-filters-new">
                    {config.filters.map(filter => (
                        <div key={filter.key} className="filter-group-new">
                            <label htmlFor={filter.key}>{filter.label}</label>
                            <select id={filter.key} className="filter-select-new" value={activeFilters[filter.key] || ''} onChange={(e) => handleFilterChange(filter.key, e.target.value)}>
                                <option value="">All {filter.label}s</option>
                                {filterOptions[filter.key]?.map(option => (<option key={option} value={option}>{option}</option>))}
                            </select>
                        </div>
                    ))}
                    {areFiltersActive && (<button className="filter-clear-btn-new" onClick={handleClearFilters}>Clear</button>)}
                </div>
                <div className="modal-body-new">
                    <div className="detail-table-wrapper-new">
                        <table className="detail-table-new">
                            <thead><tr><th>#</th>{config.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
                            <tbody>
                                {filteredData.length > 0 ? filteredData.map((item, index) => (
                                    <tr key={item._id}>
                                        <td>{index + 1}</td>
                                        {config.columns.map(col => (<td key={col}>{config.getValue(item, toCamelCase(col)) || '—'}</td>))}
                                    </tr>
                                )) : ( <tr><td colSpan={config.columns.length + 1} className="table-empty-state-new">No items match your current filters.</td></tr> )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const useCountUp = (target, duration = 1000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const numericTarget = Number(target) || 0;
        if (count === numericTarget) return;
        let start = count;
        const increment = (numericTarget - start) / (duration / 16);
        if (increment === 0) return;
        let current = start;
        const interval = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= numericTarget) || (increment < 0 && current <= numericTarget)) {
                setCount(numericTarget);
                clearInterval(interval);
            } else {
                setCount(Math.round(current));
            }
        }, 16);
        return () => clearInterval(interval);
    }, [target, count, duration]);
    return count;
};

const DashboardStatsCard = ({ title, count, icon, className, path, subtitle }) => {
    const navigate = useNavigate();
    const animatedValue = useCountUp(count || 0);
    const handleCardClick = () => { if (path) navigate(path); };

    return (
        <div className={`dashboard-stats-card ${className || ''}`} onClick={handleCardClick} style={{ cursor: path ? 'pointer' : 'default' }}>
            <div className="dashboard-stats-card-icon">{icon}</div>
            <div className="dashboard-stats-card-content">
                <div className="dashboard-stats-card-title">{title}</div>
                <div className="dashboard-stats-card-count">{animatedValue}</div>
                {subtitle && <div className="dashboard-stats-card-subtitle">{subtitle}</div>}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            setError(null);
            const [statsResponse, inventoryResponse] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get(`/inventory?_t=${new Date().getTime()}`)
            ]);
            const inventoryData = inventoryResponse.data;
            const componentCounts = inventoryData.reduce((acc, item) => {
                const type = item.componentType || 'Other';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            setInventory(inventoryData);
            setStats({ ...statsResponse.data, totalAssets: inventoryData.length, componentCounts });
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Failed to fetch initial dashboard data:", err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const updateLiveStats = async () => {
            try {
                const [liveUpdatesResponse, inventoryResponse] = await Promise.all([
                    api.get('/dashboard/live-updates'),
                    api.get(`/inventory?_t=${new Date().getTime()}`)
                ]);
                const liveData = liveUpdatesResponse.data;
                const inventoryData = inventoryResponse.data;
                setInventory(inventoryData);
                const componentCounts = inventoryData.reduce((acc, item) => {
                  const type = item.componentType || 'Other';
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {});
                setStats(prev => ({ ...prev, ...liveData, totalAssets: inventoryData.length, componentCounts: componentCounts }));
                setLastUpdate(new Date());
            } catch (err) { console.error("Live update failed:", err); }
        };
        const interval = setInterval(updateLiveStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleComponentClick = (componentType) => {
      const filteredData = inventory.filter(item => item.componentType === componentType);
      setModalData(filteredData);
      setModalTitle(`${componentType}`);
      setIsModalOpen(true);
    };

    if (loading) return <div className="dashboard-loading"><div className="dashboard-loading-spinner"></div><div className="dashboard-loading-text">Loading live dashboard data...</div></div>;
    if (error) return <div className="dashboard-error"><div className="dashboard-error-icon">⚠️</div><div className="dashboard-error-title">{error}</div><div className="dashboard-error-description">Please try refreshing the page.</div><button className="dashboard-quick-action-btn" onClick={fetchDashboardData}>Retry</button></div>;
    if (!stats) return <div className="dashboard-error"><div className="dashboard-error-icon">⚠️</div><div className="dashboard-error-title">Could not load dashboard data</div></div>;

    const { totalUsers = 0, assetCategories = {}, openTickets = 0, totalAllocations = 0, totalAssets = 0, closedTickets = 0, pendingTickets = 0, totalTickets = 0, systemHealth = { uptime: 0 }, componentCounts = {} } = stats;

    return (
        // ===== FIX: The React Fragment <> is replaced with the main container div =====
        <div className="dashboard-page-container">
            <div className="dashboard-content-wrapper">
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <div className="dashboard-title-section">
                            <h1 className="dashboard-main-title">Dashboard Overview</h1>
                            <p className="dashboard-subtitle">Live IT Management Dashboard</p>
                            <div className="dashboard-last-update">Last updated: {lastUpdate.toLocaleTimeString()}</div>
                        </div>
                        <div className="dashboard-stats">
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{totalUsers}</div><div className="dashboard-stat-label">Total Users</div></div>
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{openTickets}</div><div className="dashboard-stat-label">Open Tickets</div></div>
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{totalAllocations}</div><div className="dashboard-stat-label">Allocations</div></div>
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{totalAssets}</div><div className="dashboard-stat-label">Total Assets</div></div>
                        </div>
                    </div>
                </div>
                <div className="dashboard-kpi-section">
                    <div className="dashboard-stats-grid"><div className="dashboard-stats-horizontal">
                        <DashboardStatsCard title="Total Users" count={totalUsers} icon={<GroupIcon />} className="total-users" path="/users" subtitle="Active users in system" />
                        <DashboardStatsCard title="Open Tickets" count={openTickets} icon={<AssessmentIcon />} className="open-tickets" path="/tickets?status=Open" subtitle="Tickets requiring attention" />
                        <DashboardStatsCard title="Total Allocations" count={totalAllocations} icon={<AssignmentTurnedInIcon />} className="total-allocations" path="/allocations" subtitle="Asset assignments" />
                    </div></div>
                    <div className="dashboard-stats-grid"><div className="dashboard-stats-horizontal">
                        <DashboardStatsCard title="Total Assets" count={totalAssets} icon={<InventoryIcon />} className="total-assets" path="/inventory" subtitle="All inventory items" />
                        <DashboardStatsCard title="Closed Tickets" count={closedTickets} icon={<CheckCircleIcon />} className="closed-tickets" path="/tickets?status=Closed" subtitle="Resolved issues" />
                        <DashboardStatsCard title="Pending Tickets" count={pendingTickets} icon={<WarningIcon />} className="pending-tickets" path="/tickets?status=In Progress" subtitle="Awaiting review" />
                    </div></div>
                    {Object.keys(assetCategories).length > 0 && (<div className="dashboard-stats-grid"><div className="dashboard-stats-horizontal">
                        {Object.entries(assetCategories).map(([category, count]) => (<DashboardStatsCard key={category} title={`${category} Assets`} count={count} icon={category.toLowerCase().includes('computer') ? <ComputerIcon /> : category.toLowerCase().includes('phone') ? <PhoneIcon /> : category.toLowerCase().includes('tablet') ? <TabletIcon /> : <InventoryIcon />} className={`asset-category-${category.toLowerCase().replace(/\s+/g, '-')}`} subtitle={`${category} category`} />))}
                    </div></div>)}
                </div>
                <div className="dashboard-content-section">
                    <div className="dashboard-info-card-wrapper">
                        <div className="dashboard-info-card-header"><h3 className="dashboard-info-card-title">📊 System Overview</h3></div>
                        <div className="dashboard-info-card-content">
                            <div className="system-metrics">
                                <div className="metric-item"><span className="metric-label">Total Tickets:</span><span className="metric-value">{totalTickets}</span></div>
                                <div className="metric-item"><span className="metric-label">Resolution Rate:</span><span className="metric-value">{totalTickets ? Math.round((closedTickets / totalTickets) * 100) : 0}%</span></div>
                                <div className="metric-item"><span className="metric-label">System Uptime:</span><span className="metric-value">{Math.round(systemHealth.uptime / 3600)}h</span></div>
                            </div>
                            <div className="dashboard-quick-actions">
                                <button className="dashboard-quick-action-btn" onClick={() => navigate('/tickets')}>View Tickets</button>
                                <button className="dashboard-quick-action-btn secondary" onClick={() => navigate('/inventory')}>Manage Inventory</button>
                                <button className="dashboard-quick-action-btn" style={{ background: '#2563eb', color: 'white' }} onClick={() => navigate('/admin/manage-data')}>Manage Data</button>
                                <button className="dashboard-quick-action-btn success" onClick={() => navigate('/users')}>User Management</button>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-asset-table-wrapper">
                        <div className="dashboard-asset-table-header"><h3 className="dashboard-asset-table-title"><CategoryIcon style={{ marginRight: '8px', verticalAlign: 'bottom' }} />Component Breakdown</h3></div>
                        <div className="dashboard-asset-table-content">
                            {Object.keys(componentCounts).length > 0 ? (<div className="component-breakdown-list">
                                {Object.entries(componentCounts).sort((a, b) => b[1] - a[1]).map(([component, count]) => (
                                    <div key={component} className="component-item" onClick={() => handleComponentClick(component)}>
                                        <span className="component-name">{component}</span>
                                        <span className="component-count">{count}</span>
                                    </div>
                                ))}
                            </div>) : (<p>No component data available.</p>)}
                        </div>
                    </div>
                </div>
            </div>
            {/* ===== FIX: The modal is now INSIDE the main container ===== */}
            <ComponentDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} data={modalData} />
        </div>
    );
};

const EmployeeDashboard = () => {
    // This component's structure is correct, no changes needed here.
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const user = JSON.parse(sessionStorage.getItem('user'));
    const navigate = useNavigate();

    const fetchUserDashboardData = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get('/dashboard/my-dashboard');
            setUserStats(response.data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Failed to fetch user dashboard data:", error);
            setError('Failed to load your dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserDashboardData();
        const interval = setInterval(fetchUserDashboardData, 30000);
        return () => clearInterval(interval);
    }, [fetchUserDashboardData]);

    if (!user) { return <div className="dashboard-loading"><div className="dashboard-loading-spinner"></div><div className="dashboard-loading-text">Loading user data...</div></div>; }
    if (loading) { return <div className="dashboard-loading"><div className="dashboard-loading-spinner"></div><div className="dashboard-loading-text">Loading your dashboard...</div></div>; }
    if (error) { return <div className="dashboard-error"><div className="dashboard-error-icon">⚠️</div><div className="dashboard-error-title">{error}</div><div className="dashboard-error-description">Please try refreshing the page.</div><button className="dashboard-quick-action-btn" onClick={fetchUserDashboardData}>Retry</button></div>; }

    const employeeDetails = { "Full Name": user.name, "Email Address": user.email, "Position": user.position, "Department": user.department, "Employee Code": user.employeeCode };

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-content-wrapper">
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <div className="dashboard-title-section">
                            <h1 className="dashboard-main-title">Welcome, {user.name}</h1>
                            <p className="dashboard-subtitle">Your personal IT dashboard</p>
                            {lastUpdate && <div className="dashboard-last-update">Last updated: {lastUpdate.toLocaleTimeString()}</div>}
                        </div>
                        <div className="dashboard-stats">
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{userStats?.myAssets || 0}</div><div className="dashboard-stat-label">My Assets</div></div>
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{userStats?.myOpenTickets || 0}</div><div className="dashboard-stat-label">Active Tickets</div></div>
                            <div className="dashboard-stat-item"><div className="dashboard-stat-number">{userStats?.myCompletedTickets || 0}</div><div className="dashboard-stat-label">Completed Tasks</div></div>
                        </div>
                    </div>
                </div>
                <div className="dashboard-kpi-section">
                    <div className="dashboard-stats-grid"><div className="dashboard-stats-horizontal">
                        <DashboardStatsCard title="My Assets" count={userStats?.myAssets} icon={<InventoryIcon />} className="my-assets" path="/my-analytics" subtitle="Assigned to you" />
                        <DashboardStatsCard title="Active Tickets" count={userStats?.myOpenTickets} icon={<AssessmentIcon />} className="my-tickets" path="/tickets?status=Open" subtitle="Requiring attention" />
                        <DashboardStatsCard title="Completed Tasks" count={userStats?.myCompletedTickets} icon={<CheckCircleIcon />} className="completed-tasks" path="/tickets?status=Closed" subtitle="Successfully resolved" />
                    </div></div>
                </div>
                <div className="dashboard-content-section">
                    <div className="dashboard-info-card-wrapper">
                        <div className="dashboard-info-card-header"><h3 className="dashboard-info-card-title">👤 My Profile Details</h3></div>
                        <div className="dashboard-info-card-content"><div className="profile-details">
                            {Object.entries(employeeDetails).map(([key, value]) => (
                                <div key={key} className="profile-detail-item"><span className="profile-detail-label">{key}:</span><span className="profile-detail-value">{value}</span></div>
                            ))}
                        </div></div>
                    </div>
                    <div className="dashboard-asset-table-wrapper">
                        <div className="dashboard-asset-table-header"><h3 className="dashboard-asset-table-title">💼 My Assigned Assets</h3></div>
                        <div className="dashboard-asset-table-content"><MyAssetsTable /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        return <PageLayout><div className="dashboard-loading"><div className="dashboard-loading-spinner"></div><div className="dashboard-loading-text">Loading user session...</div></div></PageLayout>;
    }
    const isAdminOrTech = user?.role === 'admin' || user?.role === 'technician';
    return <PageLayout>{isAdminOrTech ? <AdminDashboard /> : <EmployeeDashboard />}</PageLayout>;
};

export default DashboardPage;