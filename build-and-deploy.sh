#!/bin/bash
# build-and-deploy.sh - Script to build and deploy the DAO application

# Exit script on any error
set -e

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== DAO Application Build & Deploy Script ====${NC}"
echo -e "${YELLOW}This script will build and deploy the DAO application${NC}"
echo

# Check required tools
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Ask for deployment network
echo -e "${YELLOW}Select deployment network:${NC}"
echo "1) Local Hardhat Node (development)"
echo "2) Sepolia Testnet"
echo "3) Mumbai Testnet"
read -p "Enter your choice (1-3): " network_choice

# Set network based on choice
case $network_choice in
  1)
    NETWORK="localhost"
    ;;
  2)
    NETWORK="sepolia"
    ;;
  3)
    NETWORK="mumbai"
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}Selected network: ${NETWORK}${NC}"

# Make sure the .env file exists for non-local deployments
if [[ "$NETWORK" != "localhost" && ! -f ".env" ]]; then
    echo -e "${RED}Error: .env file not found. It's required for testnet deployments.${NC}"
    echo -e "${YELLOW}Please create a .env file based on .env.example${NC}"
    exit 1
fi

# 1. Install dependencies
echo -e "${GREEN}Installing main project dependencies...${NC}"
npm install

echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd frontend/dao-frontend
npm install --legacy-peer-deps
cd ../..

# 2. Start local node if needed
if [[ "$NETWORK" == "localhost" ]]; then
    echo -e "${GREEN}Starting local Hardhat node in the background...${NC}"
    echo -e "${YELLOW}This will use terminal port 1. You can access it with: fg 1${NC}"
    npx hardhat node &
    NODE_PID=$!
    
    # Give the node some time to start
    echo -e "${YELLOW}Waiting for the local node to start...${NC}"
    sleep 5
fi

# 3. Deploy contracts
echo -e "${GREEN}Deploying contracts to ${NETWORK}...${NC}"
npx hardhat run scripts/deploy_dao.js --network $NETWORK

# 4. Run tests if local
if [[ "$NETWORK" == "localhost" ]]; then
    echo -e "${GREEN}Running tests...${NC}"
    npx hardhat test
fi

# 5. Build frontend
echo -e "${GREEN}Building frontend...${NC}"
cd frontend/dao-frontend
npm run build
cd ../..

echo -e "${GREEN}==== Build and Deploy Completed ====${NC}"
echo 

# Show instructions based on network
if [[ "$NETWORK" == "localhost" ]]; then
    echo -e "${GREEN}To run the frontend in development mode:${NC}"
    echo "cd frontend/dao-frontend && npm start"
    echo
    echo -e "${YELLOW}Your local Hardhat node is running in the background (process $NODE_PID)${NC}"
    echo "To stop it, run: kill $NODE_PID"
else
    # For testnet deployments
    echo -e "${GREEN}Your DAO has been deployed to ${NETWORK}${NC}"
    echo -e "${YELLOW}Check the deployments folder for contract addresses${NC}"
    echo
    echo -e "${GREEN}To run the frontend in development mode:${NC}"
    echo "cd frontend/dao-frontend && npm start"
    echo
    echo -e "${GREEN}To deploy the frontend:${NC}"
    echo "Upload the contents of frontend/dao-frontend/build to your hosting provider"
fi

echo
echo -e "${GREEN}Thank you for using the DAO Application!${NC}"
