import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

/**
 * A master layout component for all pages.
 * It provides a consistent Paper container, a header with a title, and an action area.
 * @param {string} title - The title to be displayed at the top of the page.
 * @param {React.ReactNode} actions - Optional action elements, like buttons, to be displayed on the right.
 * @param {React.ReactNode} children - The main content of the page (e.g., a table, a grid of cards).
 */
const PageLayout = ({ title, actions, children }) => {
    return (
        // This Paper component is the main container for every page.
        // It's a flex container that grows to fill all available space.
        <Paper 
            elevation={0} 
            sx={{
                p: 3,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1, // This makes it fill the vertical space
            }}
        >
            {/* Page Header Section */}
            <Box 
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3, // Margin below the header
                }}
            >
                <Typography variant="h4" component="h1">
                    {title}
                </Typography>
                {/* Action area for buttons like "Add New" */}
                <Box>
                    {actions}
                </Box>
            </Box>

            {/* Main Page Content Area */}
            {/* This box will contain the table or cards and will grow to fill space */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Box>
        </Paper>
    );
};

export default PageLayout;