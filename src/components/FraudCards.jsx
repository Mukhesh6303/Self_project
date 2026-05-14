import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { CheckCircle, Cancel, Warning, Receipt } from '@mui/icons-material';

const FraudCards = ({ transactions }) => {
  const total = transactions.length;
  const getStatus = (transaction) => transaction.status ?? transaction.Status ?? '';
  const realCount = transactions.filter(t => getStatus(t) === 'REAL').length;
  const fakeCount = transactions.filter(t => getStatus(t) === 'FAKE').length;
  const duplicateCount = transactions.filter(t => getStatus(t) === 'DUPLICATE').length;

  const cards = [
    { title: 'Total Checked', count: total, color: '#3b82f6', icon: <Receipt fontSize="large" sx={{ color: '#3b82f6' }}/> },
    { title: 'Real Transactions', count: realCount, color: '#22c55e', icon: <CheckCircle fontSize="large" sx={{ color: '#22c55e' }}/> },
    { title: 'Fake Receipts', count: fakeCount, color: '#ef4444', icon: <Cancel fontSize="large" sx={{ color: '#ef4444' }}/> },
    { title: 'Duplicates', count: duplicateCount, color: '#f59e0b', icon: <Warning fontSize="large" sx={{ color: '#f59e0b' }}/> },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'scale(2)' }}>
              {card.icon}
            </Box>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Typography color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                {card.title}
              </Typography>
              <Typography variant="h3" component="div" sx={{ color: card.color, fontWeight: 700 }}>
                {card.count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default FraudCards;
