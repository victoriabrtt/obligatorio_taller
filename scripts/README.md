# Scripts

Esta carpeta contiene scripts organizados para diferentes propósitos en el proyecto de la DAO.

## Estructura de carpetas

- **deployment**: Scripts para desplegar contratos (DAO, Token, Multisig).
  - `quick_deploy.js` - Despliegue rápido para entorno local de desarrollo
  - `deploy_dao.js` - Despliegue básico del DAO
  - `deploy_dao_with_funds.js` - Despliegue del DAO con fondos iniciales
  - `deploy_dao_active.js` - Despliegue del DAO en estado activo

- **governance**: Scripts relacionados con la gobernanza del DAO.
  - `add_more_proposals.js` - Crea propuestas de prueba adicionales
  - `create_proposal_and_vote.js` - Crea una propuesta y vota como un usuario específico
  - `unpause_dao.js` - Desactiva el estado de pausa del DAO
  - `dev_toggle_dao_state.js` - Cambia el estado de pausa del DAO (para desarrollo)

- **tokens**: Scripts para gestión de tokens.
  - `mint_tokens_direct.js` - Acuñación directa de tokens a una dirección
  - `send_tokens_to_address.js` - Envío de tokens a una dirección específica
  - `send_more_tokens.js` - Envío de una cantidad mayor de tokens

- **utils**: Scripts utilitarios.
  - `check_dao.js` - Verifica el estado actual del DAO y sus parámetros
  - `check_user.js` - Verifica el estado de una cuenta de usuario específica
  - `advance_time.js` - Avanza el tiempo en la blockchain local
  - `send_eth_to_account.js` - Envía ETH a una cuenta específica
  - `setup_user_account.js` - Configura una cuenta de usuario con tokens y staking
  - `stake_for_proposals.js` - Realiza staking para propuestas para una cuenta específica

## Uso común

### Despliegue inicial
```bash
npx hardhat node
npx hardhat run scripts/deployment/quick_deploy.js --network localhost
```

### Configurar cuenta de usuario
```bash
USER_ADDRESS=0x... npx hardhat run scripts/utils/setup_user_account.js --network localhost
```

### Enviar ETH a una cuenta
```bash
RECIPIENT=0x... AMOUNT=10 npx hardhat run scripts/utils/send_eth_to_account.js --network localhost
```

### Verificar estado del DAO
```bash
npx hardhat run scripts/utils/check_dao.js --network localhost
```

### Avanzar el tiempo (para pruebas)
```bash
ADVANCE_TIME=3600 npx hardhat run scripts/utils/advance_time.js --network localhost
```
