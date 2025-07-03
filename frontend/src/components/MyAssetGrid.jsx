// src/components/MyAssetGrid.jsx

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  Alert,
  Tooltip,
  Modal,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ComputerIcon from '@mui/icons-material/Computer';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import DevicesIcon from '@mui/icons-material/Devices';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';

import '../styles/MyAssetGridPage.css';

const MyAssetGrid = ({ userName }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get(`/allocations?userName=${encodeURIComponent(userName)}`);
        setAssets(response.data || []);
      } catch (err) {
        setError('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };
    if (userName) fetchAssets();
  }, [userName]);

  const handleOpenModal = (asset) => {
    setSelectedAsset(asset);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAsset(null);
  };

  const getIcon = (type = '') => {
    const key = type.toLowerCase();
    if (key.includes('monitor')) return <ComputerIcon />;
    if (key.includes('keyboard')) return <KeyboardIcon />;
    if (key.includes('mouse')) return <MouseIcon />;
    if (key.includes('ups')) return <PowerIcon />;
    if (key.includes('cpu') || key.includes('computer')) return <DevicesIcon />;
    return <DevicesOtherIcon />;
  };

  const getAssetClass = (type = '') => {
    const key = type.toLowerCase();
    if (key.includes('monitor')) return 'monitor';
    if (key.includes('cpu') || key.includes('computer')) return 'computer';
    if (key.includes('keyboard')) return 'keyboard';
    if (key.includes('mouse')) return 'mouse';
    if (key.includes('ups')) return 'ups';
    return 'other';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography ml={2}>Loading Assets...</Typography>
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  if (assets.length === 0) {
    return (
      <Typography variant="h6" align="center" mt={4}>
        No assets assigned yet.
      </Typography>
    );
  }

  return (
    <>
      <Grid container spacing={3} className="asset-grid-container">
        {assets.map((asset, index) => {
          const type = asset?.Asset_Type || 'Other';
          const assetClass = getAssetClass(type);
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                className={`asset-card ${assetClass}`}
                elevation={4}
                onClick={() => handleOpenModal(asset)}
                style={{ cursor: 'pointer' }}
              >
                <Tooltip title={type} arrow>
                  <div className="asset-card-icon">{getIcon(type)}</div>
                </Tooltip>
                <div className="asset-card-content">
                  <div className="asset-card-title">{type}</div>
                  <div className="asset-card-detail">Brand: {asset?.Brand || 'N/A'}</div>
                  <div className="asset-card-detail">Model: {asset?.Model || 'N/A'}</div>
                  <div className="asset-card-detail">Status: {asset?.Status || 'Unknown'}</div>
                  <div className="asset-card-detail">Serial No: {asset?.Serial_Number || '—'}</div>
                </div>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 3,
            width: '90%',
            maxWidth: 500,
            outline: 'none',
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          {selectedAsset && (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedAsset.Asset_Type || 'Device Details'}
              </Typography>
              <Typography><strong>Brand:</strong> {selectedAsset.Brand || 'N/A'}</Typography>
              <Typography><strong>Model:</strong> {selectedAsset.Model || 'N/A'}</Typography>
              <Typography><strong>Status:</strong> {selectedAsset.Status || 'N/A'}</Typography>
              <Typography><strong>Serial No:</strong> {selectedAsset.Serial_Number || '—'}</Typography>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default MyAssetGrid;
