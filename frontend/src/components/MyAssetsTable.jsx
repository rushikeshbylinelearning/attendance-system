// src/components/MyAssetsTable.jsx

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import ComputerIcon from '@mui/icons-material/Computer';
import TvIcon from '@mui/icons-material/Tv';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import CircularProgress from '@mui/material/CircularProgress';

// ===================================================================
// NEW: Asset Detail Modal Component
// ===================================================================
const AssetDetailModal = ({ isOpen, onClose, asset }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen || !asset) return null;

    return (
        <div className="asset-detail-modal-backdrop" onClick={onClose}>
            <div className="asset-detail-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="asset-detail-modal-header">
                    <div className="header-content">
                        {asset.icon}
                        <h3 className="asset-detail-modal-title">{asset.title}</h3>
                    </div>
                    <button className="asset-detail-modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="asset-detail-modal-body">
                    <dl className="asset-details-list">
                        {asset.details.map(({ label, value }) => (
                            <React.Fragment key={label}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
};


// ===================================================================
// Reusable Asset Card Component (Now with onClick)
// ===================================================================
const AssetCard = ({ title, icon, details, onClick }) => {
    if (!details || details.length === 0) {
        return null;
    }

    return (
        <div className="asset-card" onClick={onClick}>
            <div className="asset-card-header">
                {icon}
                <h4 className="asset-card-title">{title}</h4>
            </div>
            <div className="asset-card-body">
                {details.map(({ label, value }) => (
                    <div key={label} className="asset-detail-item">
                        <span className="asset-detail-label">{label}:</span>
                        <span className="asset-detail-value">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ===================================================================
// Main MyAssetsTable Component (Now manages modal state)
// ===================================================================
const MyAssetsTable = () => {
    const [assets, setAssets] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        const fetchMyAssets = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/allocations/my-assets');
                setAssets(response.data);
            } catch (err) {
                console.error("Failed to fetch my assets:", err);
                setError("Could not load your assigned assets. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchMyAssets();
    }, []);

    const handleCardClick = (assetData) => {
        setSelectedAsset(assetData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAsset(null); // Clear selection on close
    };

    if (loading) {
        return <div className="my-assets-loading"><CircularProgress size={24} />   Loading your asset details...</div>;
    }

    if (error) {
        return <div className="my-assets-error">{error}</div>;
    }

    if (!assets || Object.keys(assets).length === 0) {
        return <div className="my-assets-empty">You have no assets assigned to you.</div>;
    }

    const createDetail = (label, value) => (value ? { label, value } : null);

    const systemDetails = [
        createDetail('System', assets.cpuBox || assets.laptopMake),
        createDetail('Serial No', assets.cpuSerialNo || assets.laptopSerialNo),
        createDetail('Processor', assets.processor),
        createDetail('RAM', assets.ram),
        createDetail('Storage (HDD)', assets.hdd),
        createDetail('Graphics (GPU)', assets.gpu),
    ].filter(Boolean);

    const displayDetails = [
        createDetail('Make/Model', assets.monitorMake),
        createDetail('Serial No', assets.monitorSerialNo),
    ].filter(Boolean);

    const peripheralDetails = [
        createDetail('Keyboard', assets.keyboardMake),
        createDetail('Keyboard S/N', assets.kbSerialNo),
        createDetail('Mouse', assets.mouseMake),
        createDetail('Mouse S/N', assets.mouseSerialNo),
        createDetail('UPS', assets.upsMake),
        createDetail('UPS S/N', assets.upsSerialNo),
    ].filter(Boolean);

    const otherDetails = [
        createDetail('Pen Tablet', assets.penTabMake),
        createDetail('Pen Tablet S/N', assets.penTabSn),
        createDetail('Headphones', assets.headphoneMake),
        createDetail('Headphones S/N', assets.headphoneSn),
    ].filter(Boolean);
    
    const systemAssetData = {
        title: assets.laptopMake ? "Laptop Details" : "Desktop System Details",
        icon: <ComputerIcon />,
        details: systemDetails
    };
    
    const displayAssetData = {
        title: "Display / Monitor",
        icon: <TvIcon />,
        details: displayDetails
    };

    const peripheralAssetData = {
        title: "Peripherals",
        icon: <KeyboardIcon />,
        details: peripheralDetails
    };

    const otherAssetData = {
        title: "Other Equipment",
        icon: <DevicesOtherIcon />,
        details: otherDetails
    };

    return (
        <>
            <div className="my-assets-grid-container">
                <AssetCard {...systemAssetData} onClick={() => handleCardClick(systemAssetData)} />
                <AssetCard {...displayAssetData} onClick={() => handleCardClick(displayAssetData)} />
                <AssetCard {...peripheralAssetData} onClick={() => handleCardClick(peripheralAssetData)} />
                <AssetCard {...otherAssetData} onClick={() => handleCardClick(otherAssetData)} />
            </div>

            <AssetDetailModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                asset={selectedAsset}
            />
        </>
    );
};

export default MyAssetsTable;