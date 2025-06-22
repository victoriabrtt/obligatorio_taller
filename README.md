# DAO Governance System - Obligatorio 2025

## Overview

This project implements a Decentralized Autonomous Organization (DAO) governance system with quadratic voting and multi-level delegation capabilities. The system allows token holders to create and vote on proposals, delegate voting power, and participate in decentralized governance.

## Project Structure

```
obligatorio_taller/
├── contracts/                  # Smart contracts
│   ├── DAO.sol                 # Original DAO implementation
│   ├── DAO_update.sol          # Improved DAO implementation
│   ├── Lock.sol                # Simple locking contract
│   ├── Multisig.sol            # Multi-signature wallet
│   ├── MultisigFactory.sol     # Factory for creating Multisig contracts
│   └── MyToken.sol             # Governance token
├── test/                       # Test files
│   ├── DAO.delegation.test.js  # Tests for delegation functionality
│   ├── DAO.multisig.test.js    # Tests for multisig integration
│   ├── DAO.proposals.test.js   # Tests for proposal functionality
│   ├── DAO.staking.test.js     # Tests for staking functionality
│   ├── DAO.voting.test.js      # Tests for voting functionality
│   ├── DAO.quadraticVoting.test.js  # Tests for quadratic voting edge cases
│   ├── DAO.multiLevelDelegation.test.js  # Tests for multi-level delegation
│   ├── DAO.proposals.edgecases.test.js  # Tests for proposal edge cases
│   ├── DAO_update.verification.test.js  # Verification tests for DAO_update
│   ├── DAO_update.full.test.js  # Comprehensive tests for DAO_update
│   ├── Lock.test.js            # Tests for Lock contract
│   ├── Multisig.test.js        # Tests for Multisig contract
│   └── REPORT.md               # Report of findings and recommendations
├── scripts/                    # Deployment and utility scripts
│   ├── deploy_dao.js           # DAO deployment script
│   ├── deploy_dao_with_funds.js # DAO deployment with initial funding
│   └── ...                     # Other utility scripts
├── frontend/                   # Frontend components
│   └── dao-frontend/           # React frontend for the DAO
├── DAO-IMPROVEMENTS.md         # Detailed documentation of improvements
├── UPGRADE-PLAN.md             # Plan for upgrading to the new system
├── FINAL-REPORT.md             # Summary of project achievements
└── hardhat.config.js           # Hardhat configuration
```

## Features

- **Quadratic Voting**: Voting power scales as the square root of tokens, balancing influence
- **Multi-level Delegation**: Transfer voting power through unlimited delegation chains
- **Proposal Management**: Create, vote on, and execute proposals
- **Security Controls**: Emergency pause, multisig ownership, and voting restrictions
- **Token Integration**: Governance token with staking for voting and proposal creation

## Key Improvements

The project includes significant improvements to the original DAO system:

1. **Enhanced Delegation System**:
   - Multi-level delegation chain resolution
   - Circular delegation prevention
   - Separation of general and proposal-specific delegation

2. **Voting System Enhancements**:
   - Improved quadratic voting implementation
   - Enhanced voting period validation
   - Prevention of double voting (after delegation)

3. **Documentation**:
   - Comprehensive NatSpec documentation
   - Detailed technical documentation
   - Upgrade plan and implementation guide

4. **Testing**:
   - Expanded test coverage for edge cases
   - Specific test suites for quadratic voting and delegation
   - Verification tests for improvements

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- Hardhat

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd obligatorio_taller
```

2. Install dependencies
```bash
npm install
```

3. Compile contracts
```bash
npx hardhat compile
```

4. Run tests
```bash
npx hardhat test
```

5. Deploy locally
```bash
npx hardhat node
npx hardhat run scripts/deploy_dao.js --network localhost
```

## Frontend

The frontend application provides a user interface for the DAO system. To run it:

```bash
cd frontend/dao-frontend
npm install
npm start
```

Visit `http://localhost:3000` to access the application.

## Documentation

All project documentation is located in the `docs/` folder:

- [docs/TECHNICAL_DOCUMENTATION.md](./docs/TECHNICAL_DOCUMENTATION.md): Technical details of the system
- [docs/IMPROVEMENTS.md](./docs/IMPROVEMENTS.md): Detailed documentation of improvements
- [docs/UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md): Plan for upgrading to the new system
- [docs/FINAL_REPORT.md](./docs/FINAL_REPORT.md): Project summary and achievements
- [docs/FRONTEND_IMPROVEMENTS.md](./docs/FRONTEND_IMPROVEMENTS.md): Frontend UX improvements
- [docs/ALL_DOCS.md](./docs/ALL_DOCS.md): Complete list of documentation files
- [test/REPORT.md](./test/REPORT.md): Testing report with findings

## License

This project is licensed under the MIT License - see the LICENSE file for details.
