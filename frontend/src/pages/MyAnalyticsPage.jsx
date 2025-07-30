import React, { useEffect, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  CheckCircle as ResolvedIcon,
  HourglassTop as OpenIcon,
  Computer as AssetIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  AddComment as CommentIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

import '@/styles/MyAnalyticsPage.css'; // This is the new CSS file we will create

const StatsCard = ({ title, value, icon, colorClass }) => (
  <div className={`stats-card ${colorClass || ''}`}>
    <div className="stats-card-icon">{icon}</div>
    <div className="stats-card-content">
      <p className="stats-card-value">{value}</p>
      <p className="stats-card-title">{title}</p>
    </div>
  </div>
);

const AnalyticsSection = ({ title, icon, children }) => (
  <div className="analytics-section-card">
    <header className="analytics-section-header">
      {icon}
      <h2>{title}</h2>
    </header>
    <div className="analytics-section-content">
      {children}
    </div>
  </div>
);

const MyAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        // --- MOCK DATA FOR DEMONSTRATION ---
        const mockApiResponse = {
          kpiStats: {
            totalTickets: 8,
            openTickets: 2,
            resolvedTickets: 6,
            assetsAssigned: 5,
          },
          ticketTrend: [
            { month: 'May', tickets: 1 },
            { month: 'Jun', tickets: 0 },
            { month: 'Jul', tickets: 2 },
            { month: 'Aug', tickets: 1 },
            { month: 'Sep', tickets: 3 },
            { month: 'Oct', tickets: 1 },
          ],
          activityLog: [
            {
              type: 'ticket_created',
              description: 'Created ticket #T-105 for "Monitor not turning on"',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              type: 'comment_added',
              description: 'Added a comment to ticket #T-104',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
            {
              type: 'ticket_resolved',
              description: 'Your ticket #T-102 "Software Installation Request" was resolved',
              timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            },
            {
              type: 'asset_assigned',
              description: 'New asset "Dell Keyboard KB216" was assigned to you',
              timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          ],
        };
        setTimeout(() => {
          setAnalyticsData(mockApiResponse);
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Could not load your analytics data.');
        setLoading(false);
      }
    };

    fetchMyAnalytics();
  }, []);

  const renderActivityIcon = (type) => {
    switch (type) {
      case 'ticket_created': return <TicketIcon />;
      case 'ticket_resolved': return <ResolvedIcon />;
      case 'asset_assigned': return <AssetIcon />;
      case 'comment_added': return <CommentIcon />;
      default: return <HistoryIcon />;
    }
  };

  return (
    <div className="analytics-page-container">
      <div className="analytics-content-wrapper">
        <header className="analytics-list-header">
          <h1 className="analytics-list-title">My Analytics Dashboard</h1>
        </header>

        {loading ? (
          <div className="analytics-feedback-wrapper">
            <div className="analytics-page-loading">
              <div className="analytics-page-spinner"></div>
              <p className="analytics-page-loading-text">Loading Your Dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="analytics-feedback-wrapper">
            <Alert severity="error">{error}</Alert>
          </div>
        ) : !analyticsData ? (
          <div className="analytics-feedback-wrapper">
            <Alert severity="info">No analytics data is available for your account yet.</Alert>
          </div>
        ) : (
          <div className="analytics-grid-container">
            <div className="kpi-grid">
              <StatsCard title="Total Tickets Raised" value={analyticsData.kpiStats.totalTickets} icon={<TicketIcon />} colorClass="color-blue" />
              <StatsCard title="Open Tickets" value={analyticsData.kpiStats.openTickets} icon={<OpenIcon />} colorClass="color-orange" />
              <StatsCard title="Resolved Tickets" value={analyticsData.kpiStats.resolvedTickets} icon={<ResolvedIcon />} colorClass="color-green" />
              <StatsCard title="Assets Assigned" value={analyticsData.kpiStats.assetsAssigned} icon={<AssetIcon />} colorClass="color-purple" />
            </div>

            <AnalyticsSection title="Ticket Creation Trend" icon={<TimelineIcon />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.ticketTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'rgba(238, 242, 255, 0.6)'}} contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }} />
                  <Bar dataKey="tickets" fill="#4f46e5" name="Tickets Created" barSize={30} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsSection>

            <AnalyticsSection title="Recent Activity" icon={<HistoryIcon />}>
              <ul className="activity-log-list">
                {analyticsData.activityLog.map((log, index) => (
                  <li key={index} className={`activity-item type-${log.type}`}>
                    <div className="activity-icon-wrapper">
                      {renderActivityIcon(log.type)}
                    </div>
                    <div className="activity-details">
                      <p className="activity-description">{log.description}</p>
                      <p className="activity-timestamp" title={format(log.timestamp, 'PPpp')}>
                        {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </AnalyticsSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAnalyticsPage;