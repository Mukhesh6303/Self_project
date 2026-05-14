import * as XLSX from 'xlsx';

// Local Storage Service for managing transaction data
const STORAGE_KEYS = {
  TRANSACTIONS: 'upi_fraud_transactions',
  LAST_UPLOAD: 'upi_fraud_last_upload'
};

// Strict UTR extraction and verification (matches Python logic)
// Extracts only the `UTR` column from an uploaded file and returns cleaned UTR strings
const extractUTRsFromFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve([]);

    const name = (file && file.name) ? file.name.toLowerCase() : '';
    const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');
    const utrRegex = /^\d{10,16}$/;

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (!rows || rows.length === 0) return resolve([]);

          const header = rows[0].map(h => (h || '').toString().trim());
          const utrIndex = header.findIndex(h => h.toLowerCase() === 'utr');
          if (utrIndex === -1) return reject(new Error('UTR column not found in Excel file'));

          const utRS = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            let cell = row[utrIndex];
            if (cell === undefined || cell === null) continue;
            let val = cell.toString().trim();
            if (val.endsWith('.0')) val = val.slice(0, -2);
            val = val.replace(/\s+/g, '');
            if (!val) continue;
            if (!utrRegex.test(val)) continue;
            utRS.push(val);
          }

          resolve(utRS);
        } catch (err) {
          reject(new Error('Failed to parse Excel file: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    } else {
      // Assume CSV / text
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          if (!text) return resolve([]);
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          if (lines.length === 0) return resolve([]);

          const headerParts = lines[0].split(',').map(h => h.trim());
          const utrIndex = headerParts.findIndex(h => h.toLowerCase() === 'utr');
          if (utrIndex === -1) return reject(new Error('UTR column not found in CSV file'));

          const utRS = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            const cell = parts[utrIndex];
            if (cell === undefined || cell === null) continue;
            let val = cell.toString().trim().replace(/^['"]|['"]$/g, '');
            if (val.endsWith('.0')) val = val.slice(0, -2);
            val = val.replace(/\s+/g, '');
            if (!val) continue;
            if (!utrRegex.test(val)) continue;
            utRS.push(val);
          }

          resolve(utRS);
        } catch (err) {
          reject(new Error('Failed to parse CSV file: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    }
  });
};

// Save transactions to localStorage
export const saveTransactions = (transactions) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.LAST_UPLOAD, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Failed to save transactions:', error);
    return false;
  }
};

// Get transactions from localStorage
export const getTransactions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve transactions:', error);
    return [];
  }
};

// Get last upload timestamp
export const getLastUpload = () => {
  return localStorage.getItem(STORAGE_KEYS.LAST_UPLOAD);
};

// Clear all transactions
export const clearTransactions = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPLOAD);
    return true;
  } catch (error) {
    console.error('Failed to clear transactions:', error);
    return false;
  }
};

// Process uploaded files and save results
export const processAndSaveFiles = async (bankFile, appFile) => {
  try {
    // Extract only UTR values from each file (strict rules)
    const bankUTRs = await extractUTRsFromFile(bankFile);
    const appUTRs = await extractUTRsFromFile(appFile);

    if (!bankUTRs || bankUTRs.length === 0) {
      throw new Error('No valid UTRs found in bank statement');
    }

    if (!appUTRs || appUTRs.length === 0) {
      throw new Error('No valid UTRs found in app transactions');
    }

    // Build bank set for quick lookup
    const bankSet = new Set(bankUTRs);

    // Count occurrences in app to detect duplicates
    const counts = {};
    appUTRs.forEach(utr => { counts[utr] = (counts[utr] || 0) + 1; });

    // Preserve order but only include unique utrNumbers
    const seen = new Set();
    const results = [];
    for (const utr of appUTRs) {
      if (seen.has(utr)) continue;
      seen.add(utr);
      let status = 'FAKE';
      if (counts[utr] > 1) status = 'DUPLICATE';
      else if (bankSet.has(utr)) status = 'REAL';
      results.push({ utrNumber: utr, status });
    }

    if (results.length === 0) {
      throw new Error('No valid transactions found after processing files');
    }

    saveTransactions(results);
    return results;
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};

// Helper: Read file as text or convert Excel to CSV string
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const name = (file && file.name) ? file.name.toLowerCase() : '';
    const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
          resolve(csv);
        } catch (err) {
          reject(new Error('Failed to parse Excel file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    }
  });
};

// Add sample data for testing
export const addSampleData = () => {
  const sampleTransactions = [
    { utrNumber: 'UTR001', amount: '5000', status: 'REAL' },
    { utrNumber: 'UTR002', amount: '10000', status: 'REAL' },
    { utrNumber: 'UTR003', amount: '7500', status: 'FAKE' },
    { utrNumber: 'UTR004', amount: '3000', status: 'DUPLICATE' },
    { utrNumber: 'UTR005', amount: '15000', status: 'REAL' },
    { utrNumber: 'UTR006', amount: '2500', status: 'FAKE' },
  ];
  
  saveTransactions(sampleTransactions);
  return sampleTransactions;
};

export default {
  saveTransactions,
  getTransactions,
  getLastUpload,
  clearTransactions,
  processAndSaveFiles,
  addSampleData
};
