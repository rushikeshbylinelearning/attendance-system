import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';
import {
  Box,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import "../styles/AllocationPage.css";

const tableColumns = [
  { id: 'Employee Name', label: 'Employee Name' },
  { id: 'Role', label: 'Role' },
  { id: 'Seat No', label: 'Seat No' },
  { id: 'Monitor make', label: 'Monitor Make' },
  { id: 'Monitor Serial No', label: 'Monitor S/N' },
  { id: 'Keyboard make', label: 'Keyboard Make' },
  { id: 'KB Serial No', label: 'Keyboard S/N' },
  { id: 'Mouse make', label: 'Mouse Make' },
  { id: 'Mouse Serial No', label: 'Mouse S/N' },
  { id: 'UPS make', label: 'UPS Make' },
  { id: 'UPS Serial No', label: 'UPS S/N' },
  { id: 'CPU Box', label: 'CPU Box' },
  { id: 'CPU Serial No', label: 'CPU Serial No' },
  { id: 'Processor', label: 'Processor' },
  { id: 'GPU', label: 'GPU' },
  { id: 'RAM', label: 'RAM' },
  { id: 'HDD', label: 'HDD' },
  { id: 'Pen Tab', label: 'Pen Tab' },
  { id: 'Serial No', label: 'Serial No' },
  { id: 'HeadPhone', label: 'HeadPhone' },
  { id: 'Remark', label: 'Remark' },
];

function AllocationPage() {
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await api.get('/allocations');
        setAllRecords(response.data);
        setFilteredRecords(response.data);
      } catch (error) {
        console.error('Failed to fetch allocation records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  useEffect(() => {
    const results = allRecords.filter((record) =>
      record['Employee Name']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(results);
  }, [searchTerm, allRecords]);

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  const searchBar = (
    <TextField
      variant="outlined"
      size="small"
      placeholder="Search by employee name..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      className="search-bar"
    />
  );

  return (
    <PageLayout title="Asset Allocations" actions={searchBar}>
      <TableContainer className="table-container">
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {tableColumns.map((col) => (
                <TableCell key={col.id} className="table-header-cell">
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record._id} hover>
                {tableColumns.map((col, idx) => (
                  <TableCell key={`${col.id}-${record._id}-${idx}`}>
                    {record[col.id] || 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </PageLayout>
  );
}

export default AllocationPage;