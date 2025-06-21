# DAO Frontend

Este proyecto es el frontend para la Decentralized Autonomous Organization (DAO) desarrollada para el Obligatorio 2025 de Taller de Blockchain.

## Descripción General

La DAO implementa un sistema de gobernanza descentralizada con las siguientes características clave:

- **Conjunto A**: 
  - Votación cuadrática: el poder de voto es proporcional a la raíz cuadrada de los tokens en stake
  - Delegación de votos: tanto general como específica por propuesta

- **Características principales**:
  - Staking de tokens para votar y crear propuestas
  - Creación de diferentes tipos de propuestas
  - Votación y ejecución de propuestas aprobadas
  - Compra de tokens con ETH
  - Administración de parámetros del sistema DAO

## Arquitectura

El frontend se estructura de la siguiente manera:

- **Páginas**:
  - `StakingPage.tsx`: Gestión de staking y compra de tokens
  - `ProposalsList.tsx`: Visualización y filtrado de propuestas
  - `ProposalDetail.tsx`: Detalle de propuesta y votación
  - `CreateProposal.tsx`: Creación de propuestas

- **Contextos**:
  - `DAOContext`: Provee acceso a los servicios de la DAO y estado global

- **Servicios**:
  - Conexión con los contratos inteligentes
  - Gestión de transacciones

## Funciones del Conjunto A

### Votación Cuadrática

La implementación de votación cuadrática permite un sistema más democrático donde:
- El poder de voto es la raíz cuadrada de los tokens en stake
- Esto reduce la influencia desproporcionada de los grandes poseedores de tokens
- La fórmula usada es: `sqrt(tokens_staked) * 1e9 / votePowerDivider`

### Delegación de Votos

Implementa dos tipos de delegación:
- **Delegación general**: Un usuario puede delegar todos sus votos a otro usuario
- **Delegación por propuesta**: Un usuario puede delegar su voto para una propuesta específica

## Requisitos

- Node.js v16 o superior
- Metamask u otra wallet compatible con Ethereum
- Conexión a una red compatible (Hardhat local, testnet Sepolia, etc.)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (crear archivo `.env`):
```
REACT_APP_DAO_ADDRESS=0x...
REACT_APP_TOKEN_ADDRESS=0x...
REACT_APP_CHAIN_ID=31337  # Para red local
```

## Scripts Disponibles

### `npm start`

Ejecuta la aplicación en modo desarrollo en [http://localhost:3000](http://localhost:3000)

### `npm run build`

Compila la aplicación para producción en la carpeta `build`

## Despliegue

El frontend puede desplegarse en cualquier servicio de hosting estático como:
- Netlify
- Vercel
- GitHub Pages
- IPFS (para una solución completamente descentralizada)

## Flujo de Trabajo

1. **Conectar wallet**: La aplicación detectará automáticamente Metamask o wallets compatibles
2. **Comprar tokens**: Adquirir los tokens de gobernanza con ETH
3. **Hacer staking**: Hacer staking para activar funciones de votación o creación de propuestas
4. **Participar**: Crear propuestas, votar, o delegar votos
5. **Ejecutar propuestas**: Las propuestas aprobadas pueden ejecutarse al finalizar el período de votación

## Contratos Relacionados

- **DAO.sol**: Contrato principal con la lógica de gobernanza
- **MyToken.sol**: Implementación del token ERC20 utilizado por la DAO
- **Multisig.sol**: Contratos para la administración multifirma
- **MultisigFactory.sol**: Fábrica para crear nuevos contratos multifirma
