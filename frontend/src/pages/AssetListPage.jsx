import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout'; // Import master layout
import AssetForm from '@/components/AssetForm';
import { Box, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip, Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function AssetListPage() {
    // --- THE FIX: ALL STATE AND HANDLERS ARE NOW PRESENT ---
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleOpenModal = (asset = null) => {
        setCurrentAsset(asset);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentAsset(null);
    };

    const handleSave = () => {
        fetchAssets(); // Refresh the list after a save
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await api.delete(`/assets/${id}`);
                fetchAssets(); // Refresh the list after deleting
            } catch (error) {
                console.error('Failed to delete asset:', error);
            }
        }
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'in-use': return 'success';
            case 'in-stock': return 'info';
            case 'under-repair': return 'warning';
            case 'retired': return 'default';
            default: return 'default';
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box>;
    
    // Define the action button to pass as a prop to the PageLayout
    const addAssetButton = (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
            Add Asset
        </Button>
    );

    return (
        <PageLayout title="Asset Management" actions={addAssetButton}>
            <TableContainer sx={{ flexGrow: 1 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Asset Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Serial No.</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Assigned To</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assets.map((asset) => (
                            <TableRow key={asset._id} hover>
                                <TableCell>{asset.assetName}</TableCell>
                                <TableCell>{asset.assetType}</TableCell>
                                <TableCell>{asset.serialNumber}</TableCell>
                                <TableCell><Chip label={asset.status} color={getStatusChipColor(asset.status)} size="small" /></TableCell>
                                <TableCell>{asset.assignedTo ? asset.assignedTo.name : 'Unassigned'}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenModal(asset)}><EditIcon /></IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(asset._id)}><DeleteIcon color="error" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <AssetForm open={isModalOpen} handleClose={handleCloseModal} asset={currentAsset} onSave={handleSave} />
        </PageLayout>
    );
}

export default AssetListPage;