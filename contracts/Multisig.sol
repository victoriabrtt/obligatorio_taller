// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Multisig
 * @author Obligatorio 2025 Team
 * @notice Contrato de multifirma para gestión colectiva de transacciones
 * @dev Implementa un mecanismo de control donde múltiples firmantes deben aprobar
 * transacciones antes de que sean ejecutadas. Se utiliza para operaciones críticas
 * en la DAO como administración y resolución de emergencias.
 */
contract Multisig {
    /// @notice Lista de direcciones autorizadas para aprobar transacciones
    address[] public owners;
    
    /// @notice Número mínimo de aprobaciones requeridas para ejecutar una transacción
    uint public requiredApprovals;
    
    /// @notice Contador secuencial de transacciones creadas
    uint public transactionCount;

    /**
     * @notice Estructura que representa una transacción dentro del multisig
     * @dev Almacena toda la información necesaria para ejecutar y rastrear el estado de una transacción
     */
    struct Transaction {
        /// @notice Dirección del contrato destino de la transacción
        address destination;
        
        /// @notice Cantidad de ETH a enviar con la transacción
        uint value;
        
        /// @notice Indica si la transacción ya fue ejecutada
        bool executed;
        
        /// @notice Datos codificados para la llamada al contrato destino
        bytes data;
        
        /// @notice Número actual de aprobaciones recibidas
        uint approvalCount;
    }

    /// @notice Mapeo para acceder a transacciones por su ID
    mapping(uint => Transaction) public transactions;
    
    /// @notice Registro de aprobaciones: transactionId => owner => approved
    mapping(uint => mapping(address => bool)) public approvals;

    /**
     * @notice Emitido cuando se crea una nueva transacción
     * @param transactionId Identificador único de la transacción
     * @param destination Dirección destino de la transacción
     * @param value Cantidad de ETH enviada
     * @param data Datos de la llamada
     */
    event TransactionCreated(uint indexed transactionId, address indexed destination, uint value, bytes data);
    
    /**
     * @notice Emitido cuando un propietario aprueba una transacción
     * @param transactionId Identificador de la transacción
     * @param owner Dirección del propietario que aprobó
     */
    event TransactionApproved(uint indexed transactionId, address indexed owner);
    
    /**
     * @notice Emitido cuando una transacción es ejecutada exitosamente
     * @param transactionId Identificador de la transacción ejecutada
     */
    event TransactionExecuted(uint indexed transactionId);
    /**
     * @notice Emitido cuando se añade un nuevo propietario al multisig
     * @param owner Dirección del nuevo propietario
     */
    event OwnerAdded(address indexed owner);
    
    /**
     * @notice Emitido cuando se elimina un propietario del multisig
     * @param owner Dirección del propietario eliminado
     */
    event OwnerRemoved(address indexed owner);

    /**
     * @notice Restringe funciones para que solo sean llamables por propietarios del multisig
     * @dev Verifica que msg.sender esté en el array de propietarios
     */
    modifier onlyOwner() {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not an owner");
        _;
    }

    /**
     * @notice Verifica que una transacción con el ID proporcionado exista
     * @param transactionId El ID de la transacción a verificar
     */
    modifier transactionExists(uint transactionId) {
        require(transactionId < transactionCount, "Transaction does not exist");
        _;
    }

    /**
     * @notice Verifica que una transacción no haya sido ejecutada todavía
     * @param transactionId El ID de la transacción a verificar
     */
    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    /**
     * @notice Verifica que el propietario actual no haya aprobado ya la transacción
     * @param transactionId El ID de la transacción a verificar
     */
    modifier notApproved(uint transactionId) {
        require(!approvals[transactionId][msg.sender], "Transaction already approved by you");
        _;
    }

    /**
     * @notice Inicializa el contrato multifirma con los propietarios y umbral de aprobación especificados
     * @dev Establece los propietarios iniciales y el número mínimo de aprobaciones requeridas
     * @param _owners Array de direcciones que serán propietarias del contrato
     * @param _requiredApprovals Número de aprobaciones necesarias para ejecutar una transacción
     * @custom:security Incluye validaciones para evitar propietarios duplicados o direcciones nulas
     */
    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length > 0, "Owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length, "Invalid number of required approvals");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            
            // Verificar que no haya duplicados
            for (uint j = 0; j < i; j++) {
                require(owners[j] != owner, "Duplicate owner");
            }
            
            owners.push(owner);
        }
        
        requiredApprovals = _requiredApprovals;
    }

    /**
     * @notice Crea y registra una nueva transacción pendiente de aprobación
     * @dev La transacción se aprueba automáticamente por el remitente y puede ejecutarse 
     * si ya alcanza el umbral requerido de aprobaciones
     * @param destination Dirección del contrato o cuenta a la que se enviará la transacción
     * @param value Cantidad de ETH (en wei) a enviar con la transacción
     * @param data Datos codificados de la función a llamar (vacío para transferencias simples)
     * @return transactionId ID único de la transacción creada (secuencial)
     */
    function submitTransaction(address destination, uint value, bytes memory data) 
        public
        onlyOwner
        returns (uint transactionId)
    {
        transactionId = transactionCount;
        
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            executed: false,
            data: data,
            approvalCount: 0
        });
        
        transactionCount += 1;
        emit TransactionCreated(transactionId, destination, value, data);
        
        // Auto-aprobar la transacción por el creador
        approveTransaction(transactionId);
    }

    /**
     * @dev Aprueba una transacción pendiente
     * @param transactionId ID de la transacción a aprobar
     */
    /**
     * @notice Aprueba una transacción pendiente y la ejecuta automáticamente si alcanza el umbral
     * @dev Registra la aprobación del propietario y ejecuta la transacción si se alcanzó el umbral requerido
     * @param transactionId ID de la transacción a aprobar
     */
    function approveTransaction(uint transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
        notApproved(transactionId)
    {
        approvals[transactionId][msg.sender] = true;
        transactions[transactionId].approvalCount += 1;
        
        emit TransactionApproved(transactionId, msg.sender);
        
        // Ejecutar automáticamente si se alcanzó el umbral de aprobaciones
        if (transactions[transactionId].approvalCount >= requiredApprovals) {
            executeTransaction(transactionId);
        }
    }

    /**
     * @notice Ejecuta una transacción que ya tiene suficientes aprobaciones
     * @dev Verifica que haya suficientes aprobaciones, marca la transacción como ejecutada
     * y realiza la llamada externa. Revierte toda la operación si la llamada falla.
     * @param transactionId ID de la transacción a ejecutar
     * @custom:security Esta función maneja la ejecución de código externo, lo que representa
     * un vector de ataque potencial si los propietarios aprueban una transacción maliciosa
     */
    function executeTransaction(uint transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        Transaction storage txn = transactions[transactionId];
        require(txn.approvalCount >= requiredApprovals, "Not enough approvals");
        
        txn.executed = true;
        
        // Ejecutar la transacción
        (bool success, ) = txn.destination.call{value: txn.value}(txn.data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(transactionId);
    }

    /**
     * @notice Permite a un propietario revocar su aprobación previa de una transacción
     * @dev Elimina la aprobación del propietario y reduce el contador de aprobaciones
     * @param transactionId ID de la transacción para la cual se revoca la aprobación
     * @custom:requirement La transacción no debe estar ejecutada y el propietario debe haberla aprobado previamente
     */
    function revokeApproval(uint transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        require(approvals[transactionId][msg.sender], "Transaction not approved by you");
        
        approvals[transactionId][msg.sender] = false;
        transactions[transactionId].approvalCount -= 1;
    }

    /**
     * @notice Devuelve el número total de propietarios registrados en el multisig
     * @dev Útil para iterar sobre la lista de propietarios o validar configuraciones
     * @return count Número total de propietarios
     */
    function getOwnersCount() public view returns (uint count) {
        return owners.length;
    }

    /**
     * @notice Devuelve el array completo de direcciones propietarias
     * @dev Proporciona acceso a la lista completa de propietarios para verificación externa
     * @return Array con todas las direcciones registradas como propietarias
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @notice Permite que el contrato reciba ETH directamente
     * @dev Esta función es necesaria para que el contrato pueda mantener fondos que luego serán usados en transacciones
     */
    receive() external payable {}
}
