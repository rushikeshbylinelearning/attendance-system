import React, { useEffect, useState, useMemo, useCallback, createContext, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api'; // ✅ API service is now used
import '@/styles/HRInventoryPage.css';

// ===================================================================================
//
//  IN-FILE CONFIGURATION
//
//  - Mock data has been removed. The component now uses the real API.
//
// ===================================================================================
const USE_MOCK_DATA = false; // Set to false to use the real API
// ===================================================================================


// ===================================================================================
// STEP 1: ICONS & DEFAULTS
// ===================================================================================
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm-4.208 6.06L6.5 5.207 2.75 8.957 2.25 12l3.043-.543L8.646 6.206zM16 14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;

const defaultForm = { type: '', name: '', brand: '', quantity: 1, status: 'available', assignedTo: '', purchaseDate: '', assignedDate: '', remarks: '' };

// ===================================================================================
// SHARED CONTEXT & PROVIDER
// ===================================================================================
const HRInventoryContext = createContext(null);

export const HRInventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (USE_MOCK_DATA) { // This block can be removed, but kept for toggling if needed
        setError("Mock data is not available. Please switch to API mode.");
        setLoading(false);
        return;
    }
    // ✅ FETCH REAL DATA FROM THE API
    try {
      const [itemsResponse, usersResponse] = await Promise.all([
        api.get('/hr-inventory'),
        api.get('/users') // Assuming an endpoint to fetch all users exists
      ]);
      setItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
    } catch (err) {
      console.error("API Fetch Error:", err);
      setError("Failed to fetch inventory data. Please check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveItem = async (itemData) => {
    const isEditing = !!itemData._id;
    try {
      const endpoint = isEditing ? `/hr-inventory/${itemData._id}` : '/hr-inventory';
      // ✅ USE REAL API FOR SAVING
      await api[isEditing ? 'put' : 'post'](endpoint, itemData);
      await fetchData(); // Refresh data after save
      return { success: true, message: `Item ${isEditing ? 'updated' : 'added'} successfully.` };
    } catch (err) {
      console.error("API Save Error:", err);
      return { success: false, message: `Failed to ${isEditing ? 'update' : 'add'} item.` };
    }
  };

  const deleteItem = async (itemId) => {
    try {
      // ✅ USE REAL API FOR DELETING
      await api.delete(`/hr-inventory/${itemId}`);
      await fetchData(); // Refresh data after delete
      return { success: true, message: 'Item deleted successfully.' };
    } catch (err) {
      console.error("API Delete Error:", err);
      return { success: false, message: 'Failed to delete item.' };
    }
  };

  const value = { items, users, loading, error, saveItem, deleteItem, fetchData };

  return (
    <HRInventoryContext.Provider value={value}>
      {children}
    </HRInventoryContext.Provider>
  );
};

export const useHRInventory = () => {
    const context = useContext(HRInventoryContext);
    if (!context) {
        throw new Error('useHRInventory must be used within an HRInventoryProvider');
    }
    return context;
};

// ===================================================================================
// UI SUB-COMPONENTS
// ===================================================================================
const PageHeader = React.memo(({ onAddNew }) => {
  const navigate = useNavigate();
  return (
    <header className="hr-inventory-list-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
        <h1 className="hr-inventory-list-title">HR Inventory</h1>
        <div className="dashboard-nav-buttons">
          <button className="nav-btn" onClick={() => navigate('/hr')}>Dashboard</button>
          <button className="nav-btn active">Inventory</button>
        </div>
      </div>
      <button className="new-item-btn" onClick={onAddNew}>
        <PlusIcon /> Add Item
      </button>
    </header>
  );
});

const FilterBar = React.memo(({ searchTerm, onSearchChange, categoryFilter, onClearFilter }) => (
  <>
    <div className="hr-inventory-filters-container">
      <div className="filter-input-group">
        <input 
          type="text" 
          className="filter-input"
          placeholder="Search by name, type, brand or assigned person..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </div>
    {categoryFilter && (
      <div className="active-filter-bar">
        <span>Showing category: <strong>{categoryFilter}</strong></span>
        <button onClick={onClearFilter}>× Clear Filter</button>
      </div>
    )}
  </>
));

const InventoryTable = React.memo(({ items, onEdit, onDelete }) => {
  const getStatusChipClass = (status) => `status-chip status-${status?.toLowerCase().replace(/ /g, '-') || 'available'}`;
  
  if (items.length === 0) {
    return <div className="feedback-message">No inventory items match the current filters.</div>;
  }
  
  return (
    <div className="hr-inventory-table-container">
      <table className="hr-inventory-list-table">
        <thead>
          <tr>
            <th>Type</th><th>Name/Brand</th><th>Assigned To</th><th>Status</th><th>Quantity</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id}>
              <td data-label="Type">{item.type}</td>
              <td data-label="Name/Brand">{item.name} {item.brand && `(${item.brand})`}</td>
              <td data-label="Assigned To">{item.assignedTo?.name || 'N/A'}</td>
              <td data-label="Status"><span className={getStatusChipClass(item.status)}>{item.status}</span></td>
              <td data-label="Quantity">{item.quantity}</td>
              <td data-label="Actions" className="actions-cell">
                <button className="action-btn" onClick={() => onEdit(item)}><EditIcon /></button>
                <button className="action-btn delete" onClick={() => onDelete(item._id)}><DeleteIcon /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const InventoryModal = ({ isOpen, onClose, item, users, onSave }) => {
  const [form, setForm] = useState(defaultForm);
  
  useEffect(() => {
    if (item) {
      setForm({ ...item, assignedTo: item.assignedTo?._id || '' });
    } else {
      setForm(defaultForm);
    }
  }, [item, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.type || !form.name || form.quantity === null) return;
    
    const payload = { ...form };
    
    if (!form.assignedTo) {
  payload.assignedTo = null;
  payload.status = 'Unassigned';
  payload.assignedDate = null;
} else {
  payload.status = 'Assigned';
  payload.assignedDate = payload.assignedDate || new Date().toISOString().slice(0, 10);
}

    payload.quantity = parseInt(payload.quantity, 10) || 0;
    
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{item?._id ? 'Edit Item' : 'Add New Item'}</h2>
            <button type="button" className="modal-close" onClick={onClose}>×</button>
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
                      {users.map(u => (
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
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FeedbackDisplay = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="hr-inventory-page-feedback-wrapper">
        <div className="hr-inventory-page-loading">
          <div className="hr-inventory-page-spinner"></div>
          <p className="hr-inventory-page-loading-text">Loading Inventory...</p>
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
// MAIN PAGE COMPONENT
// ===================================================================================
const HRInventoryPage = () => {
  const { items, users, loading, error, saveItem, deleteItem } = useHRInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  const filteredItems = useMemo(() => {
    let tempItems = [...items];
    if (categoryFilter) {
      tempItems = tempItems.filter(item => item.type === categoryFilter);
    }
    if (searchTerm) {
      tempItems = tempItems.filter(item =>
        ['name', 'type', 'brand'].some(key => item[key]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort by creation date descending
    return tempItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, searchTerm, categoryFilter]);

  const handleOpenModal = (item = null) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSave = async (itemData) => {
    const result = await saveItem(itemData);
    if (result.success) {
      handleCloseModal();
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const result = await deleteItem(itemId);
      showNotification(result.message, result.success ? 'success' : 'error');
    }
  };

  return (
    <div className="hr-inventory-page-container">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="hr-inventory-content-wrapper">
        <PageHeader onAddNew={() => handleOpenModal()} />
        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          categoryFilter={categoryFilter}
          onClearFilter={() => setSearchParams({})}
        />
        
        <FeedbackDisplay loading={loading} error={error} />
        
        {!loading && !error && (
            <InventoryTable items={filteredItems} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        item={currentItem}
        users={users}
        onSave={handleSave}
      />
    </div>
  );
};

export default HRInventoryPage;