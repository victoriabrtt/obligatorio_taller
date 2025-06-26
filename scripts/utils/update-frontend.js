const fs = require('fs');
const path = require('path');

// Script to update contract addresses in the frontend after deployment
async function updateFrontendContracts(addresses) {
  const { daoAddress, tokenAddress, ownerMultisigAddress, panicMultisigAddress } = addresses;
  
  const contractsPath = path.join(
    __dirname, 
    '../frontend/dao-frontend/src/contracts/contracts.ts'
  );
  
  // Read the current file content
  let content = fs.readFileSync(contractsPath, 'utf8');
  
  // Replace the contract addresses
  content = content.replace(
    /DAO: {\s*address: "0x[a-fA-F0-9]+"/,
    `DAO: {\n        address: "${daoAddress}"`
  );
  
  content = content.replace(
    /TOKEN: {\s*address: "0x[a-fA-F0-9]+"/,
    `TOKEN: {\n        address: "${tokenAddress}"`
  );
  
  content = content.replace(
    /MULTISIG: {\s*address: "0x[a-fA-F0-9]+"/,
    `MULTISIG: {\n        address: "${ownerMultisigAddress}"`
  );
  
  content = content.replace(
    /MULTISIG_FACTORY: {\s*address: "0x[a-fA-F0-9]+"/,
    `MULTISIG_FACTORY: {\n        address: "${panicMultisigAddress}"`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(contractsPath, content);
  
  console.log('Frontend contract addresses updated!');
}

module.exports = { updateFrontendContracts };
