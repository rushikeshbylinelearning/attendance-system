import { createTheme } from '@mui/material/styles';

// A modern, professional color palette
const palette = {
    primary: {
        main: '#1976D2', // A vibrant, standard blue
        light: '#63a4ff',
        dark: '#004ba0',
    },
    secondary: {
        main: '#9c27b0', // A complementary purple
    },
    background: {
        default: '#F4F6F8', // A very light grey for the main background
        paper: '#FFFFFF',    // White for cards, drawers, appbars
    },
    text: {
        primary: '#2A3037', // Dark grey for primary text, better than pure black
        secondary: '#6C737F', // Lighter grey for secondary text
    },
    success: {
        main: '#28a745',
    },
    error: {
        main: '#dc3545',
    },
    warning: {
        main: '#ffc107',
    },
};

// Create the theme instance
const theme = createTheme({
    palette: palette,
    
    // Define the typography for a modern look
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h4: {
            fontWeight: 700,
            fontSize: '2rem',
            color: palette.text.primary,
        },
        h6: {
            fontWeight: 600,
        },
        // Add more typography overrides as needed
    },

    // Override default component styles for a consistent feel
    components: {
        // Name of the component
        MuiButton: {
            styleOverrides: {
                // Name of the slot
                root: {
                    textTransform: 'none', // Buttons with normal capitalization
                    borderRadius: 8,       // Slightly more rounded buttons
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    }
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12, // More rounded corners for paper elements
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none', // Remove the default border
                    backgroundColor: palette.background.paper,
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    marginBottom: '4px',
                    '&.Mui-selected': {
                        backgroundColor: `${palette.primary.main}14`, // Light primary color for selection
                        color: palette.primary.dark,
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: `${palette.primary.main}20`,
                        },
                        // Style the icon when the item is selected
                        '.MuiListItemIcon-root': {
                            color: palette.primary.dark,
                        }
                    },
                },
            },
        },
    },
});

export default theme;