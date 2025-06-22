# Scripts de Tokens

Este directorio contiene los scripts para gestionar y transferir tokens en la DAO.

## Archivos principales

- `mint_tokens_direct.js` - Acuña tokens directamente usando la cuenta de administrador.
- `send_tokens_to_address.js` - Envía tokens a una dirección específica.
- `send_more_tokens.js` - Envía tokens adicionales a direcciones.

## Uso

Para acuñar tokens:

```bash
npx hardhat run scripts/tokens/mint_tokens_direct.js --network localhost
```

Para enviar tokens a una dirección específica:

```bash
npx hardhat run scripts/tokens/send_tokens_to_address.js --network localhost
```

Nota: Los scripts asumen que están siendo ejecutados por una cuenta con permisos para acuñar tokens (owner del token o DAO).
