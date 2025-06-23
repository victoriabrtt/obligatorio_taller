# Guía de Scripts

Este documento detalla los scripts disponibles en el proyecto y cómo utilizarlos eficientemente.

## Estructura Organizada

Los scripts del proyecto se han reorganizado en las siguientes carpetas para mayor claridad y mantenibilidad:

### 1. Scripts de Despliegue (`/scripts/deployment/`)

Scripts dedicados al despliegue de contratos:

- `quick_deploy.js` - Despliegue rápido para entorno local de desarrollo
- `deploy_dao.js` - Despliegue básico del DAO
- `deploy_dao_with_funds.js` - Despliegue del DAO con fondos iniciales
- `deploy_dao_active.js` - Despliegue del DAO en estado activo

### 2. Scripts de Gobernanza (`/scripts/governance/`)

Scripts relacionados con la gestión y gobierno del DAO:

- `add_more_proposals.js` - Crea propuestas de prueba adicionales
- `create_proposal_and_vote.js` - Crea una propuesta y vota como un usuario específico
- `unpause_dao.js` - Desactiva el estado de pausa del DAO
- `dev_toggle_dao_state.js` - Cambia el estado de pausa del DAO (para desarrollo)

### 3. Scripts de Tokens (`/scripts/tokens/`)

Scripts para la gestión de tokens ERC-20:

- `mint_tokens_direct.js` - Acuñación directa de tokens a una dirección
- `send_tokens_to_address.js` - Envío de tokens a una dirección específica
- `send_more_tokens.js` - Envío de una cantidad mayor de tokens

### 4. Scripts Utilitarios (`/scripts/utils/`)

Scripts de utilidad general:

- `check_dao.js` - Verifica el estado actual del DAO y sus parámetros
- `check_user.js` - Verifica el estado de una cuenta de usuario específica
- `advance_time.js` - Avanza el tiempo en la blockchain local
- `send_eth_to_account.js` - Envía ETH a una cuenta específica
- `setup_user_account.js` - Configura una cuenta de usuario con tokens y staking
- `stake_for_proposals.js` - Realiza staking para propuestas para una cuenta específica

## Script Auxiliar `run-script.sh`

Se ha creado un script bash auxiliar para facilitar la ejecución de los scripts de manera más intuitiva:

```bash
./run-script.sh <categoría> <script> [opciones]
```

### Categorías disponibles:

- `deploy` - Scripts de despliegue
- `gov` - Scripts de gobernanza
- `utils` - Scripts de utilidades 
- `tokens` - Scripts de gestión de tokens

### Ejemplos de uso:

```bash
# Despliegue rápido del DAO
./run-script.sh deploy quick_deploy

# Enviar ETH a una cuenta específica
./run-script.sh utils send_eth_to_account --recipient=0x123... --amount=10

# Verificar estado del DAO
./run-script.sh utils check_dao

# Despausar el DAO
./run-script.sh gov unpause_dao

# Enviar tokens a una dirección
./run-script.sh tokens send_tokens_to_address --recipient=0x123... --amount=1000
```

### Opciones comunes:

- `--dao=<address>` - Dirección del contrato DAO
- `--recipient=<address>` - Dirección del destinatario para enviar ETH/tokens
- `--user=<address>` - Dirección del usuario para operaciones
- `--amount=<value>` - Cantidad de ETH/tokens para enviar
- `--time=<seconds>` - Segundos para avanzar en el tiempo

## Flujos de Trabajo Comunes

### Configuración de Entorno Local

```bash
# Iniciar el nodo local de Hardhat
npx hardhat node

# Desplegar el DAO con fondos iniciales
./run-script.sh deploy quick_deploy

# Verificar el despliegue
./run-script.sh utils check_dao
```

### Configuración de Usuario para Pruebas

```bash
# Enviar ETH a la cuenta del usuario
./run-script.sh utils send_eth_to_account --recipient=0x... --amount=10

# Configurar cuenta con tokens y staking
./run-script.sh utils setup_user_account --user=0x...

# Verificar estado de la cuenta
./run-script.sh utils check_user --user=0x...
```

### Pruebas de Gobernanza

```bash
# Crear propuestas
./run-script.sh gov add_more_proposals

# Avanzar el tiempo para finalizar el periodo de votación
./run-script.sh utils advance_time --time=86400

# Verificar estado de las propuestas
./run-script.sh utils check_dao
```
