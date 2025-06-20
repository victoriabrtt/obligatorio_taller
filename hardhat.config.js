require("@nomicfoundation/hardhat-toolbox");
require("hardhat-coverage");
require('dotenv').config();

// Define private key environment variable or use a default empty string
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    mumbai: {
      url: process.env.MUMBAI_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      chainId: 80001
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
}


