// in frontend/src/components/MyAssetsTable.jsx
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';

const MyAssetsTable = () => {
    const [myAssets, setMyAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... fetch logic ...
        const fetchMyAssets = async () => {
            try {
                const response = await api.get('/assets/my');
                setMyAssets(response.data);
            } catch (error) { console.error("Failed to fetch my assets:", error); }
            finally { setLoading(false); }
        };
        fetchMyAssets();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;

    return (
        // --- THE FIX ---
        <Paper elevation={3} sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'white',
                    background: 'linear-gradient(45deg, #673ab7 30%, #9c27b0 90%)',
                    borderTopLeftRadius: (theme) => theme.shape.borderRadius,
                    borderTopRightRadius: (theme) => theme.shape.borderRadius,
                }}
            >
                <ComputerIcon sx={{ mr: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>My Assigned Assets</Typography>
            </Box>
            
            {/* flexGrow: 1 tells this container to take up all available vertical space */}
            <TableContainer sx={{ flexGrow: 1 }}> 
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Component / Asset Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Model / Serial Number</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {myAssets.length > 0 ? (
                            myAssets.map((asset) => (
                                <TableRow key={asset._id} hover>
                                    <TableCell>{asset.assetName}</TableCell>
                                    <TableCell>{asset.assetType}</TableCell>
                                    <TableCell>{asset.serialNumber}</TableCell>
                                    <TableCell>{asset.status}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography variant="h6" color="text.secondary">All Clear!</Typography>
                                    <Typography color="text.secondary">You don't have any assets assigned to you right now.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default MyAssetsTable;