import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import TicketForm from '@/components/TicketForm';
import './../styles/TicketListPage.css';

import { Add, Edit, Search, Delete } from '@mui/icons-material';

// Debouncing hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function TicketListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialStatusFilter = searchParams.get('status') || 'all';

  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State for selected tickets
  const [selectedTickets, setSelectedTickets] = useState([]);

  // States for filter inputs
  const [searchText, setSearchText] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  // Debounced values
  const debouncedSearchText = useDebounce(searchText, 400);
  const debouncedUserFilter = useDebounce(userFilter, 400);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isAdminOrTech = user.role === 'admin' || user.role === 'technician';

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearchText) params.append('search', debouncedSearchText);
      if (isAdminOrTech && debouncedUserFilter) params.append('user', debouncedUserFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/tickets?${params.toString()}`);
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [debouncedSearchText, debouncedUserFilter, dateFilter, statusFilter, isAdminOrTech]);

  useEffect(() => {
    startTransition(() => {
      fetchTickets();
    });
  }, [fetchTickets]);

  // Update URL when status filter changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (statusFilter === 'all') {
      newSearchParams.delete('status');
    } else {
      newSearchParams.set('status', statusFilter);
    }
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  }, [statusFilter, navigate, searchParams]);


  const handleOpenModal = (ticket = null) => {
    setCurrentTicket(ticket);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSave = () => {
    startTransition(() => {
      fetchTickets();
    });
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to permanently delete this ticket? This action cannot be undone.')) {
      try {
        await api.delete(`/tickets/${ticketId}`);
        startTransition(() => {
          fetchTickets();
        });
      } catch (error) {
        console.error('Failed to delete ticket:', error);
        alert('Failed to delete the ticket. Please try again.');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allTicketIds = tickets.map(t => t._id);
      setSelectedTickets(allTicketIds);
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectOne = (e, ticketId) => {
    if (e.target.checked) {
      setSelectedTickets(prev => [...prev, ticketId]);
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  // --- FIXED: Handler for deleting selected tickets ---
  const handleDeleteSelected = async () => {
    const numSelected = selectedTickets.length;
    if (numSelected === 0) return;

    if (window.confirm(`Are you sure you want to permanently delete ${numSelected} selected ticket(s)? This action cannot be undone.`)) {
      try {
        // *** FIX: Use POST instead of DELETE and send the data as the second argument ***
        await api.post('/tickets/batch-delete', { ids: selectedTickets });
        
        setSelectedTickets([]); // Clear selection
        startTransition(() => {
          fetchTickets(); // Refresh the list
        });
      } catch (error) {
        console.error('Failed to delete selected tickets:', error);
        alert('Failed to delete the selected tickets. Please try again.');
      }
    }
  };


  const getStatusClass = (str) => (str || 'default').toLowerCase().replace(/\s+/g, '-');

  if (isInitialLoading) {
    return (
      <div className="ticket-page-container">
        <div className="ticket-page-feedback-wrapper">
          <div className="ticket-page-loading">
            <div className="ticket-page-spinner"></div>
            <p className="ticket-page-loading-text">Loading Tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-page-container">
      <div className="ticket-content-wrapper">
        <header className="ticket-list-header">
          <h1 className="ticket-list-title">Support Tickets</h1>
          <div className="header-actions">
            {selectedTickets.length > 0 && isAdminOrTech && (
              <button className="delete-selected-btn" onClick={handleDeleteSelected}>
                <Delete fontSize="small" /> Delete ({selectedTickets.length})
              </button>
            )}
            <button className="new-ticket-btn" onClick={() => handleOpenModal()}>
              <Add fontSize="small" /> New Ticket
            </button>
          </div>
        </header>

        <div className="ticket-filters-container">
          <div className="filter-input-group">
            <Search className="filter-icon" fontSize="small" />
            <input type="text" className="filter-input has-icon" placeholder="Search by Component / Issue" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          {isAdminOrTech && (
            <input type="text" className="filter-input" placeholder="Filter by User" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
          )}
          <input type="date" className="filter-input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {isPending && (
            <div className="ticket-page-spinner filtering-spinner"></div>
          )}
        </div>

        <div className="ticket-table-container">
          <table className="ticket-list-table">
            <thead>
              <tr>
                {isAdminOrTech && (
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={tickets.length > 0 && selectedTickets.length === tickets.length}
                      disabled={tickets.length === 0}
                      title="Select all tickets on this page"
                    />
                  </th>
                )}
                <th>Component</th><th>Issue</th><th>Status</th><th>Priority</th>
                <th>Created By</th><th>Created At</th><th>Actions</th>
              </tr>
            </thead>
            <tbody className={isPending ? 'is-filtering' : ''}>
              {tickets.length > 0 ? tickets.map((ticket) => (
                <tr key={ticket._id} className={selectedTickets.includes(ticket._id) ? 'row-selected' : ''}>
                  {isAdminOrTech && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket._id)}
                        onChange={(e) => handleSelectOne(e, ticket._id)}
                        onClick={(e) => e.stopPropagation()} 
                      />
                    </td>
                  )}
                  <td data-label="Component">{ticket.component || 'N/A'}</td>
                  <td data-label="Issue">{ticket.issue}</td>
                  <td data-label="Status"><span className={`status-chip status-${getStatusClass(ticket.status)}`}>{ticket.status || 'Unknown'}</span></td>
                  <td data-label="Priority"><span className={`status-chip priority-${getStatusClass(ticket.priority)}`}>{ticket.priority || 'N/A'}</span></td>
                  <td data-label="Created By">{ticket.createdBy?.name || 'N/A'}</td>
                  <td data-label="Created At">{new Date(ticket.createdAt).toLocaleString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {(isAdminOrTech || ticket.createdBy?._id === user._id) && (
                      <button className="action-btn" onClick={() => handleOpenModal(ticket)} title="Edit Ticket">
                        <Edit fontSize="small" />
                      </button>
                    )}
                    {isAdminOrTech && (
                       <button className="action-btn delete" onClick={() => handleDeleteTicket(ticket._id)} title="Delete Ticket">
                        <Delete fontSize="small" />
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdminOrTech ? 8 : 7} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                    No tickets found that match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TicketForm
        open={isModalOpen}
        handleClose={handleCloseModal}
        ticket={currentTicket}
        onSave={handleSave}
      />
    </div>
  );
}

export default TicketListPage;