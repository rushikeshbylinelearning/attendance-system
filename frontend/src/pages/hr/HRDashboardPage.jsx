import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHRInventory } from './HRInventoryPage'; // ✅ Imports the shared hook to get live data
import '@/styles/HRDashboardPage.css';

// ===================================================================================
//
//  UI SUB-COMPONENTS
//
// ===================================================================================
const DashboardHeader = React.memo(() => {
    const navigate = useNavigate();
    return (
        <header className="hr-dashboard-header">
            <h1 className="hr-dashboard-title">HR Inventory Dashboard</h1>
            <div className="dashboard-nav-buttons">
                <button className="nav-btn active">Dashboard</button>
                <button className="nav-btn" onClick={() => navigate('/hr/inventory')}>Inventory</button>
            </div>
        </header>
    );
});

const CategoryGrid = React.memo(({ categories, onCardClick }) => {
    if (categories.length === 0) {
        return (
            <div className="dashboard-card">
                <p className="card-title">No inventory categories found.</p>
                <p className="card-description">Add items in the inventory page to see them here.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            {categories.map(([category, count]) => (
                <div 
                    key={category} 
                    className="dashboard-card clickable" 
                    onClick={() => onCardClick(category)}
                    title={`Click to view all ${category} items`}
                >
                    <p className="card-title">{category}</p>
                    <p className="card-value">{count}</p>
                    <p className="card-description">Total Items</p>
                </div>
            ))}
        </div>
    );
});

const RecentItemsList = React.memo(({ items }) => (
    <div className="dashboard-card list-card">
        <ul>
            {items.length > 0 ? items.map(i => (
                <li key={i._id}>
                    <strong>{i.type}</strong> - {i.name} ({i.brand || 'N/A'})
                </li>
            )) : <li>No recent items have been added.</li>}
        </ul>
    </div>
));

const FeedbackDisplay = ({ loading, error }) => {
    if (loading) {
        return (
            <div className="hr-dashboard-feedback-wrapper">
                <div className="hr-dashboard-loading">
                    <div className="hr-dashboard-spinner"></div>
                    <p className="hr-dashboard-loading-text">Loading Dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return <div className="feedback-message error">{error}</div>;
    }
    return null;
};


// ===================================================================================
//
//  MAIN PAGE COMPONENT
//
// ===================================================================================
const HRDashboardPage = () => {
    // ✅ Consumes the shared, live data via the custom hook
    const { items, loading, error } = useHRInventory();
    const navigate = useNavigate();

    // useMemo will recalculate the dashboard stats only when the shared `items` array changes.
    const dashboardData = useMemo(() => {
        const safeItems = Array.isArray(items) ? items : [];

        const categoryCounts = safeItems.reduce((acc, item) => {
            const category = item.type || 'Uncategorized';
            acc[category] = (acc[category] || 0) + (item.quantity || 0);
            return acc;
        }, {});

        return {
            categoryList: Object.entries(categoryCounts).sort((a, b) => a[0].localeCompare(b[0])),
            recent: [...safeItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        };
    }, [items]);

    const handleCardClick = (category) => {
        navigate(`/hr/inventory?category=${encodeURIComponent(category)}`);
    };

    const renderDashboardContent = () => (
        <div className="dashboard-content-area">
            <h3 className="dashboard-section-title">Inventory by Category</h3>
            <CategoryGrid categories={dashboardData.categoryList} onCardClick={handleCardClick} />

            <h3 className="dashboard-section-title">Recently Added Items</h3>
            <RecentItemsList items={dashboardData.recent} />
        </div>
    );

    return (
        <div className="hr-dashboard-page">
            <div className="hr-dashboard-content-wrapper">
                <DashboardHeader />
                <div className="dashboard-scroll-container">
                    <FeedbackDisplay loading={loading} error={error} />
                    {!loading && !error && renderDashboardContent()}
                </div>
            </div>
        </div>
    );
};

export default HRDashboardPage;