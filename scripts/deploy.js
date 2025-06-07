async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
  
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy(); // ← NO LLAMES .deployed()
  
    console.log("Token deployed to:", await token.getAddress()); // nuevo método
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  