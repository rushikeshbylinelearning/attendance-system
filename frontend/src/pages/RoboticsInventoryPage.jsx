// src/pages/RoboticsInventoryPage.js

import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const RoboticsInventoryPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center' 
        }}
      >
        <SmartToyIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Robotics Inventory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under construction. The inventory for robotics components will be displayed here soon.
        </Typography>
      </Paper>
    </Container>
  );
};

export default RoboticsInventoryPage;