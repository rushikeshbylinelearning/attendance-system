// src/pages/MyAssetGridPage.jsx

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Alert, CircularProgress } from '@mui/material';

import {
  DesktopWindows as MonitorIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
  Power as UpsIcon,
  Memory as CpuIcon,
  Headset as HeadphoneIcon,
  DevicesOther as OtherIcon,
} from '@mui/icons-material';

import '@/styles/MyAssetGridPage.css';

const assetIcons = {
  monitor: <MonitorIcon fontSize="large" />,
  keyboard: <KeyboardIcon fontSize="large" />,
  mouse: <MouseIcon fontSize="large" />,
  cpu: <CpuIcon fontSize="large" />,
  ups: <UpsIcon fontSize="large" />,
  headphone: <HeadphoneIcon fontSize="large" />,
  default: <OtherIcon fontSize="large" />,
};

const displayColumns = [
  { id: 'component', label: 'Component' },
  { id: 'make', label: 'Make / Details' },
  { id: 'serial', label: 'Serial Number' },
];

const MyAssetGridPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const response = await api.get('/allocations/my-assets');
        const rawData = response.data[0]; // assuming first row is relevant

        const assetFields = ['Monitor', 'Keyboard', 'Mouse', 'UPS', 'CPU', 'Headphone'];

        const getMake = (row, key) => {
          if (key === 'CPU') {
            return row['CPU Box'] || row['CPU'];
          }
          return row[`${key} make`] || row[`${key} Make`] || row[key];
        };

        const getSerial = (row, key) =>
          row[`${key} Serial No`] || row[`${key} Serial`] || row[`${key} S/N`];

        const processedAssets = [];

        if (rawData) {
          assetFields.forEach((key) => {
            const make = getMake(rawData, key);
            const serial = getSerial(rawData, key);
            if (make || serial) {
              processedAssets.push({
                id: key.toLowerCase(),
                component: key,
                make: make || 'N/A',
                serial: serial || 'N/A',
              });
            }
          });
        }

        setAssets(processedAssets);
      } catch (err) {
        setError('Could not load assigned asset data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return (
    <div className="my-assets-page-container">
      <div className="my-assets-content-wrapper">
        <header className="my-assets-list-header">
          <h1 className="my-assets-list-title">My Assigned Assets</h1>
        </header>

        {loading ? (
          <div className="my-assets-feedback-wrapper">
            <div className="my-assets-page-loading">
              <div className="my-assets-page-spinner"></div>
              <p className="my-assets-page-loading-text">Loading Your Assets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="my-assets-feedback-wrapper">
            <Alert severity="error">{error}</Alert>
          </div>
        ) : assets.length === 0 ? (
          <div className="my-assets-feedback-wrapper">
            <p className="my-assets-empty-text">You have no assets assigned to you.</p>
          </div>
        ) : (
          <div className="my-assets-table-container">
            <table className="my-assets-list-table">
              <thead>
                <tr>
                  {displayColumns.map((col) => (
                    <th key={col.id}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const Icon = assetIcons[asset.id] || assetIcons.default;
                  const rowClass = `component-row-${asset.id}`;

                  return (
                    <tr key={asset.id} className={rowClass}>
                      <td data-label="Component">
                        <div className="component-cell-visual">
                          <div className="component-icon-wrapper">{Icon}</div>
                          <span className="component-name">{asset.component}</span>
                        </div>
                      </td>
                      <td data-label="Make">{asset.make}</td>
                      <td data-label="Serial Number">{asset.serial}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssetGridPage;
