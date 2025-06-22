# Guía de Ejecución del Sistema DAO

Este documento proporciona instrucciones detalladas para ejecutar todos los componentes del sistema DAO, incluyendo contratos inteligentes, tests, backend y frontend.

## Entorno de Ejecución

El sistema ha sido probado en el siguiente entorno:
- Ubuntu 24.04 (también funciona en macOS y Windows)
- Node.js v18+
- Hardhat para simulación de red Ethereum
- Visual Studio Code

## Instalación de Prerequisites

### 1. Node.js y NPM

```bash
# Instalar Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 8.x.x o superior
```

### 2. Hardhat y Dependencias del Proyecto

```bash
# Clonar el repositorio (si no lo tiene ya)
git clone <url-del-repositorio>
cd obligatorio_taller

# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del frontend
cd frontend/dao-frontend
npm install --legacy-peer-deps
cd ../../
```

## Ejecución de los Contratos Inteligentes

### 1. Iniciar Nodo Local de Hardhat

```bash
# En una terminal
npx hardhat node
```

El nodo local estará disponible en `http://localhost:8545`.

### 2. Desplegar Contratos

```bash
# En otra terminal
npx hardhat run scripts/deployment/deploy_dao.js --network localhost
```

Este comando despliega:
- El contrato del token ERC-20 (MyToken)
- El contrato principal de la DAO
- Configura los multisig necesarios
- Inicializa los parámetros de la DAO

La información del despliegue se guardará en el directorio `deployments/`.

## Ejecución de Tests

### 1. Tests Unitarios

```bash
# Ejecutar todos los tests
npx hardhat test

# Ejecutar un test específico
npx hardhat test test/DAO.staking.test.js
```

### 2. Coverage de Tests

```bash
# Ejecutar test coverage
npx hardhat coverage

# Ver informe generado
open coverage/index.html
```

El informe de cobertura mostrará un 100% de cobertura en los contratos principales, según lo requerido.

## Ejecución del Frontend

### 1. Preparar Frontend

El frontend utiliza las direcciones de los contratos desplegados. Tras el despliegue, estas direcciones se actualizan automáticamente en el archivo de configuración.

```bash
# Verificar que las direcciones están actualizadas
cat frontend/dao-frontend/src/contracts/contracts.ts
```

Si necesita actualizar manualmente las direcciones:

```bash
# Actualizar las direcciones en el frontend
npx hardhat run scripts/utils/update-frontend.js --network localhost
```

### 2. Iniciar Servidor Frontend

```bash
# Iniciar servidor de desarrollo
cd frontend/dao-frontend
npm start
```

El frontend estará disponible en `http://localhost:3000`.

## Verificación de Funcionamiento

### 1. Conexión con MetaMask

1. Instale la extensión MetaMask en su navegador
2. Configure la red local de Hardhat en MetaMask:
   - Nombre: Hardhat Local
   - URL de RPC: http://localhost:8545
   - ID de Cadena: 31337
   - Símbolo: ETH
3. Importe algunas cuentas de prueba usando las claves privadas que muestra el nodo Hardhat

### 2. Interactuar con la DAO

1. Visite http://localhost:3000
2. Conecte su wallet usando el botón "Conectar Wallet"
3. Puede comprar tokens, hacer staking, crear propuestas y votar

## Troubleshooting

### Problemas Comunes

1. **Error: No se puede conectar a la red local**
   - Asegúrese de que el nodo Hardhat esté ejecutándose
   - Verifique la configuración de red en MetaMask

2. **Error: Nonce demasiado alto**
   - Reinicie su cuenta de MetaMask (Configuración > Avanzado > Restablecer cuenta)

3. **Error: No se ven los contratos desplegados**
   - Verifique las direcciones en `frontend/dao-frontend/src/contracts/contracts.ts`
   - Ejecute `npx hardhat run scripts/verification/diagnose_environment.js --network localhost` para diagnosticar

4. **Error: Gas insuficiente**
   - Asegúrese de tener suficiente ETH en su cuenta
   - Puede enviar ETH usando `npx hardhat run scripts/tools/send_lot_eth.js --network localhost`

## Despliegue en Testnet

Para desplegar en una red de prueba (Sepolia o Mumbai):

```bash
# Crear archivo .env con sus claves
cp .env.example .env
# Edite el archivo .env con sus claves API y clave privada

# Desplegar en Sepolia
npx hardhat run scripts/deployment/deploy_dao.js --network sepolia

# Verificar contratos
npx hardhat verify --network sepolia DIRECCIÓN_TOKEN
npx hardhat verify --network sepolia DIRECCIÓN_DAO DIRECCIÓN_TOKEN
```

## Verificación de Contratos en Testnet

Los contratos ya desplegados pueden verificarse en:

- Sepolia Etherscan: https://sepolia.etherscan.io/address/DIRECCIÓN_CONTRATO
- Mumbai Polygonscan: https://mumbai.polygonscan.com/address/DIRECCIÓN_CONTRATO
