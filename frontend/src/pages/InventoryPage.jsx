import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Link, Chip, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function InventoryPage() {
    // --- THE FIX: ADD THE STATE DECLARATIONS BACK ---
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true); // Now 'setLoading' is defined
            try {
                const response = await api.get('/inventory');
                setAllItems(response.data);
                setFilteredItems(response.data);
            } catch (error) {
                console.error("Failed to fetch inventory:", error);
            } finally {
                setLoading(false); // And 'setLoading' is defined here too
            }
        };
        fetchItems();
    }, []);

    useEffect(() => {
        const results = allItems.filter(item =>
            (item.componentType?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.model?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.brand?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredItems(results);
    }, [searchTerm, allItems]);

    // This line will now work because 'loading' is a defined state variable
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box>;

    const searchBar = (
        <TextField
            variant="outlined"
            size="small"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }}
            sx={{ width: 350 }}
        />
    );

    return (
        <PageLayout title="Component Inventory" actions={searchBar}>
            <TableContainer sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Component</TableCell>
                            <TableCell>Brand & Model</TableCell>
                            <TableCell>Serial No.</TableCell>
                            <TableCell>Warranty Ends</TableCell>
                            <TableCell>Invoice</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredItems.map((item) => (
                            <TableRow key={item._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{item.componentType}</TableCell>
                                <TableCell>{item.brand} {item.model}</TableCell>
                                <TableCell>{item.serialNumber || 'N/A'}</TableCell>
                                <TableCell>{item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>
                                    {item.invoiceLink ? (<Link href={item.invoiceLink} target="_blank" rel="noopener noreferrer">View</Link>) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Chip label={item.status} color={item.status === 'In Stock' ? 'success' : 'warning'} size="small" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageLayout>
    );
}

export default InventoryPage;