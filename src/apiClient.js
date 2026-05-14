// Local Storage API Client - Replaces backend API calls
// All data is now stored locally in browser's localStorage

import { processAndSaveFiles, getTransactions, clearTransactions } from './services/storageService';

// Upload files and process locally (no backend call)
export const uploadFiles = async (bankFile, appFile) => {
  try {
    // Process files locally and save to localStorage
    const transactions = await processAndSaveFiles(bankFile, appFile);
    return transactions;
  } catch (error) {
    console.error('Local file processing failed:', error);
    throw new Error('Failed to process files: ' + error.message);
  }
};

// Retrieve stored transactions from localStorage
export const getStoredTransactions = () => {
  return getTransactions();
};

// Clear stored transactions
export const clearStoredTransactions = () => {
  return clearTransactions();
};

// Mock API client object for compatibility
const apiClient = {
  post: async (endpoint, data) => {
    console.log('API call to:', endpoint);
    // Could be extended for other endpoints in future
  }
};

export default apiClient;
