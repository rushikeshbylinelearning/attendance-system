// in frontend/src/components/InfoCard.jsx
import React from 'react';
import { Card, CardHeader, CardContent, Typography, Box, Divider } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
        <Typography variant="body1" color="text.secondary">{label}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>{value || 'N/A'}</Typography>
    </Box>
);

const InfoCard = ({ title, data }) => { // Removed ...props for clarity
    return (
        // --- THE FIX ---
        <Card elevation={3} sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                avatar={<AccountCircleIcon sx={{ color: 'white', fontSize: '2rem' }} />}
                title={title}
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                sx={{
                    color: 'white',
                    background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                }}
            />
            {/* The CardContent will now grow to fill remaining space, but we don't need it to */}
            <CardContent sx={{ p: 0 }}> 
                {Object.entries(data).map(([key, value], index) => (
                    <React.Fragment key={key}>
                        <InfoRow label={key} value={value} />
                        {index < Object.keys(data).length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </CardContent>
        </Card>
    );
};

export default InfoCard;