# Scripts de Despliegue (Deployment)

Este directorio contiene los scripts necesarios para el despliegue de los contratos de la DAO.

## Archivos principales

- `deploy_dao.js` - Script principal para desplegar todos los contratos de la DAO.
- `deploy_dao_with_funds.js` - Despliega los contratos y asigna fondos iniciales.
- `simple_deploy.js` - Versión simplificada del despliegue para pruebas rápidas.

## Uso

Para desplegar los contratos en la red local:

```bash
npx hardhat run scripts/deployment/deploy_dao.js --network localhost
```

Para desplegar en testnet:

```bash
npx hardhat run scripts/deployment/deploy_dao.js --network sepolia
```

Los contratos desplegados incluyen:
- Token ERC20 (MyToken)
- Contrato DAO principal
- Multisigs para owner y panic
