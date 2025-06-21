# Trabajo 1 - Sistema de Staking con NFT (UyArt Collection)

Este proyecto implementa un sistema de staking con tokens ERC20 (OrtToken) que recompensa a los usuarios con NFTs de la colección UyArt al final de un período de staking definido por bloques.

## Descripción del Sistema

El sistema consiste en tres contratos principales que interactúan entre sí:

1. **OrtToken**: Un token ERC20 estándar que se utiliza para hacer staking.
2. **UyArt**: Un NFT ERC721 que representa una colección de arte uruguayo.
3. **StakeForNFT**: Un contrato que permite a los usuarios hacer staking de OrtToken y reclamar NFTs UyArt como recompensa.

## Características Principales

- **Período limitado de staking**: Solo se puede hacer staking durante 1000 bloques después del despliegue del contrato.
- **Monto mínimo y múltiplos**: El staking debe ser de al menos 1000 tokens y en múltiplos de 1000.
- **Límite máximo**: No se pueden stakear más de 100,000 tokens en total en el contrato.
- **Recompensas en NFTs**: Al finalizar el período de staking, los usuarios pueden reclamar 1 NFT por cada 1000 tokens stakeados.
- **Supply limitado**: La colección UyArt tiene un supply máximo de 100 NFTs.
- **Metadatos descentralizados**: Cada NFT tiene una URI única que simula metadatos almacenados en IPFS.

## Contratos Solidity

### OrtToken.sol
- Token ERC20 estándar utilizado para el staking
- Implementado con OpenZeppelin para mayor seguridad
- Suministro inicial: 1,000,000 tokens (configurable)
- Decimales: 18

### UyArt.sol
- Implementación desde cero del estándar ERC721 (sin usar OpenZeppelin)
- Supply máximo: 100 tokens
- Funcionalidades:
  - Transferencia de tokens
  - Aprobaciones y operadores
  - Metadatos con URI para cada token
  - Limitación de minteo (solo el contrato de staking puede mintear)

### StakeForNFT.sol
- Contrato de staking con las restricciones mencionadas
- Funciones principales:
  - `stake(uint256 amount)`: Para hacer staking de tokens
  - `claimNFTs()`: Para reclamar NFTs después del período de staking
- Sistema de generación de metadatos para cada NFT minteado

## Requisitos Técnicos

- Node.js v16+ y npm
- Hardhat v2.12+ (para compilación, pruebas y despliegue)

## Instalación

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# Navegar al directorio
cd Trabajo1

# Instalar dependencias
npm install
```

## Uso Paso a Paso

### 1. Compilar los contratos

```bash
npx hardhat compile
```

### 2. Ejecutar las pruebas

```bash
npx hardhat test
```

### 3. Iniciar un nodo local de Hardhat

En una terminal separada:

```bash
npx hardhat node
```

### 4. Desplegar los contratos en la red local

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Probar el flujo completo con la demo

```bash
npx hardhat run scripts/workflow_demo.js --network localhost
```

## Flujo de trabajo detallado

1. **Despliegue de contratos**:
   - Se despliega OrtToken con un suministro inicial
   - Se despliega UyArt (colección de NFT)
   - Se despliega StakeForNFT vinculando ambos contratos
   - Se configura UyArt para que acepte minteo desde StakeForNFT

2. **Período de staking (1000 bloques)**:
   - Los usuarios aprueban y hacen staking de sus tokens ORT
   - Solo se aceptan cantidades múltiplos de 1000
   - Se registra la cantidad y el bloque de cada staking

3. **Finalización del período**:
   - Después de 1000 bloques, no se permite más staking
   - Los usuarios pueden llamar a `claimNFTs()`

4. **Reclamo de NFTs**:
   - Cada usuario recibe 1 NFT por cada 1000 tokens en staking
   - Los NFTs se mintean con metadatos únicos
   - Los registros se marcan como "reclamados" para evitar reclamos duplicados

## Metadatos de los NFTs

Cada NFT tiene un identificador único y metadatos asociados que simulan estar almacenados en IPFS. En una implementación real, estos metadatos apuntarían a un archivo JSON con:
- Nombre del NFT
- Descripción
- URL de la imagen
- Atributos del arte

## Verificación del funcionamiento

Después de ejecutar el script de workflow_demo.js, podrás verificar:
1. Cuántos tokens ha stakeado cada usuario
2. Cuántos NFTs ha recibido cada usuario
3. Los metadatos asociados a cada NFT

## Notas importantes

- El contrato está configurado para funcionar en una blockchain local con bloques que se generan rápidamente
- En una red principal, 1000 bloques representarían aproximadamente 4 horas en Ethereum
- Los tokens deben ser aprobados antes de hacer staking (approve -> stake)
