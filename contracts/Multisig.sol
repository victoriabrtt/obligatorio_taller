// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Multisig
 * @dev Contrato de multifirma que permite a múltiples firmantes aprobar transacciones
 * antes de ser ejecutadas.
 */
contract Multisig {
    address[] public owners;
    uint public requiredApprovals;
    uint public transactionCount;

    struct Transaction {
        address destination;
        uint value;
        bool executed;
        bytes data;
        uint approvalCount;
    }

    // Mapping para transacciones por ID
    mapping(uint => Transaction) public transactions;
    
    // Mapping para seguir aprobaciones: transactionId => owner => approved
    mapping(uint => mapping(address => bool)) public approvals;

    event TransactionCreated(uint indexed transactionId, address indexed destination, uint value, bytes data);
    event TransactionApproved(uint indexed transactionId, address indexed owner);
    event TransactionExecuted(uint indexed transactionId);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);

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

    modifier transactionExists(uint transactionId) {
        require(transactionId < transactionCount, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }

    modifier notApproved(uint transactionId) {
        require(!approvals[transactionId][msg.sender], "Transaction already approved by you");
        _;
    }

    /**
     * @dev Constructor que establece los propietarios iniciales y cuántas aprobaciones se requieren
     * @param _owners Array de direcciones que serán propietarias del contrato
     * @param _requiredApprovals Número de aprobaciones necesarias para ejecutar una transacción
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
     * @dev Crea una nueva transacción que necesitará ser aprobada
     * @param destination Dirección del contrato a llamar
     * @param value Cantidad de ETH a enviar
     * @param data Datos de la llamada codificados
     * @return transactionId ID de la transacción creada
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
     * @dev Ejecuta una transacción si tiene suficientes aprobaciones
     * @param transactionId ID de la transacción a ejecutar
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
     * @dev Revoca una aprobación previa
     * @param transactionId ID de la transacción
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
     * @dev Obtiene el número de propietarios
     * @return count Número de propietarios
     */
    function getOwnersCount() public view returns (uint count) {
        return owners.length;
    }

    /**
     * @dev Obtiene la lista de propietarios
     * @return Lista de direcciones propietarias
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Permite recibir ETH
     */
    receive() external payable {}
}
