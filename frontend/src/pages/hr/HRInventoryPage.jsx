import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import api from '@/services/api'; // Real API is disabled for testing
import '@/styles/HRInventoryPage.css';

// --- TEMPORARY MOCK DATA FOR TESTING ---

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

// --- ICONS (No changes here) ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm-4.208 6.06L6.5 5.207 2.75 8.957 2.25 12l3.043-.543L8.646 6.206zM16 14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/>
  </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

const defaultForm = { type: '', name: '', brand: '', quantity: 1, status: 'Available', assignedTo: '', purchaseDate: '', assignedDate: '', remarks: '' };

const HRInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // For reading URL parameters

  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    // --- Mock Data Fetching ---
    // This simulates an API call and loads the mock data after 1 second.
    const fetchMockData = () => {
      setLoading(true);
      setTimeout(() => {
        setItems(mockItems);
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    };

    fetchMockData();
    
    // --- REAL API CALLS (DISABLED) ---
    // const fetchItems = () => {
    //   setLoading(true);
    //   api.get('/hr-inventory')
    //     .then(res => setItems(Array.isArray(res.data) ? res.data : []))
    //     .catch(() => setItems([]))
    //     .finally(() => setLoading(false));
    // };
    // const fetchUsers = () => {
    //   api.get('/users').then(res => setUsers(Array.isArray(res.data) ? res.data : []));
    // };
    // fetchItems();
    // fetchUsers();
  }, []);

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredItems = useMemo(() => {
    let tempItems = [...items];

    // 1. Apply category filter from URL if it exists
    if (categoryFilter) {
      tempItems = tempItems.filter(item => item.type === categoryFilter);
    }
    
    // 2. Apply search term filter
    if (searchTerm) {
      tempItems = tempItems.filter(item =>
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.assignedTo?.name.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    return tempItems;
  }, [items, searchTerm, categoryFilter]);
  
  const handleClearFilter = () => {
      setSearchParams({}); // Removes all query parameters from URL
  }

  const handleOpenModal = (item) => {
    setEditId(item?._id || null);
    setForm(item ? { ...item, assignedTo: item.assignedTo?._id || '' } : defaultForm);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.type || !form.name || !form.quantity) return;

    const payload = { ...form };
    
    if (form.assignedTo) {
        payload.status = 'Assigned';
        payload.assignedDate = payload.assignedDate || new Date().toISOString().slice(0, 10);
        payload.assignedTo = users.find(u => u._id === form.assignedTo);
    } else {
        payload.status = 'Available';
        payload.assignedTo = null;
        payload.assignedDate = null;
    }
    payload.quantity = parseInt(payload.quantity, 10) || 0;

    // --- MOCK SAVE LOGIC (updates local state) ---
    if (editId) {
      setItems(prev => prev.map(item => item._id === editId ? { ...payload, _id: editId } : item));
    } else {
      const newItem = { ...payload, _id: `item-${Date.now()}`, createdAt: new Date().toISOString() };
      setItems(prev => [newItem, ...prev]);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
        // --- MOCK DELETE LOGIC ---
        setItems(prev => prev.filter(item => item._id !== id));
    }
  };
  
  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setForm(prev => ({...prev, [name]: value}));
  }

  const getStatusChipClass = (status) => {
    const statusClass = status?.toLowerCase().replace(/ /g, '-') || 'available';
    return `status-chip status-${statusClass}`;
  };

  const renderTable = () => (
    <div className="hr-inventory-table-container">
      <table className="hr-inventory-list-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name/Brand</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <tr key={item._id}>
              <td data-label="Type">{item.type}</td>
              <td data-label="Name/Brand">{item.name} {item.brand && `(${item.brand})`}</td>
              <td data-label="Assigned To">{item.assignedTo?.name || 'N/A'}</td>
              <td data-label="Status"><span className={getStatusChipClass(item.status)}>{item.status}</span></td>
              <td data-label="Quantity">{item.quantity}</td>
              <td data-label="Actions" className="actions-cell">
                <button className="action-btn" onClick={() => handleOpenModal(item)}><EditIcon /></button>
                <button className="action-btn delete" onClick={() => handleDelete(item._id)}><DeleteIcon /></button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>No inventory items found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLoading = () => (
    <div className="hr-inventory-page-feedback-wrapper">
        <div className="hr-inventory-page-loading">
            <div className="hr-inventory-page-spinner"></div>
            <p className="hr-inventory-page-loading-text">Loading Inventory...</p>
        </div>
    </div>
  );

  return (
    <div className="hr-inventory-page-container">
      <div className="hr-inventory-content-wrapper">
        <header className="hr-inventory-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
                <h1 className="hr-inventory-list-title">HR Inventory</h1>
                <div className="dashboard-nav-buttons">
                    <button className="nav-btn" onClick={() => navigate('/hr')}>Dashboard</button>
                    <button className="nav-btn active">Inventory</button>
                </div>
            </div>
          <button className="new-item-btn" onClick={() => handleOpenModal()}>
            <PlusIcon /> Add Item
          </button>
        </header>

        <div className="hr-inventory-filters-container">
          <div className="filter-input-group">
            <input 
              type="text" 
              className="filter-input"
              placeholder="Search by name, type, brand or assigned person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Active Filter Display */}
        {categoryFilter && (
            <div className="active-filter-bar">
                <span>Showing category: <strong>{categoryFilter}</strong></span>
                <button onClick={handleClearFilter}>× Clear Filter</button>
            </div>
        )}

        {loading ? renderLoading() : renderTable()}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h2>{editId ? 'Edit Item' : 'Add New Item'}</h2>
                <button type="button" className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <input id="type" name="type" type="text" value={form.type} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input id="name" name="name" type="text" value={form.name} onChange={handleInputChange} required />
                  </div>
                   <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <input id="brand" name="brand" type="text" value={form.brand} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="purchaseDate">Purchase Date</label>
                    <input id="purchaseDate" name="purchaseDate" type="date" value={form.purchaseDate ? form.purchaseDate.slice(0, 10) : ''} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="assignedTo">Assigned To</label>
                    <select id="assignedTo" name="assignedTo" value={form.assignedTo} onChange={handleInputChange}>
                      <option value="">-- Unassigned --</option>
                      {safeUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.employeeId})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="remarks">Remarks</label>
                  <textarea id="remarks" name="remarks" rows="3" value={form.remarks} onChange={handleInputChange}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRInventoryPage;