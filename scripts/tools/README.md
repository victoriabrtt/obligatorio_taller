# Scripts de Herramientas (Tools)

Este directorio contiene scripts utilitarios para interactuar con la blockchain y los contratos.

## Archivos principales

- `advance_blockchain_time.js` - Avanza el tiempo de la blockchain local (para pruebas).
- `send_lot_eth.js` - Envía una gran cantidad de ETH a una dirección específica.
- `send_eth.js` - Envía ETH a una dirección específica.
- `unpause_dao.js` - Despausa la DAO (activa la funcionalidad después de un pánico).

## Uso

Para enviar ETH a una dirección:

```bash
npx hardhat run scripts/tools/send_eth.js --network localhost
```

Para avanzar el tiempo de la blockchain (útil para pruebas de staking):

```bash
npx hardhat run scripts/tools/advance_blockchain_time.js --network localhost
```

Nota: Algunos de estos scripts solo funcionan en redes locales (hardhat o ganache).
