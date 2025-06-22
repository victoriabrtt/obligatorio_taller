require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./web/artifacts",
  }
};
