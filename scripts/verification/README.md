# Scripts de Verificación

Este directorio contiene scripts para verificar el estado de los contratos y cuentas.

## Archivos principales

- `check_balances.js` - Verifica los balances de ETH de las cuentas.
- `check_dao.js` - Verifica el estado y configuración de la DAO.
- `verify_account.js` - Verifica una cuenta específica (balance, tokens, etc.).
- `diagnose_environment.js` - Diagnóstico completo del entorno (contratos, red, balances).

## Uso

Para verificar el estado de la DAO:

```bash
npx hardhat run scripts/verification/check_dao.js --network localhost
```

Para comprobar balances:

```bash
npx hardhat run scripts/verification/check_balances.js --network localhost
```

Para un diagnóstico completo:

```bash
npx hardhat run scripts/verification/diagnose_environment.js --network localhost
```

Estos scripts son útiles para depuración y para asegurar que todo está configurado correctamente.
