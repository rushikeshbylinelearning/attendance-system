import React, { useEffect, useState, useMemo } from 'react';
import { getAllInquiries, updateInquiryStatus, deleteInquiry } from '@/services/api';
import { Search, Plus, Trash2, Eye, X, AlertCircle, Inbox } from 'lucide-react';
import '../styles/InquiryListPage.css'; // Your new CSS file

// Constants for filter dropdowns
const statusOptions = ['Open', 'In Progress', 'Fulfilled', 'Rejected'];
const urgencyOptions = ['Low', 'Medium', 'High', 'Critical'];
const typeOptions = ['Hardware', 'Software'];

function InquiryListPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // State for modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Data Fetching ---
  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllInquiries();
      setInquiries(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Failed to fetch inquiries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // --- Event Handlers ---
  const handleDeleteInquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
      try {
        await deleteInquiry(id);
        // Refresh data after deletion
        setInquiries(prev => prev.filter(inquiry => inquiry._id !== id));
      } catch {
        setError('Failed to delete inquiry.');
      }
    }
  };

  const handleViewDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setTypeFilter('all');
  };

  // --- Filtering Logic ---
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const matchesSearch = (
        (inquiry.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (inquiry.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (inquiry.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || inquiry.urgency === urgencyFilter;
      const matchesType = typeFilter === 'all' || inquiry.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesUrgency && matchesType;
    });
  }, [inquiries, searchTerm, statusFilter, urgencyFilter, typeFilter]);
  
  // Effect for smooth filtering animation
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, urgencyFilter, typeFilter]);


  // --- Helper Functions ---
  const getChipClassName = (category, value) => {
    const valueSlug = String(value).toLowerCase().replace(' ', '-');
    let categoryPrefix;
    switch(category) {
        case 'status':
            categoryPrefix = 'status';
            break;
        case 'urgency':
            categoryPrefix = 'priority'; // CSS uses 'priority' for urgency colors
            break;
        case 'type':
            categoryPrefix = 'type';
            break;
        default:
            return 'status-chip status-default';
    }
    return `status-chip ${categoryPrefix}-${valueSlug}`;
  };

  // --- Render Functions ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="inquiry-page-feedback-wrapper">
          <div className="inquiry-page-spinner"></div>
          <p className="inquiry-page-feedback-text">Loading Inquiries...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="inquiry-page-feedback-wrapper">
          <AlertCircle size={48} className="text-red-500" />
          <p className="inquiry-page-feedback-text">{error}</p>
          <button onClick={fetchInquiries} className="new-inquiry-btn">
            Retry
          </button>
        </div>
      );
    }
    
    if (filteredInquiries.length === 0) {
      return (
        <div className="inquiry-page-feedback-wrapper">
          <Inbox size={48} className="text-gray-400" />
          <p className="inquiry-page-feedback-text">No Inquiries Found</p>
          <p className="inquiry-page-feedback-subtext">Try adjusting your search or filter criteria.</p>
           <button onClick={handleClearFilters} className="new-inquiry-btn">
            Clear Filters
          </button>
        </div>
      );
    }

    return (
      <div className="inquiry-table-container">
        <table className="inquiry-list-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Description</th>
              <th>Type</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className={isFiltering ? 'is-filtering' : ''}>
            {filteredInquiries.map(inquiry => (
              <tr key={inquiry._id}>
                <td data-label="User">{inquiry.user?.name || inquiry.user?.email || 'N/A'}</td>
                <td data-label="Description" style={{ whiteSpace: 'normal', maxWidth: '300px' }}>{inquiry.description}</td>
                <td data-label="Type">
                  <span className={getChipClassName('type', inquiry.type)}>{inquiry.type}</span>
                </td>
                <td data-label="Urgency">
                  <span className={getChipClassName('urgency', inquiry.urgency)}>{inquiry.urgency}</span>
                </td>
                <td data-label="Status">
                  <span className={getChipClassName('status', inquiry.status)}>{inquiry.status}</span>
                </td>
                <td data-label="Date">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                <td data-label="Actions" className="actions-cell">
                  <button onClick={() => handleViewDetails(inquiry)} className="action-btn" title="View Details">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDeleteInquiry(inquiry._id)} className="action-btn delete" title="Delete Inquiry">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderModal = () => {
    if (!isModalOpen || !selectedInquiry) return null;
    
    return (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inquiry Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close" title="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>User</label>
                  <span>{selectedInquiry.user?.name || selectedInquiry.user?.email || 'Unknown'}</span>
                </div>
                <div className="detail-item">
                  <label>Created Date</label>
                  <span>{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <span className={getChipClassName('type', selectedInquiry.type)}>{selectedInquiry.type}</span>
                </div>
                <div className="detail-item">
                  <label>Urgency</label>
                  <span className={getChipClassName('urgency', selectedInquiry.urgency)}>{selectedInquiry.urgency}</span>
                </div>
                 <div className="detail-item">
                  <label>Status</label>
                  <span className={getChipClassName('status', selectedInquiry.status)}>{selectedInquiry.status}</span>
                </div>
              </div>
              <div className="detail-item full-width">
                 <label>Description</label>
                 <p className="description-text">{selectedInquiry.description}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsModalOpen(false)} className="new-inquiry-btn">Close</button>
            </div>
          </div>
        </div>
    );
  };

  return (
    <div className="inquiry-page-container">
      <div className="inquiry-content-wrapper">
        {/* Header */}
        <div className="inquiry-list-header">
          <h1 className="inquiry-list-title">Requirement Inquiries</h1>
          <button className="new-inquiry-btn">
            <Plus size={18} />
            New Inquiry
          </button>
        </div>

        {/* Filters */}
        <div className="inquiry-filters-container">
          <div className="filter-input-group">
            <Search size={18} className="filter-icon" />
            <input
              type="text"
              placeholder="Search by user or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input has-icon"
            />
          </div>
          <div className="filter-input-group">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Statuses</option>
              {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="filter-input-group">
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="filter-select">
              <option value="all">All Urgencies</option>
              {urgencyOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="filter-input-group">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              {typeOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>

      {/* Details Modal */}
      {renderModal()}
    </div>
  );
}

export default InquiryListPage;