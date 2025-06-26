# Scripts de Utilidad

Este directorio contiene scripts de utilidad complementarios.

## Archivos principales

- `update-frontend.js` - Actualiza las direcciones de los contratos en el frontend.
- `verify_fix.js` - Script de solución para problemas comunes.
- `check_balances.js` - Verifica balances de tokens y ETH.
- `check_dao.js` - Verifica el estado y configuración de la DAO.
- `unpause_dao.js` - Despausa la DAO si está pausada.

## Uso

Para actualizar las direcciones de contratos en el frontend después de un despliegue:

```bash
npx hardhat run scripts/utils/update-frontend.js --network localhost
```

Estos scripts son complementarios a los principales y se utilizan en situaciones específicas.
