import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, Grid, Paper, 
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  AppBar, Toolbar, IconButton, CircularProgress, Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  CloudUpload, 
  Logout,
  Menu as MenuIcon,
  Delete as DeleteIcon,
  DatasetLinked as DatasetIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FraudCards from '../components/FraudCards';
import TransactionTable from '../components/TransactionTable';
import { uploadFiles, getStoredTransactions, clearStoredTransactions } from '../apiClient';
import storageService from '../services/storageService';

const drawerWidth = 240;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bankFile, setBankFile] = useState(null);
  const [appFile, setAppFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);
  const navigate = useNavigate();

  // Load saved transactions on component mount
  useEffect(() => {
    const saved = getStoredTransactions();
    if (saved.length > 0) {
      setTransactions(saved);
    }
    const uploadTime = storageService.getLastUpload();
    if (uploadTime) {
      setLastUpload(uploadTime);
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleUpload = async () => {
    if (!bankFile || !appFile) {
      alert("Please upload both files.");
      return;
    }
    setLoading(true);
    try {
      const data = await uploadFiles(bankFile, appFile);
      setTransactions(data);
      setLastUpload(new Date().toISOString());
      setBankFile(null);
      setAppFile(null);
      alert("Files processed successfully!");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to process files: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleData = () => {
    const sampleData = storageService.addSampleData();
    setTransactions(sampleData);
    setLastUpload(new Date().toISOString());
    alert("Sample data loaded successfully!");
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all transaction data?")) {
      clearStoredTransactions();
      setTransactions([]);
      setLastUpload(null);
      setBankFile(null);
      setAppFile(null);
      alert("Data cleared successfully!");
    }
  };

  const drawer = (
    <Box sx={{ backgroundColor: '#1e293b', height: '100%', color: '#fff' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#6366f1' }}>
          UPI Fraud Guard
        </Typography>
      </Toolbar>
      <List>
        <ListItem button selected sx={{ '&.Mui-selected': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }}}>
          <ListItemIcon><DashboardIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          color="inherit" 
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, backgroundColor: '#1e293b' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Transaction Verification Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        
        <Container maxWidth="xl">
          {/* Status and Info Section */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Status:
              </Typography>
              <Chip 
                label={transactions.length > 0 ? `${transactions.length} transactions loaded` : "No data loaded"}
                color={transactions.length > 0 ? "success" : "default"}
                size="small"
              />
              {lastUpload && (
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Last upload: {new Date(lastUpload).toLocaleString()}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small"
                variant="outlined" 
                startIcon={<DatasetIcon />}
                onClick={handleLoadSampleData}
              >
                Load Sample Data
              </Button>
              {transactions.length > 0 && (
                <Button 
                  size="small"
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearData}
                >
                  Clear Data
                </Button>
              )}
            </Box>
          </Paper>

          {/* File Upload Section */}
          <Paper sx={{ p: 3, mb: 4, backgroundColor: '#1e293b' }}>
            <Typography variant="h6" gutterBottom>Upload Transaction Files</Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                  {bankFile ? bankFile.name : "Upload Bank Statement (CSV or Excel)"}
                  <input type="file" hidden accept=".csv, .txt, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setBankFile(e.target.files[0])} />
                </Button>
              </Grid>
              <Grid item xs={12} md={5}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                  {appFile ? appFile.name : "Upload App Transactions (CSV or Excel)"}
                  <input type="file" hidden accept=".csv, .txt, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setAppFile(e.target.files[0])} />
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Verify Now"}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Fraud Cards Summary */}
          {transactions.length > 0 && (
            <FraudCards transactions={transactions} />
          )}

          {/* Transaction Table */}
          {transactions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <TransactionTable transactions={transactions} />
            </Box>
          )}

        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
