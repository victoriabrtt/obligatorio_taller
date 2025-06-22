// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./UyArt.sol";

contract StakeForNFT {

    IERC20 public immutable token;
    UyArt public immutable nft;
    
    // Variables de limites
    uint256 public deployedBlock;
    uint256 public constant STAKING_WINDOW = 1000; // Blocks
    uint256 public constant MIN_STAKE_AMOUNT = 1000 * 10**18; // 1000 tokens con 18 decimales
    uint256 public constant MAX_TOTAL_STAKED = 100000 * 10**18; // 100,000 tokens con 18 decimales
    
    uint256 public totalStaked = 0;
    bool public nftDistributed = false;

    struct StakeRecord {
        uint256 balance;
        uint256 blockNumber;
        bool claimed;
    }

    mapping(address => StakeRecord) public stakes;

    event Staked(address indexed user, uint256 amount);
    event NFTClaimed(address indexed user, uint256 amount, uint256 firstTokenId);

    /**
     * @param _tokenAddress address del token ERC20 para staking (OrtToken)
     * @param _nftAddress address del contrato UyArt NFT
     */
    constructor(address _tokenAddress, address _nftAddress) {
        require(_tokenAddress != address(0), "La direccion del token no puede ser vacia");
        require(_nftAddress != address(0), "La direccion del NFT no puede ser vacia");
        
        token = IERC20(_tokenAddress);
        nft = UyArt(_nftAddress);
        deployedBlock = block.number;
    }

    /**
     * @notice Stake `amount` tokens. El usuario debe invocar 'approve' en el token primero
     * @param amount numero de tokens a stakear (debe ser multiplo de 1000)
     */
    function stake(uint256 amount) external {
        require(block.number <= deployedBlock + STAKING_WINDOW, "Periodo de staking finalizado");
        require(amount >= MIN_STAKE_AMOUNT, "El monto debe ser al menos 1000 tokens");
        require(amount % MIN_STAKE_AMOUNT == 0, "El monto debe ser multiplo de 1000 tokens");
        require(totalStaked + amount <= MAX_TOTAL_STAKED, "Excede el maximo total de staking");

        // Transferir tokens al contrato
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Error en transferencia de tokens");

        // Actualizar el registro de stake
        StakeRecord storage rec = stakes[msg.sender];
        rec.balance += amount;
        rec.blockNumber = block.number;
        rec.claimed = false;
        
        // Actualizar total
        totalStaked += amount;

        // Emitir evento de stake   
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Permite a los usuarios reclamar sus NFTs despues del periodo de staking
     */
    function claimNFTs() external {
        require(block.number > deployedBlock + STAKING_WINDOW, "Periodo de staking aun no finalizado");
        
        StakeRecord storage rec = stakes[msg.sender];
        uint256 balance = rec.balance;
        
        require(balance >= MIN_STAKE_AMOUNT, "No tiene suficientes tokens en stake");
        require(!rec.claimed, "NFTs ya reclamados");
        
        // Calcular cuantos NFTs recibe
        uint256 nftAmount = balance / MIN_STAKE_AMOUNT;
        
        // Marcar como reclamado
        rec.claimed = true;
        
        // Mintear los NFTs para el usuario
        uint256 firstTokenId = mintNFTsToUser(msg.sender, nftAmount);
        
        // Emitir evento
        emit NFTClaimed(msg.sender, nftAmount, firstTokenId);
    }
    
    /**
     * @dev Funcion interna para mintear NFTs a un usuario
     */
    function mintNFTsToUser(address user, uint256 amount) private returns (uint256) {
        // Asumimos que el contrato UyArt tiene una funcion para mintear NFTs
        uint256 firstTokenId = 0;
        
        for (uint256 i = 0; i < amount; i++) {
            // Generar metadata unica para cada NFT
            string memory metadata = generateMetadata(user, i);
            
            // Mintear el NFT y guardar el primer ID
            uint256 tokenId = _mintNFT(user, metadata);
            if (i == 0) {
                firstTokenId = tokenId;
            }
        }
        
        return firstTokenId;
    }
    
    /**
     * @dev Funcion para generar metadatos para el NFT
     * En una implementación real estos metadatos estarían en IPFS
     * Para este ejercicio, generamos una URI única que podría ser parseada por un frontend
     * Format: ipfs://{tokenId}_{userAddress}_{index}
     */
    function generateMetadata(address user, uint256 index) private pure returns (string memory) {
        // Generamos un string simulando un CID de IPFS seguido de metadatos
        // En un caso real, esto sería un hash real de IPFS que apuntaría a un JSON 
        // con los metadatos del NFT (imagen, nombre, atributos)
        string memory baseURI = "ipfs://QmUyArtCollection/";
        string memory uniqueId = string(abi.encodePacked(toHexString(user), "_", uint2str(index)));
        
        // Un NFT con metadata correcta tendría un JSON similar a:
        // {
        //   "name": "Uruguay Art #X",
        //   "description": "Arte de la colección Uruguay",
        //   "image": "ipfs://QmImageHash/X.jpg",
        //   "attributes": [{"trait_type": "Artist", "value": "Artist Name"}, ...]
        // }
        
        return string(abi.encodePacked(baseURI, uniqueId));
    }
    
    /**
     * @dev Funcion para mintear un NFT utilizando el contrato UyArt
     */
    function _mintNFT(address to, string memory metadata) private returns (uint256) {
        return nft.mint(to, metadata);
    }
    
    /**
     * @dev Convierte un uint a string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    /**
     * @dev Convierte una direccion a string hexadecimal
     */
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(addr)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            buffer[2*i] = char(hi);
            buffer[2*i+1] = char(lo);            
        }
        return string(buffer);
    }
    
    /**
     * @dev Convierte un byte a su representacion hexadecimal
     */
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
