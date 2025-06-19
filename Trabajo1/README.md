# Trabajo 1 - Sistema de Staking con NFT

Este proyecto implementa un sistema de staking con token ERC20 (OrtToken) que recompensa a los usuarios con NFTs (UyArt) al final de un período de staking.

## Contratos

### OrtToken.sol
- Token ERC20 estándar utilizado para el staking
- Implementado con OpenZeppelin

### UyArt.sol
- NFT ERC721 personalizado (sin utilizar OpenZeppelin)
- Supply máximo: 100 tokens
- Cada NFT tiene metadatos asociados

### StakeForNFT.sol
- Contrato de staking con restricciones:
  - Staking permitido solo durante 1000 bloques después del despliegue
  - Monto mínimo: 1000 tokens y solo múltiplos de 1000
  - Máximo total: 100,000 tokens en staking
- Al finalizar el período, los usuarios pueden reclamar 1 NFT por cada 1000 tokens en staking

### Deploy.sol
- Contrato auxiliar para desplegar todos los contratos en una sola transacción

## Requisitos

- Node.js v16+ y npm
- Hardhat

## Instalación

```bash
# Instalar dependencias
npm install
```

## Uso

```bash
# Compilar contratos
npx hardhat compile

# Ejecutar pruebas
npx hardhat test

# Desplegar en red local
npx hardhat run scripts/deploy.js --network localhost

# Ejecutar demostración completa del flujo de trabajo
npx hardhat run scripts/workflow_demo.js
```

## Flujo de trabajo

1. Desplegar los contratos (OrtToken, UyArt, StakeForNFT)
2. Usuarios hacen staking de sus tokens (múltiplos de 1000)
3. Después de 1000 bloques termina el período de staking
4. Usuarios llaman a claimNFTs() para recibir sus NFTs
5. Los NFTs son minteados al reclamar (1 NFT por cada 1000 tokens en staking)
