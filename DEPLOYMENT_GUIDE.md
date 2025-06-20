# Guía de Despliegue y Uso de la DAO

Este documento proporciona instrucciones detalladas para desplegar, configurar y utilizar la aplicación DAO desarrollada para el Conjunto A del Obligatorio.

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue Local (Desarrollo)](#despliegue-local-desarrollo)
3. [Despliegue en Testnet](#despliegue-en-testnet)
4. [Configuración del Frontend](#configuración-del-frontend)
5. [Verificación de Contratos](#verificación-de-contratos)
6. [Uso de la Aplicación](#uso-de-la-aplicación)
7. [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

### Software Necesario
- Node.js (v18+)
- Git
- Metamask u otra billetera Web3
- Visual Studio Code (recomendado)

### Instalación de Dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del frontend
cd frontend/dao-frontend
npm install --legacy-peer-deps
cd ../../
```

## Despliegue Local (Desarrollo)

### 1. Iniciar un Nodo Local de Hardhat
```bash
npx hardhat node
```

### 2. Desplegar los Contratos
En una nueva terminal:
```bash
npx hardhat run scripts/deploy_dao.js --network localhost
```

### 3. Ejecutar Tests
```bash
npx hardhat test
```

## Despliegue en Testnet

### 1. Configurar Variables de Entorno
Crear un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tu configuración:
```
# Network URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/TU_CLAVE_INFURA
MUMBAI_URL=https://rpc-mumbai.maticvigil.com

# Deployment
PRIVATE_KEY=tu_clave_privada_aqui

# Verification
ETHERSCAN_API_KEY=tu_clave_api_etherscan
```

### 2. Desplegar en Testnet (Sepolia o Mumbai)
```bash
# Sepolia (Ethereum Testnet)
npx hardhat run scripts/deploy_dao.js --network sepolia

# Mumbai (Polygon Testnet)
npx hardhat run scripts/deploy_dao.js --network mumbai
```

## Configuración del Frontend

### 1. Verificar Configuración
El script de despliegue actualiza automáticamente las direcciones de los contratos en el frontend. Verifica que sean correctas en:
```
frontend/dao-frontend/src/contracts/contracts.ts
```

### 2. Ajustar Configuración RPC (si es necesario)
En `frontend/dao-frontend/src/context/DAOContext.tsx`, ajustar la URL del proveedor según la red de despliegue:

```typescript
// Para local:
const provider = new ethers.JsonRpcProvider('http://localhost:8545');

// Para Sepolia:
// const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');

// Para Mumbai:
// const provider = new ethers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
```

### 3. Ejecutar el Frontend
```bash
cd frontend/dao-frontend
npm start
```

## Verificación de Contratos

Si has desplegado en una testnet, puedes verificar tus contratos:

```bash
# Verificar Token
npx hardhat verify --network sepolia DIRECCIÓN_TOKEN

# Verificar DAO
npx hardhat verify --network sepolia DIRECCIÓN_DAO DIRECCIÓN_TOKEN
```

## Uso de la Aplicación

### Conectar Billetera
1. Abre la aplicación en tu navegador (http://localhost:3000)
2. Conecta tu billetera Metamask (debe estar en la misma red que los contratos)

### Comprar Tokens
1. Ve a la sección "Staking & Tokens"
2. Selecciona la pestaña "Compra de Tokens"
3. Ingresa la cantidad deseada y confirma la transacción

### Hacer Staking
1. En la sección "Staking & Tokens"
2. Aprueba tokens para el contrato DAO
3. Selecciona la pestaña correspondiente (Staking para Votar o Staking para Propuestas)
4. Ingresa la cantidad y confirma la transacción

### Crear Propuesta
1. Navega a "Crear Propuesta"
2. Completa el formulario con título, descripción y otros detalles
3. Confirma la transacción

### Votar en Propuestas
1. Ve a "Propuestas" para ver la lista
2. Selecciona una propuesta para ver sus detalles
3. Vota a favor o en contra

### Delegar Voto
1. En la página de detalles de una propuesta
2. Ingresa la dirección del delegado
3. Confirma la transacción de delegación

## Solución de Problemas

### Error en Transacciones
- Verifica que tu billetera esté conectada a la red correcta
- Asegúrate de tener ETH suficiente para gas
- Comprueba los logs para mensajes de error específicos

### Problemas de Compilación
```bash
# Limpiar caché y recompilar
npx hardhat clean
npx hardhat compile
```

### Problemas con el Frontend
```bash
# Reinstalar dependencias
cd frontend/dao-frontend
rm -rf node_modules
npm install --legacy-peer-deps
```

### Error de Nonce
Si tienes problemas con el nonce de las transacciones en Metamask:
1. Abre Metamask
2. Ve a Configuración > Avanzado
3. Selecciona "Restablecer cuenta"
