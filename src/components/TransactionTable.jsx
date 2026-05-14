import React, { useState } from 'react';
import { 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, TextField, 
  Box, Chip, Typography, Button
} from '@mui/material';
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';

const TransactionTable = ({ transactions }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  if (!transactions || transactions.length === 0) return null;

  const normalizedTransactions = transactions.map((transaction) => ({
    utrNumber: transaction.utrNumber ?? transaction.UTR ?? '',
    status: transaction.status ?? transaction.Status ?? '',
  }));

  const headers = ['utrNumber', 'status'];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const filteredTransactions = normalizedTransactions.filter(t => {
    const term = searchTerm.toLowerCase();
    return Object.values(t).some(val => 
      val && val.toString().toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'REAL': return 'success';
      case 'FAKE': return 'error';
      case 'DUPLICATE': return 'warning';
      default: return 'default';
    }
  };

  const downloadCSV = () => {
    // Create user-friendly column headers for CSV export
    const displayHeaders = ['UTR Number', 'Status'];
    const csvHeaders = displayHeaders.join(',');
    const csvContent = [csvHeaders].concat(
      filteredTransactions.map(t => {
        return [
          `"${t.utrNumber || ''}"`,
          `"${t.status || ''}"`
        ].join(',');
      })
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "verification_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', backgroundColor: '#1e293b' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>Verification Results</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'flex-end' }}>
          <TextField
            size="small"
            placeholder="Search any field..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1, minWidth: '250px' }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />}
            onClick={downloadCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {headers.map(header => (
                <TableCell key={header} sx={{ backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold' }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                    {headers.map(header => (
                      <TableCell key={header} sx={{ color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                        {header === 'status' ? (
                          <Chip 
                            label={row[header]} 
                            color={getStatusColor(row[header])} 
                            size="small"
                            sx={{ fontWeight: 'bold', minWidth: 60 }}
                          />
                        ) : (
                          row[header]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ color: '#fff' }}
      />
    </Paper>
  );
};

export default TransactionTable;
