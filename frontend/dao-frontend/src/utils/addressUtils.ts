/**
 * Utility functions for Ethereum addresses
 */

/**
 * Shortens an Ethereum address to a more readable format
 * @param address Full Ethereum address
 * @param chars Number of characters to keep at the beginning and end
 * @returns Shortened address in format 0x1234...abcd
 */
/**
 * Utility functions for Ethereum addresses
 */

/**
 * Shortens an Ethereum address to the format 0x1234...5678
 * @param address The full Ethereum address
 * @param chars Number of characters to show at each end
 * @returns Shortened address string
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  const prefixLength = 2; // "0x" prefix
  const start = address.substring(0, chars + prefixLength);
  const end = address.substring(address.length - chars);
  
  return `${start}...${end}`;
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address Address to validate
 * @returns True if valid, false otherwise
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Simple regex to check if it looks like an Ethereum address
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
};

/**
 * Formats the address for display based on ENS if available
 * @param address Ethereum address
 * @param ens ENS name if available
 * @returns Formatted address string
 */
export const formatAddress = (address: string, ens?: string): string => {
  if (!address) return '';
  
  if (ens) return ens;
  return shortenAddress(address);
};

