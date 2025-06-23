// Script to create a proposal and vote
const { ethers } = require("hardhat");

async function main() {
  // Get the user address
  const userAddress = process.env.USER_ADDRESS;
  
  if (!userAddress) {
    console.error("Please provide a user address as USER_ADDRESS environment variable");
    console.error("Example: USER_ADDRESS=0x123... npx hardhat run scripts/create_proposal.js --network localhost");
    process.exit(1);
  }
  
  console.log(`Creating proposal as: ${userAddress}`);
  
  // Get DAO address and contract
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  try {
    // Impersonate the user account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [userAddress]
    });
    
    const userSigner = await ethers.getImpersonatedSigner(userAddress);
    
    // Create a proposal
    const proposalDescription = "Mi propuesta de prueba: Cambiar duración de propuestas a 3 días";
    console.log(`Creating proposal: "${proposalDescription}"`);
    
    // Try to create a parameter change proposal
    console.log("Creating parameter change proposal...");
    const tx = await dao.connect(userSigner).createParameterChangeProposal(
      proposalDescription,
      "proposalDurationDays",
      3
    );
    await tx.wait();
    console.log("Proposal created successfully!");
    
    // Get the proposal ID
    // Assume it's the latest proposal, so we check the proposal count
    let proposalId = 0;
    try {
      // Try different methods to find the proposal count
      const filter = dao.filters.ProposalCreated();
      const events = await dao.queryFilter(filter);
      proposalId = events.length - 1;
      console.log(`Proposal ID: ${proposalId}`);
    } catch (error) {
      console.log("Could not determine proposal ID, assuming it's 3");
      proposalId = 3;
    }
    
    // Vote on another proposal
    const voteProposalId = 0; // Vote on the first proposal for testing
    console.log(`Voting on proposal ID ${voteProposalId}...`);
    const voteTx = await dao.connect(userSigner).voteProposal(voteProposalId, true);
    await voteTx.wait();
    console.log("Vote cast successfully!");
    
    // Stop impersonating the account
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [userAddress]
    });
    
    console.log("All operations completed successfully!");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
