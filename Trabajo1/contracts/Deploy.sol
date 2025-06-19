// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OrtToken.sol";
import "./UyArt.sol";
import "./StakeForNFT.sol";

contract Deploy {
    OrtToken public token;
    UyArt public nft;
    StakeForNFT public staking;
    
    constructor() {
        // Desplegar OrtToken con 1,000,000 de tokens (con 18 decimales)
        token = new OrtToken(1000000 * 10**18);
        
        // Desplegar NFT UyArt
        nft = new UyArt();
        
        // Desplegar contrato de staking
        staking = new StakeForNFT(address(token), address(nft));
        
        // Configurar el contrato de staking en el NFT
        nft.setStakingContract(address(staking));
        
        // Dar una asignacion inicial de tokens para pruebas
        token.transfer(msg.sender, 500000 * 10**18);
    }
}
