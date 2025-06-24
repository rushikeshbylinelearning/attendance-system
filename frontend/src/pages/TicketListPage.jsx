import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import TicketForm from '@/components/TicketForm';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Box, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

function TicketListPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTicket, setCurrentTicket] = useState(null);

    const user = JSON.parse(sessionStorage.getItem('user'));

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tickets');
            setTickets(response.data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleOpenModal = (ticket = null) => {
        setCurrentTicket(ticket);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTicket(null);
    };

    const handleSave = () => {
        fetchTickets();
    };

    const getStatusColor = (status) => {
        if (status === 'open') return 'error';
        if (status === 'in-progress') return 'warning';
        return 'success';
    };
    
    const getPriorityColor = (priority) => {
        if (priority === 'high') return 'error';
        if (priority === 'medium') return 'warning';
        return 'default';
    }

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Support Tickets
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    New Ticket
                </Button>
            </Box>

            {/* --- TABLE --- */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{ticket.title}</TableCell>
                                <TableCell><Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" /></TableCell>
                                <TableCell><Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" /></TableCell>
                                <TableCell>{ticket.createdBy?.name || 'N/A'}</TableCell>
                                <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenModal(ticket)}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TicketForm open={isModalOpen} handleClose={handleCloseModal} ticket={currentTicket} onSave={handleSave} />
        </Paper>
    );
}

export default TicketListPage;