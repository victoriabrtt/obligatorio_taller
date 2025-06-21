# DAO - Sistema de Gobernanza Descentralizada

Este proyecto implementa un sistema de gobernanza basado en DAO (Organización Autónoma Descentralizada) utilizando tokens ERC-20 para representar el poder de voto dentro de la organización.

## Características principales

- **Gobernanza mediante DAO** con tokens ERC-20 que representan poder de voto
- **Multisig para Owner** con capacidad de mintear tokens, cambiar parámetros y transferir propiedad
- **Multisig de Pánico** para seguridad del sistema
- **Sistema de Staking** para votar y crear propuestas
- **Votación cuadrática** donde el poder de voto escala como la raíz cuadrada de los tokens
- **Delegación de voto** para propuestas específicas
- **Frontend completo** para interactuar con la DAO

## Estructura del proyecto

```
obligatorio_taller/
├── contracts/           # Contratos inteligentes
│   ├── DAO.sol          # Contrato principal de la DAO
│   ├── MyToken.sol      # Token ERC-20 para votación
│   ├── Multisig.sol     # Contrato multifirma
│   └── MultisigFactory.sol  # Fábrica de contratos multifirma
├── scripts/             # Scripts para despliegue y gestión
│   ├── deployment/      # Scripts de despliegue
│   ├── tokens/          # Scripts para gestión de tokens
│   ├── tools/           # Herramientas para interacción
│   ├── verification/    # Scripts de verificación
│   └── utils/           # Scripts de utilidad
├── test/                # Tests unitarios
├── frontend/            # Aplicación frontend
│   └── dao-frontend/    # Frontend en React
├── deployments/         # Información de despliegues
└── docs/                # Documentación adicional
```

## Requisitos

- Node.js v18+
- Git
- Hardhat
- MetaMask u otro proveedor Web3
- Una red Ethereum local o testnet

## Guías

Para instrucciones detalladas, consulta estos documentos:

- [Guía de Despliegue](./DEPLOYMENT_GUIDE.md) - Instrucciones para desplegar los contratos
- [Guía de Desarrollo](./README_UPDATED.md) - Información para desarrolladores
- [Solución de Problemas](./TROUBLESHOOTING.md) - Soluciones a problemas comunes

## Conjunto A - Características específicas implementadas

Este proyecto implementa el **Conjunto A** de la consigna, que incluye:

1. **Votación cuadrática**: El poder de voto escala como la raíz cuadrada de los tokens en staking
2. **Delegación de voto**: Permite delegar el voto para una propuesta específica a otra cuenta

## Equipo

Este proyecto fue desarrollado como parte del obligatorio de Taller.

## Licencia

MIT
