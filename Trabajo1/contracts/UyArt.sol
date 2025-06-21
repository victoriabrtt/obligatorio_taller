// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UyArt
 * @dev Implementacion del estandar ERC721 para NFT de arte uruguayo
 * Basado en: https://eips.ethereum.org/EIPS/eip-721
 */
contract UyArt {
    // Nombre y simbolo del NFT
    string private _name = "Uruguay Art Collection";
    string private _symbol = "UYART";
    
    // Contador de tokens
    uint256 private _tokenIdCounter = 1;
    uint256 private constant MAX_SUPPLY = 100;
    
    // Direccion del contrato de staking autorizado
    address public stakingContract;
    address public owner;
    
    // Mapping de tokenId a propietario
    mapping(uint256 => address) private _owners;
    
    // Mapping de propietario a cantidad de tokens
    mapping(address => uint256) private _balances;
    
    // Mapping de tokenId a URI con metadatos
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping de tokenId a direcciones aprobadas
    mapping(uint256 => address) private _tokenApprovals;
    
    // Mapping de propietario a operador aprobado
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /**
     * @dev Emitido cuando se transfiere el `tokenId` de `from` a `to`
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    
    /**
     * @dev Emitido cuando `owner` permite a `approved` administrar el `tokenId`
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    
    /**
     * @dev Emitido cuando `owner` habilita o deshabilita a `operator` para administrar todos sus tokens
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Configura el contrato de staking autorizado
     */
    function setStakingContract(address _stakingContract) external {
        require(msg.sender == owner, "UyArt: solo el propietario puede configurar el contrato de staking");
        stakingContract = _stakingContract;
    }

    /**
     * @dev Devuelve el nombre del token
     */
    function name() external view returns (string memory) {
        return _name;
    }
    
    /**
     * @dev Devuelve el simbolo del token
     */
    function symbol() external view returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev Devuelve el URI de metadatos para un tokenId específico
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "UyArt: consulta para token inexistente");
        string memory baseURI = _baseURI();
        
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return string(abi.encodePacked(baseURI, _tokenURIs[tokenId]));
        }
        
        return baseURI;
    }
    
    /**
     * @dev URI base para completar los metadatos tokenURI
     */
    function _baseURI() internal pure returns (string memory) {
        return "ipfs://";
    }

    /**
     * @dev Devuelve la cantidad de tokens en la cuenta de `owner`
     */
    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "UyArt: balance consulta para address cero");
        return _balances[owner];
    }
    
    /**
     * @dev Devuelve el propietario del `tokenId`
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "UyArt: propietario consulta para token inexistente");
        return owner;
    }
    
    /**
     * @dev Transfiere el `tokenId` de `from` a `to`
     */
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "UyArt: transferencia de token no poseido");
        require(to != address(0), "UyArt: transferencia a address cero");
        
        // Eliminar aprobaciones
        _approve(address(0), tokenId);
        
        // Actualizar balances
        _balances[from]--;
        _balances[to]++;
        
        // Actualizar propietario
        _owners[tokenId] = to;
        
        // Emitir evento
        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Transfiere el `tokenId` de `from` a `to`
     */
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "UyArt: transferencia no autorizada");
        _transfer(from, to, tokenId);
    }
    
    /**
     * @dev Transfiere el `tokenId` de `from` a `to` de forma segura, verificando que `to` puede recibir NFTs
     * En nuestra implementacion basica es igual a transferFrom
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    /**
     * @dev Transfiere el `tokenId` de `from` a `to` de forma segura con datos adicionales
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "UyArt: transferencia no autorizada");
        _transfer(from, to, tokenId);
        
        // Aqui normalmente se verificaria si el destinatario es un contrato y si puede recibir NFTs
        // Para simplificar nuestra implementacion, omitimos esta verificacion
        // Esta es la principal diferencia con una implementacion completa del ERC721
    }
    
    /**
     * @dev Aprueba a `to` para transferir el `tokenId`
     */
    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(to != owner, "UyArt: aprobacion al propietario actual");
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "UyArt: no aprobado para todos"
        );
        
        _approve(to, tokenId);
    }
    
    /**
     * @dev Funcion interna para aprobar
     */
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    /**
     * @dev Devuelve la direccion aprobada para un `tokenId` especifico
     */
    function getApproved(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "UyArt: aprobado consulta para token inexistente");
        return _tokenApprovals[tokenId];
    }
    
    /**
     * @dev Aprueba o desaprueba al `operator` para transferir todos los tokens del remitente
     */
    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "UyArt: aprobacion a uno mismo");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @dev Devuelve si el `operator` esta autorizado para administrar todos los tokens de `owner`
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    /**
     * @dev Verifica si la direccion tiene permisos para transferir un token
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "UyArt: operador consulta para token inexistente");
        address owner = ownerOf(tokenId);
        return (spender == owner || _tokenApprovals[tokenId] == spender || isApprovedForAll(owner, spender));
    }
    
    /**
     * @dev Verifica si el token existe
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }
    
    /**
     * @dev Funcion publica para mintear un nuevo token NFT (solo contrato de staking puede llamarlo)
     */
    function mint(address to, string memory tokenMetadata) external returns (uint256) {
        require(msg.sender == stakingContract, "UyArt: solo el contrato de staking puede mintear");
        return _mint(to, tokenMetadata);
    }
    
    /**
     * @dev Funcion interna para mintear un nuevo token NFT
     */
    function _mint(address to, string memory tokenMetadata) internal returns (uint256) {
        require(to != address(0), "UyArt: minteo a la direccion cero");
        require(_tokenIdCounter <= MAX_SUPPLY, "UyArt: Superado el maximo supply");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _balances[to]++;
        _owners[tokenId] = to;
        
        if (bytes(tokenMetadata).length > 0) {
            _tokenURIs[tokenId] = tokenMetadata;
        }
        
        emit Transfer(address(0), to, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Retorna la cantidad total de tokens minteados
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Retorna el supply maximo
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @dev Funcion para crear la URI con metadatos para un tokenId
     */
    function generateTokenURI(string memory imageHash) internal pure returns (string memory) {
        return imageHash;
    }
    
    /**
     * @dev Función auxiliar para ver tokens de un propietario (no es parte del estándar ERC721)
     * Útil para interfaces y para testear
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 tokenCount = _balances[_owner];
        
        if (tokenCount == 0) {
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 counter = 0;
            
            // Recorremos todo el rango de tokens posibles
            for (uint256 i = 1; i <= _tokenIdCounter && counter < tokenCount; i++) {
                if (_owners[i] == _owner) {
                    result[counter] = i;
                    counter++;
                }
            }
            
            return result;
        }
    }
}
