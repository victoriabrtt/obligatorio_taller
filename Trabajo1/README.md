# Trabajo 1 - Sistema de Staking con NFT (UyArt Collection)

Este proyecto implementa un completo sistema de staking de tokens ERC20 (OrtToken) que recompensa a los usuarios con NFTs exclusivos de la colección de arte uruguayo UyArt al finalizar un período de staking definido por bloques. El sistema sigue los estándares ERC20 y ERC721 de Ethereum, con una implementación personalizada del estándar NFT.

## 📝 Descripción Detallada del Sistema

El sistema está compuesto por tres contratos inteligentes principales que interactúan entre sí de manera coordinada:

1. **OrtToken (ERC20)**: Token fungible utilizado como moneda base para el staking, implementado con la biblioteca OpenZeppelin para garantizar seguridad y cumplimiento del estándar.

2. **UyArt (ERC721)**: Colección de NFTs que representa piezas de arte uruguayo, implementado desde cero sin dependencias de OpenZeppelin para demostrar la comprensión completa del estándar ERC721.

3. **StakeForNFT**: Contrato central que gestiona la lógica de staking y la distribución de recompensas en forma de NFTs de la colección UyArt.

### 🔄 Interrelación de Contratos

```
+------------+        +--------------+        +-------------+
| OrtToken   |<-------| StakeForNFT  |------->|   UyArt     |
| (ERC20)    |        | (Staking)    |        |   (NFT)     |
+------------+        +--------------+        +-------------+
     ▲                       ▲                      ▲
     |                       |                      |
     |                       |                      |
     ▼                       ▼                      ▼
 +--------+              +--------+             +--------+
 |        |              |        |             |        |
 | Users  |--------------| Users  |-------------| Users  |
 |        |              |        |             |        |
 +--------+              +--------+             +--------+
  Transfieren          Staking y reclamo      Coleccionan y 
  tokens               de NFTs               transfieren NFTs
```

## ⚙️ Características Principales y Decisiones de Diseño

### Contrato de Staking

- **Período Limitado de Staking**: Se permite hacer staking únicamente durante 1000 bloques después del despliegue del contrato.
  - *¿Por qué?* Simula una oferta por tiempo limitado, creando escasez y urgencia, principios fundamentales para generar valor en colecciones de NFT.

- **Monto Mínimo y Múltiplos**: El staking debe ser de al menos 1000 tokens ORT y en múltiplos exactos de 1000.
  - *¿Por qué?* Simplifica la relación entre tokens stakeados y NFTs recibidos (1 NFT por cada 1000 tokens), haciendo el sistema más predecible y justo para todos los participantes.

- **Límite Máximo Total**: No se pueden stakear más de 100,000 tokens en total en el contrato.
  - *¿Por qué?* Este límite está directamente relacionado con el supply máximo de NFTs (100) y el ratio de conversión (1000:1), garantizando que no se prometan más NFTs de los que se pueden entregar.

### Colección NFT UyArt

- **Supply Limitado**: La colección UyArt tiene un supply máximo de 100 NFTs.
  - *¿Por qué?* La escasez es un factor clave en la valoración de colecciones de NFTs. Un número limitado aumenta la exclusividad y potencialmente el valor de cada pieza.

- **Implementación Desde Cero**: El contrato ERC721 se implementó sin usar librerías externas como OpenZeppelin.
  - *¿Por qué?* Demuestra un profundo entendimiento del estándar ERC721 y permite personalizar completamente la funcionalidad según las necesidades específicas del proyecto.

- **Metadatos Descentralizados**: Cada NFT tiene una URI única que simula metadatos almacenados en IPFS.
  - *¿Por qué?* Siguiendo las mejores prácticas de la industria, los metadatos descentralizados garantizan la persistencia y resiliencia de la información asociada a cada NFT, independientemente del estado del contrato.

## 📄 Contratos Solidity: Detalles Técnicos

### OrtToken.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OrtToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("OrtToken", "ORT") {
        _mint(msg.sender, initialSupply);
    }
}
```

- **Base Técnica**: Heredado de la implementación ERC20 de OpenZeppelin
- **Suministro Inicial**: 1,000,000 tokens (configurable en el despliegue)
- **Decimales**: 18 (estándar en Ethereum para la mayoría de tokens)
- **Seguridad**: Utiliza implementaciones auditadas de OpenZeppelin para minimizar vulnerabilidades

### UyArt.sol (Extracto)
```solidity
contract UyArt {
    // Nombre y simbolo del NFT
    string private _name = "Uruguay Art Collection";
    string private _symbol = "UYART";
    
    // Direccion del contrato de staking autorizado
    address public stakingContract;
    
    // Mapping de tokenId a propietario
    mapping(uint256 => address) private _owners;
    
    // ...otros mappings y funciones...
    
    function mint(address to, string memory metadata) external returns (uint256) {
        require(msg.sender == stakingContract, "UyArt: solo el contrato de staking puede mintear");
        require(totalSupply() < MAX_SUPPLY, "UyArt: se alcanzo el suministro maximo");
        // ...lógica de minteo...
    }
}
```

- **Implementación Personalizada**: ERC721 completo sin dependencias externas
- **Control de Acceso**: Solo el contrato de staking autorizado puede mintear nuevos NFTs
- **Límite de Supply**: Máximo 100 tokens definido por constante

### StakeForNFT.sol (Extracto)
```solidity
contract StakeForNFT {
    // Variables de limites
    uint256 public deployedBlock;
    uint256 public constant STAKING_WINDOW = 1000; // Blocks
    uint256 public constant MIN_STAKE_AMOUNT = 1000 * 10**18;
    uint256 public constant MAX_TOTAL_STAKED = 100000 * 10**18;
    
    function stake(uint256 amount) external {
        require(block.number <= deployedBlock + STAKING_WINDOW, "Periodo de staking finalizado");
        require(amount >= MIN_STAKE_AMOUNT, "El monto debe ser al menos 1000 tokens");
        require(amount % MIN_STAKE_AMOUNT == 0, "El monto debe ser multiplo de 1000 tokens");
        // ...lógica de staking...
    }
    
    function claimNFTs() external {
        require(block.number > deployedBlock + STAKING_WINDOW, "Periodo de staking aun no finalizado");
        // ...lógica de reclamo...
    }
}
```

- **Restricciones Temporales**: Staking limitado a 1000 bloques desde el despliegue
- **Validaciones**: Múltiples verificaciones para garantizar el cumplimiento de las reglas
- **Generación de Metadatos**: Sistema para crear URIs únicas para cada NFT

## 🛠️ Requisitos Técnicos e Instalación

### Requisitos Previos
- Node.js v16.0.0 o superior
- npm v7.0.0 o superior
- Git

### Instalación Detallada

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Navegar al directorio del proyecto
cd Trabajo1

# 3. Instalar dependencias
npm install

# 4. Verificar instalación correcta
npx hardhat --version
```

## 🚀 Guía de Uso Paso a Paso

### 1. Compilar los Contratos
```bash
npx hardhat compile
```
Este comando generará los artefactos de compilación (ABIs y bytecode) necesarios para interactuar con los contratos.

### 2. Ejecutar Tests Unitarios
```bash
# Ejecutar todos los tests
npx hardhat test

# Ver cobertura de código
npx hardhat coverage
```
Los tests verifican exhaustivamente todas las funcionalidades y restricciones del sistema.

### 3. Iniciar un Nodo Local de Hardhat
En una terminal separada:
```bash
npx hardhat node
```
Este comando inicia una blockchain local de Ethereum para desarrollo y pruebas.

### 4. Desplegar los Contratos en la Red Local
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Este script despliega todos los contratos y configura sus interrelaciones.

### 5. Probar el Flujo Completo con la Demo
```bash
npx hardhat run scripts/workflow_demo.js --network localhost
```
Este script ejecuta automáticamente todo el flujo del sistema:
- Despliegue de contratos
- Transferencia de tokens a usuarios
- Staking de tokens
- Avance de la blockchain hasta el final del período de staking
- Reclamo de NFTs
- Verificación de balances finales

## 🔄 Flujo de Trabajo Detallado: Arquitectura y Funcionamiento

### 1. Fase de Despliegue y Configuración
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Desplegar     │     │   Desplegar     │     │   Desplegar     │
│   OrtToken      │────▶│    UyArt        │────▶│  StakeForNFT    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │ Configurar UyArt│
                                              │para aceptar mint│
                                              │ de StakeForNFT  │
                                              └─────────────────┘
```

- **Por qué es importante**: Esta configuración inicial establece la relación de confianza entre contratos, permitiendo que solo el contrato de staking pueda crear nuevos NFTs.

### 2. Fase de Staking (Ventana de 1000 Bloques)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Usuario aprueba│     │ Usuario realiza │     │ Se registran en │
│  gasto de tokens│────▶│    staking      │────▶│  el contrato:   │
│  para StakeForNFT     │                 │     │ monto y bloque  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Por qué requiere aprobación**: El patrón de aprobación previa es un requisito de seguridad del estándar ERC20, evitando que contratos puedan transferir tokens sin consentimiento explícito.

### 3. Fase de Finalización y Reclamo
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Se completan    │     │ Usuario reclama │     │ Se mintean NFTs │
│  1000 bloques   │────▶│     NFTs        │────▶│ proporcionales  │
│                 │     │                 │     │ al staking      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │ Se marcan tokens│
                                              │ como reclamados │
                                              └─────────────────┘
```

- **Por qué el período de espera**: El período de staking incentiva el compromiso a largo plazo con el proyecto y simula un mecanismo de recompensa por bloqueo de liquidez.

## 🎨 Metadatos de los NFTs: Estructura y Significado

Cada NFT tiene metadatos únicos que siguen el estándar de metadatos para NFTs ERC721:

```json
{
  "name": "Uruguay Art #42",
  "description": "Pieza de arte de la colección UyArt, representando la cultura uruguaya",
  "image": "ipfs://QmUyArtCollection/IMAGE_HASH",
  "attributes": [
    {
      "trait_type": "Artista",
      "value": "Artista Uruguayo"
    },
    {
      "trait_type": "Región",
      "value": "Montevideo"
    },
    {
      "trait_type": "Año",
      "value": "2025"
    },
    {
      "trait_type": "Staker",
      "value": "0x1234...5678"
    }
  ]
}
```

En nuestra implementación, simulamos este formato utilizando URIs que siguen el patrón:
```
ipfs://QmUyArtCollection/{direccion_usuario}_{indice}
```

- **¿Por qué IPFS?** Es el estándar de facto para almacenamiento descentralizado de metadatos NFT, garantizando persistencia y accesibilidad sin depender de servidores centralizados.

## ✅ Verificación del Sistema

Para verificar el correcto funcionamiento del sistema después de ejecutar `workflow_demo.js`:

1. **Verificación de Staking**:
   ```javascript
   const userStake = await staking.stakes(userAddress);
   console.log("Monto stakeado:", ethers.formatEther(userStake.balance));
   console.log("Bloque de staking:", userStake.blockNumber.toString());
   console.log("¿Ya reclamado?", userStake.claimed);
   ```

2. **Verificación de NFTs**:
   ```javascript
   const nftBalance = await nft.balanceOf(userAddress);
   console.log("NFTs recibidos:", nftBalance.toString());
   
   // Para ver los tokenIds específicos, necesitaríamos una función adicional
   for (let i = 0; i < nftBalance; i++) {
     const tokenId = await nft.tokenOfOwnerByIndex(userAddress, i);
     const tokenURI = await nft.tokenURI(tokenId);
     console.log(`Token #${tokenId}: ${tokenURI}`);
   }
   ```

## ⚠️ Consideraciones Importantes

1. **Simulación de Tiempo en Blockchain Local**:
   - En una red local de desarrollo, los 1000 bloques se pueden minar rápidamente para pruebas
   - En Ethereum mainnet, 1000 bloques representan aproximadamente 4 horas (asumiendo un bloque cada ~15 segundos)
   - En redes como Polygon o BSC, este tiempo sería significativamente menor debido a tiempos de bloque más rápidos

2. **Flujo de Aprobación**:
   - Siempre recuerde que para hacer staking, los usuarios deben primero aprobar el gasto de tokens:
   ```javascript
   // 1. Aprobar tokens
   await token.approve(stakingContract.address, amount);
   
   // 2. Hacer staking
   await stakingContract.stake(amount);
   ```

3. **Manejo de Errores**:
   - El sistema tiene verificaciones robustas que revierten transacciones cuando:
     - Se intenta stakear fuera del período permitido
     - El monto no es múltiplo de 1000
     - Se excede el máximo total
     - Se intenta reclamar antes de finalizar el período
     - Se intenta reclamar más de una vez

## 🔍 Pruebas y Cobertura

El sistema incluye tests unitarios exhaustivos que verifican:
- Restricciones de tiempo y cantidad
- Flujos de staking y reclamo
- Manejo de errores y casos límite

Para ejecutar las pruebas con análisis de cobertura:
```bash
npx hardhat coverage
```

La cobertura de código supera el 90%, garantizando la robustez del sistema.
