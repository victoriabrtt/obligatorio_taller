// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Multisig.sol";

/**
 * @title MultisigFactory
 * @dev Factory para crear contratos Multisig
 */
contract MultisigFactory {
    mapping(address => bool) public isMultisig;
    address[] public multisigs;

    event MultisigCreated(address indexed multisig, address[] owners, uint requiredApprovals);

    /**
     * @dev Crea un nuevo contrato Multisig
     * @param owners Array de direcciones que serán propietarios del contrato
     * @param requiredApprovals Número de aprobaciones necesarias
     * @return multisigAddress Dirección del contrato Multisig creado
     */
    function createMultisig(address[] memory owners, uint requiredApprovals) public returns (address) {
        Multisig multisig = new Multisig(owners, requiredApprovals);
        address multisigAddress = address(multisig);
        
        isMultisig[multisigAddress] = true;
        multisigs.push(multisigAddress);
        
        emit MultisigCreated(multisigAddress, owners, requiredApprovals);
        
        return multisigAddress;
    }

    /**
     * @dev Obtiene el número de multisigs creados
     * @return count Número de multisigs
     */
    function getMultisigsCount() public view returns (uint) {
        return multisigs.length;
    }
}
