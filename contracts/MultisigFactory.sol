// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Multisig.sol";

/**
 * @title MultisigFactory
 * @dev Contrato fábrica para crear y registrar instancias de contratos Multisig.
 * Este contrato permite la creación de nuevas carteras multifirma y mantiene un registro
 * de todas las instancias creadas para facilitar su seguimiento y validación.
 * Es una parte clave del sistema de gobernanza de la DAO, proporcionando carteras
 * para funciones críticas como owner y panic.
 */
contract MultisigFactory {
    /// @notice Mapeo para verificar si una dirección corresponde a un contrato Multisig creado por esta fábrica
    mapping(address => bool) public isMultisig;
    
    /// @notice Array con todas las direcciones de contratos Multisig creados
    address[] public multisigs;

    /**
     * @notice Emitido cuando se crea un nuevo contrato Multisig
     * @param multisig La dirección del contrato Multisig creado
     * @param owners Lista de propietarios asignados al Multisig
     * @param requiredApprovals Número de aprobaciones requeridas para ejecutar transacciones
     */
    event MultisigCreated(address indexed multisig, address[] owners, uint requiredApprovals);

    /**
     * @notice Crea un nuevo contrato Multisig con los propietarios y requisitos especificados
     * @dev Despliega un nuevo contrato Multisig, lo registra en la fábrica y emite un evento
     * @param owners Array de direcciones que serán propietarios del contrato Multisig
     * @param requiredApprovals Número de aprobaciones necesarias para ejecutar transacciones
     * @return multisigAddress Dirección del contrato Multisig recién creado
     * @custom:validation Los requisitos de validación están en el contrato Multisig
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
     * @notice Devuelve el número total de contratos Multisig creados por esta fábrica
     * @dev Útil para iterar sobre el array multisigs si es necesario
     * @return Cantidad de contratos Multisig registrados
     */
    function getMultisigsCount() public view returns (uint) {
        return multisigs.length;
    }
}
