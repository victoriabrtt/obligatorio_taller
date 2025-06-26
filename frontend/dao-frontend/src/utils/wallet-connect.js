// wallet-connect.js - Helper script for wallet connection
// Save this file in frontend/dao-frontend/src/utils/wallet-connect.js

import { ethers } from 'ethers';

/**
 * Helper functions for wallet connections
 */
export const walletConnect = {
  /**
   * Connect to a wallet (MetaMask, WalletConnect, etc.)
   * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, address: string}>}
   */
  async connect() {
    try {
      // Check if window.ethereum exists
      if (!window.ethereum) {
        throw new Error("No wallet found. Please install MetaMask or another Web3 wallet.");
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet and try again.");
      }
      
      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log("Connected to wallet:", address);
      
      return { provider, signer, address };
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  },
  
  /**
   * Check if a user is connected to a wallet
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    try {
      if (!window.ethereum) return false;
      
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      return accounts.length > 0;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  },
  
  /**
   * Get the current network information
   * @returns {Promise<{chainId: number, name: string}>}
   */
  async getNetwork() {
    try {
      if (!window.ethereum) throw new Error("No wallet found");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error) {
      console.error("Error getting network:", error);
      throw error;
    }
  },
  
  /**
   * Switch to a different network
   * @param {number} chainId - The chain ID to switch to
   */
  async switchNetwork(chainId) {
    try {
      if (!window.ethereum) throw new Error("No wallet found");
      
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      
      console.log(`Switched to network with chainId: ${chainId}`);
    } catch (error) {
      console.error("Error switching network:", error);
      throw error;
    }
  }
};

export default walletConnect;
