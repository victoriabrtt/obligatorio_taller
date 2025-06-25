// This script updates the frontend contract addresses with the latest deployment

const fs = require('fs');
const path = require('path');

// Get the latest deployment file
function getLatestDeploymentFile() {
    const deploymentsDir = path.join(__dirname, '../deployments');
    
    // Read all files in the deployments directory
    const files = fs.readdirSync(deploymentsDir);
    
    // Filter for localhost deployment files
    const deploymentFiles = files
        .filter(file => file.startsWith('localhost-'))
        .map(file => {
            const filePath = path.join(deploymentsDir, file);
            return {
                name: file,
                path: filePath,
                timestamp: parseInt(file.split('-')[1].split('.')[0])
            };
        });
    
    // Sort by timestamp descending (newest first)
    deploymentFiles.sort((a, b) => b.timestamp - a.timestamp);
    
    if (deploymentFiles.length === 0) {
        console.error('No deployment files found!');
        return null;
    }
    
    return deploymentFiles[0].path;
}

// Update frontend contract addresses
async function updateFrontendAddresses() {
    const deploymentFilePath = getLatestDeploymentFile();
    
    if (!deploymentFilePath) {
        return false;
    }
    
    try {
        // Read deployment data
        const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, 'utf8'));
        
        // Frontend contracts file path
        const frontendContractsPath = path.join(
            __dirname, 
            '../frontend/dao-frontend/src/contracts/contracts.ts'
        );
        
        // Read current contracts.ts content
        let contractsContent = fs.readFileSync(frontendContractsPath, 'utf8');
        
        // Update DAO address
        contractsContent = contractsContent.replace(
            /DAO: \{\s*address: "0x[a-fA-F0-9]+"/,
            `DAO: {\n        address: "${deploymentData.addresses.daoAddress}"`
        );
        
        // Update TOKEN address
        contractsContent = contractsContent.replace(
            /TOKEN: \{\s*address: "0x[a-fA-F0-9]+"/,
            `TOKEN: {\n        address: "${deploymentData.addresses.tokenAddress}"`
        );
        
        // Update MULTISIG (owner) address
        contractsContent = contractsContent.replace(
            /MULTISIG: \{\s*address: "0x[a-fA-F0-9]+"/,
            `MULTISIG: {\n        address: "${deploymentData.addresses.ownerMultisigAddress}"`
        );
        
        // Update MULTISIG_FACTORY (panic) address
        contractsContent = contractsContent.replace(
            /MULTISIG_FACTORY: \{\s*address: "0x[a-fA-F0-9]+"/,
            `MULTISIG_FACTORY: {\n        address: "${deploymentData.addresses.panicMultisigAddress}"`
        );
        
        // Write updated content back to file
        fs.writeFileSync(frontendContractsPath, contractsContent);
        
        console.log('Frontend contract addresses updated successfully!');
        console.log(`DAO: ${deploymentData.addresses.daoAddress}`);
        console.log(`Token: ${deploymentData.addresses.tokenAddress}`);
        console.log(`Owner Multisig: ${deploymentData.addresses.ownerMultisigAddress}`);
        console.log(`Panic Multisig: ${deploymentData.addresses.panicMultisigAddress}`);
        
        return true;
    } catch (error) {
        console.error('Error updating frontend contract addresses:', error);
        return false;
    }
}

// Run the update function if script is called directly
if (require.main === module) {
    updateFrontendAddresses()
        .then(success => {
            if (!success) {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { updateFrontendAddresses };
