// src/components/MyAssetsTable.jsx

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Helper to map status to colors
const getStatusColor = (status) => {
  const safeStatus = status?.toLowerCase() || '';
  if (safeStatus.includes('in use')) return 'success';
  if (safeStatus.includes('in repair')) return 'warning';
  if (safeStatus.includes('decommissioned') || safeStatus.includes('returned')) return 'error';
  return 'default';
};

const MyAssetsTable = ({ userName }) => {
  const [allocation, setAllocation] = useState(null); // single object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      try {
        let response;
        if (userName) {
          response = await api.get(`/allocations?userName=${encodeURIComponent(userName)}`);
        } else {
          response = await api.get('/allocations/my-assets');
        }

        setAllocation(response.data || null);
      } catch (err) {
        console.error('Failed to load allocations:', err);
        setError('Failed to load your assigned assets.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [userName]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Assigned Assets...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  if (!allocation || Object.keys(allocation).length === 0) {
    return (
      <Paper sx={{ textAlign: 'center', p: 4, mt: 2, backgroundColor: '#fafafa', border: '1px dashed #ccc' }} elevation={0}>
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
        <Typography variant="h6">No Assets Assigned</Typography>
        <Typography color="text.secondary">No equipment has been assigned.</Typography>
      </Paper>
    );
  }

  const excludedFields = ['_id', '__v'];
  const headers = Object.keys(allocation).filter(key => !excludedFields.includes(key));

  return (
    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold' } }}>
            {headers.map((header) => (
              <TableCell key={header}>{header.replace(/_/g, ' ')}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            {headers.map((field) => (
              <TableCell key={field}>
                {field.toLowerCase() === 'status' ? (
                  <Chip label={allocation[field] || 'Unknown'} color={getStatusColor(allocation[field])} size="small" />
                ) : (
                  allocation[field] || '—'
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};



export default MyAssetsTable;
