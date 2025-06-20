# Obligatorio Taller DAO (Conjunto A)

Este proyecto implementa una aplicación de DAO (Organización Autónoma Descentralizada) con votación cuadrática y delegación por propuesta, tal como se solicita en el Conjunto A de la consigna.

## Estructura del Proyecto

- `/contracts`: Smart contracts de la DAO, incluyendo el principal (`DAO.sol`) y el token (`MyToken.sol`)
- `/scripts`: Scripts para desplegar los contratos
- `/test`: Tests para los contratos
- `/frontend/dao-frontend`: Aplicación frontend React para interactuar con la DAO

## Características (Conjunto A)

- **Votación Cuadrática**: El poder de voto se calcula como la raíz cuadrada de la cantidad de tokens en stake
- **Delegación por Propuesta**: Los usuarios pueden delegar su voto a otra dirección para propuestas específicas
- **Staking**: Separado para votar y crear propuestas
- **Propuestas**: Creación, votación y ejecución de propuestas
- **Compra de Tokens**: Funcionalidad para comprar tokens con ETH
- **Panic/Tranquilidad**: Implementación de contratos multisig para dueño y pánico

## Páginas Frontend

- **Lista de Propuestas** (`/proposals`): Visualización de todas las propuestas con filtros
- **Detalle de Propuesta** (`/proposals/:id`): Ver detalles, votar y delegar por propuesta
- **Crear Propuesta** (`/proposals/create`): Formulario para crear nuevas propuestas
- **Staking & Tokens** (`/staking`): Gestión de staking para votar/proponer y compra de tokens

## Instalación y Ejecución

### Backend (Contratos)

1. Instalar dependencias:
   ```
   npm install
   ```

2. Compilar contratos:
   ```
   npx hardhat compile
   ```

3. Ejecutar tests:
   ```
   npx hardhat test
   ```

4. Desplegar contratos localmente (requiere nodo Hardhat en ejecución):
   ```
   npx hardhat node
   npx hardhat run scripts/deploy_dao.js --network localhost
   ```

### Frontend

1. Navegar al directorio frontend:
   ```
   cd frontend/dao-frontend
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar direcciones de contratos:
   - Editar `src/contracts/contracts.ts` con las direcciones correctas después del despliegue

4. Iniciar aplicación:
   ```
   npm start
   ```

## Tests

Los tests cubren todas las funcionalidades requeridas:
- Staking
- Delegación
- Votación Cuadrática
- Propuestas
