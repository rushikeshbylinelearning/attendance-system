import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios'; // Real API call is disabled for testing
import '@/styles/HRDashboardPage.css'; // Your unified CSS file

// --- TEMPORARY MOCK DATA (Copied from HRInventoryPage for consistency) ---
const mockUsers = [
  { _id: 'user-1', name: 'John Doe', employeeId: 'EMP101' },
  { _id: 'user-2', name: 'Jane Smith', employeeId: 'EMP102' },
  { _id: 'user-3', name: 'Peter Jones', employeeId: 'EMP103' },
];

const mockItems = [
  { _id: 'item-1', type: 'Electronics', name: 'Laptop', brand: 'Dell XPS 15', quantity: 1, status: 'Assigned', assignedTo: mockUsers[1], purchaseDate: '2023-01-15', assignedDate: '2023-01-20', remarks: 'Primary work machine', createdAt: '2023-01-15T10:00:00Z' },
  { _id: 'item-2', type: 'Electronics', name: 'Keyboard', brand: 'Logitech MX', quantity: 5, status: 'Available', assignedTo: null, purchaseDate: '2023-05-20', assignedDate: null, remarks: 'Spare keyboards', createdAt: '2023-05-20T11:00:00Z' },
  { _id: 'item-3', type: 'Stationery', name: 'Blue Pens', brand: 'Parker', quantity: 50, status: 'Available', assignedTo: null, purchaseDate: '2023-08-01', assignedDate: null, remarks: '', createdAt: '2023-08-01T09:00:00Z' },
  { _id: 'item-4', type: 'Stationery', name: 'Notebooks', brand: 'Moleskine', quantity: 25, status: 'Available', assignedTo: null, purchaseDate: '2023-08-01', assignedDate: null, remarks: 'A5 size', createdAt: '2023-08-01T09:05:00Z' },
  { _id: 'item-5', type: 'Pantry Supplies', name: 'Coffee Beans', brand: 'Starbucks', quantity: 10, status: 'Available', assignedTo: null, purchaseDate: '2023-09-10', assignedDate: null, remarks: 'For main coffee machine', createdAt: '2023-09-10T14:00:00Z' },
  { _id: 'item-6', type: 'Electronics', name: 'Monitor', brand: 'LG UltraWide', quantity: 1, status: 'Assigned', assignedTo: mockUsers[0], purchaseDate: '2022-11-05', assignedDate: '2022-11-10', remarks: '', createdAt: '2022-11-05T15:00:00Z' },
  { _id: 'item-7', type: 'Furniture', name: 'Office Chair', brand: 'Herman Miller', quantity: 8, status: 'Available', assignedTo: null, purchaseDate: '2021-02-15', assignedDate: null, remarks: 'Ergonomic chairs', createdAt: '2021-02-15T16:00:00Z' },
  { _id: 'item-8', type: 'Stationery', name: 'Whiteboard Markers', brand: 'Expo', quantity: 30, status: 'Available', assignedTo: null, purchaseDate: '2023-08-15', assignedDate: null, remarks: 'Assorted colors', createdAt: '2023-08-15T12:00:00Z' },
];


const HRDashboardPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // --- Mock Data Fetching ---
    // This simulates an API call and loads the mock data after 1 second.
    setLoading(true);
    setTimeout(() => {
      setItems(mockItems);
      setLoading(false);
    }, 1000);
    
    // --- REAL API CALL (DISABLED FOR TESTING) ---
    // setLoading(true);
    // axios.get('/api/hr-inventory')
    //   .then(res => {
    //     setItems(Array.isArray(res.data) ? res.data : []);
    //   })
    //   .catch((error) => {
    //     console.error("Dashboard API Error:", error); // Added logging
    //     setItems([]);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
  }, []);

  // --- Data Calculations ---
  const safeItems = Array.isArray(items) ? items : [];

  const categoryCounts = safeItems.reduce((acc, item) => {
    const category = item.type || 'Uncategorized';
    acc[category] = (acc[category] || 0) + (item.quantity || 0);
    return acc;
  }, {});

  const categoryList = Object.entries(categoryCounts).sort((a, b) => a[0].localeCompare(b[0]));

  const recent = [...safeItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const handleCardClick = (category) => {
    navigate(`/hr/inventory?category=${encodeURIComponent(category)}`);
  };

  const renderLoading = () => (
    <div className="hr-dashboard-feedback-wrapper">
      <div className="hr-dashboard-loading">
        <div className="hr-dashboard-spinner"></div>
        <p className="hr-dashboard-loading-text">Loading Dashboard...</p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-content-area">
      <h3 className="dashboard-section-title">Inventory by Category</h3>
      <div className="dashboard-grid">
        {categoryList.length > 0 ? categoryList.map(([category, count]) => (
          <div 
            key={category} 
            className="dashboard-card clickable" 
            onClick={() => handleCardClick(category)}
            title={`Click to view all ${category} items`}
          >
            <p className="card-title">{category}</p>
            <p className="card-value">{count}</p>
            <p className="card-description">Total Items</p>
          </div>
        )) : (
          <div className="dashboard-card">
            <p className="card-title">No inventory categories found.</p>
          </div>
        )}
      </div>

      <h3 className="dashboard-section-title">Recently Added Items</h3>
      <div className="dashboard-card list-card">
        <ul>
          {recent.length > 0 ? recent.map(i => (
            <li key={i._id}>
              <strong>{i.type}</strong> - {i.name} ({i.brand || 'N/A'})
            </li>
          )) : <li>No recent items found.</li>}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="hr-dashboard-page">
      <div className="hr-dashboard-content-wrapper">
        <header className="hr-dashboard-header">
          <h1 className="hr-dashboard-title">HR Inventory Dashboard</h1>
          <div className="dashboard-nav-buttons">
            <button className="nav-btn active">Dashboard</button>
            <button className="nav-btn" onClick={() => navigate('/hr/inventory')}>Inventory</button>
          </div>
        </header>
        <div className="dashboard-scroll-container">
          {loading ? renderLoading() : renderDashboard()}
        </div>
      </div>
    </div>
  );
};

export default HRDashboardPage;