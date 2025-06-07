const { ethers } = require("hardhat");

async function main() {
  const [deployer, owner, panicWallet] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Owner:", owner.address);
  console.log("Panic Wallet:", panicWallet.address);

  // Deploy del token
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MyToken deployed to:", tokenAddress);

  // Deploy de DAO
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("DAO deployed to:", daoAddress);

  // Set owner y pánico
  await dao.setOwner(owner.address);
  console.log("Owner set");

  await dao.connect(owner).setPanicWallet(panicWallet.address);
  console.log("Panic wallet set");

  // Inicializar parámetros
  const initParams = {
    stakingToVote: 100,
    stakingToPropose: 200,
    minStakingTime: 3600,
    votePowerDivider: 1000,
    proposalDurationDays: 7,
    tokenPriceInWei: ethers.parseEther("0.01"),
  };

  await dao.connect(owner).initParameters(
    initParams.stakingToVote,
    initParams.stakingToPropose,
    initParams.minStakingTime,
    initParams.votePowerDivider,
    initParams.proposalDurationDays,
    initParams.tokenPriceInWei
  );
  console.log("DAO parameters initialized");

  // Despausar la DAO
  await dao.connect(panicWallet).tranquility();
  console.log("DAO is now active ✅");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
