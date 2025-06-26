# Guía de Ejecución del Sistema DAO

Este documento proporciona instrucciones detalladas para configurar, ejecutar y probar todos los componentes del sistema DAO (contratos inteligentes, backend, frontend, tests) en un entorno Ubuntu 24.04, tal como especifica la consigna del obligatorio.

## Entorno de Ejecución

El sistema ha sido diseñado para funcionar en el siguiente entorno:
- Ubuntu 24.04 (tal como especifica la consigna)
- Node.js v18+ y npm v9+
- Ganache para simular una red Ethereum
- Visual Studio Code para visualizar el proyecto
- Hardhat
- Metamask (extensión del navegador para interactuar con la dApp)

## Instalación de Dependencias Necesarias

### 1. Node.js y npm

En Ubuntu 24.04, siga estos pasos para instalar Node.js y npm:

```bash
# Actualizar repositorios
sudo apt update

# Instalar curl si no está instalado
sudo apt install -y curl

# Añadir repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js (incluye npm)
sudo apt install -y nodejs

# Verificar la instalación
node --version  # Debería mostrar v18.x.x
npm --version   # Debería mostrar v9.x.x o superior
```

### 2. Ganache

Ganache se requiere para simular una red Ethereum localmente. Instálelo con:

```bash
# Instalar Ganache CLI globalmente
npm install -g ganache

# Verificar la instalación
ganache --version
```

### 3. Visual Studio Code

Para instalar Visual Studio Code en Ubuntu 24.04:

```bash
# Añadir repositorio de Microsoft
sudo apt-get install wget gpg
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
rm -f packages.microsoft.gpg

# Instalar VS Code
sudo apt update
sudo apt install code

# Verificar la instalación
code --version
```

### 4. Extensión Metamask

Instale la extensión Metamask en su navegador (Chrome, Firefox, etc.) desde la tienda de extensiones oficial.

### 5. Configuración del Proyecto

```bash
# Clonar el repositorio (si no lo tiene ya)
git clone <url-del-repositorio>
cd obligatorio_taller

# Instalar dependencias del proyecto principal (incluye Hardhat)
npm install

# Instalar dependencias del frontend
cd frontend/dao-frontend
npm install --legacy-peer-deps
cd ../../
```

## Ejecución de la Blockchain Local

La consigna especifica el uso de Ganache para simular una red Ethereum. Hay dos opciones para ejecutar la blockchain local:

### 1. Iniciar Ganache (Recomendado según la consigna)

```bash
# En una terminal, iniciar Ganache CLI con parámetros deterministas
ganache --deterministic --networkId 1337 --chainId 1337 --port 8545
```

Esto inicia Ganache con cuentas deterministas (las mismas cada vez) para facilitar las pruebas. Ganache estará disponible en `http://localhost:8545`.

### 2. Alternativamente: Iniciar Nodo Local de Hardhat

```bash
# En una terminal
npx hardhat node
```

El nodo local de Hardhat también estará disponible en `http://localhost:8545`, pero con un chainId diferente (31337).

### 3. Compilar y Desplegar Contratos

Mantenga la terminal con Ganache o Hardhat Node abierta y ejecute los siguientes comandos en una nueva terminal:

```bash
# Compilar los contratos
npx hardhat compile

# Desplegar los contratos en la red local
npx hardhat run scripts/quick_deploy.js --network localhost
```

Este comando:
- Despliega el contrato del token ERC-20 (MyToken)
- Despliega el contrato principal de la DAO
- Despliega y configura las multisig necesarias (owner y pánico)
- Inicializa los parámetros operativos de la DAO
- Guarda las direcciones de los contratos para uso posterior

Las direcciones de los contratos desplegados se mostrarán en la consola. Tome nota de estas direcciones, ya que serán necesarias para interactuar con el sistema.

### 4. Configuración Adicional de la DAO (Opcional)

Si necesita una configuración más específica para las pruebas:

```bash
# Enviar ETH a una dirección de usuario (para pruebas)
npx hardhat run scripts/send_eth_to_user.js --network localhost

# Comprar tokens para una cuenta de prueba
npx hardhat run scripts/tokens/buy_tokens.js --network localhost

# Realizar staking para poder votar
npx hardhat run scripts/tools/stake_for_voting.js --network localhost
```

## Ejecución de Tests

La consigna requiere un 100% de cobertura en los tests. A continuación, se detalla cómo ejecutar y verificar los tests:

### 1. Tests Unitarios e Integración

```bash
# Ejecutar todos los tests
npx hardhat test

# Ejecutar un conjunto específico de tests
npx hardhat test test/DAO.staking.test.js

# Ejecutar tests específicos con más información
npx hardhat test test/DAO.multiLevelDelegation.test.js --verbose
```

Los tests verifican todas las funcionalidades requeridas:
- Staking para votar y proponer
- Creación y votación de propuestas
- Delegación de votos (simple y multinivel)
- Votación cuadrática
- Funciones de pánico y tranquilidad
- Integración con multisig

### 2. Cobertura de Tests (Test Coverage)

La consigna exige una cobertura del 100% en todos los contratos principales (con excepciones justificadas). Para verificar la cobertura:

```bash
# Ejecutar análisis de cobertura de tests
npx hardhat coverage

# Ver el informe generado (en Ubuntu 24.04)
xdg-open coverage/index.html
```

El informe de cobertura generado:
- Muestra estadísticas de cobertura por archivo, función, línea y rama
- Permite identificar cualquier parte del código no cubierta por los tests
- Confirma el cumplimiento del requerimiento del 100% de cobertura

### 3. Verificación de Casos Borde

Para asegurar que todos los casos borde estén cubiertos:

```bash
# Ejecutar tests específicos para casos borde
npx hardhat test test/DAO.proposals.edgecases.test.js
npx hardhat test test/DAO.quadraticVoting.test.js
```

### 4. Validación de Revert Reasons

Para verificar que los contratos fallan apropiadamente en casos de error:

```bash
# Ejecutar tests que validan mensajes de error
npx hardhat test test/DAO.staking.test.js
```

Todos los tests deben pasar con éxito, lo que confirma que el sistema cumple con todos los requerimientos funcionales y no funcionales especificados en la consigna.

## Ejecución del Frontend

La consigna requiere una dApp funcional que permita interactuar con los contratos. A continuación se detalla cómo ejecutar y usar el frontend:

### 1. Actualizar Direcciones en el Frontend

Después de desplegar los contratos, debe actualizar las direcciones en el frontend:

```bash
# Actualizar las direcciones del contrato en el frontend
npx hardhat run scripts/update_frontend_addresses.js --network localhost

# Verificar que las direcciones están actualizadas correctamente
cat frontend/dao-frontend/src/contracts/contracts.ts
```

Este paso es crucial para que el frontend pueda comunicarse con los contratos desplegados en su blockchain local.

### 2. Iniciar el Servidor Frontend

```bash
# Navegar al directorio del frontend
cd frontend/dao-frontend

# Iniciar servidor de desarrollo
npm start
```

El frontend estará disponible en `http://localhost:3000`. Deberá mantener la terminal abierta mientras use el frontend.

### 3. Instalar Dependencias Adicionales del Frontend (si es necesario)

Si encuentra problemas con las dependencias del frontend, puede instalarlas manualmente:

```bash
# Asegurar que todas las dependencias estén instaladas
npm install --legacy-peer-deps

# Si hay problemas específicos con React o componentes UI
npm update react react-dom framer-motion --legacy-peer-deps
```

## Verificación de la dApp y sus Funcionalidades

La consigna especifica varias funcionalidades que deben estar presentes en la dApp. A continuación se detalla cómo verificar cada una:

### 1. Configuración de Metamask

1. Instale la extensión Metamask en su navegador (si aún no lo ha hecho)
2. Configure la red local en Metamask:
   - Haga clic en el selector de red → "Agregar red" → "Agregar red manualmente"
   - Ingrese los siguientes datos:
     - Nombre de la red: `Ganache Local`
     - Nueva URL de RPC: `http://localhost:8545`
     - ID de cadena: `1337` (si usa Ganache) o `31337` (si usa Hardhat Node)
     - Símbolo de moneda: `ETH`
3. Importe una cuenta de prueba:
   - Copie una clave privada desde la terminal donde ejecuta Ganache/Hardhat
   - En Metamask, haga clic en círculo de cuenta → "Importar cuenta" → pegue la clave privada
   - Para Ganache determinista, puede usar: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 2. Verificación de Funcionalidades Requeridas

Una vez conectado a Metamask, debe verificar todas estas funcionalidades:

1. **Conexión de wallet**:
   - La dApp debe permitir conectarse con Metamask (requerido)
   - También debe soportar al menos una wallet adicional (como especifica la consigna)
   - En la UI: Haga clic en el botón "Conectar Wallet"

2. **Compra de tokens**:
   - Navegue a la sección "Buy Tokens"
   - Ingrese una cantidad de ETH
   - Confirme la transacción en Metamask
   - Verifique que los tokens sean acreditados a su cuenta

3. **Visualización de balance**:
   - El balance de tokens debe mostrarse en la UI
   - Debería actualizarse cuando compre o transfiera tokens

4. **Sistema de staking**:
   - Navegue a la sección "Staking"
   - Realice staking para votar (requiere aprobación de tokens)
   - Realice staking para propuestas (requiere aprobación de tokens)
   - Verifique que se muestre correctamente el stake actual
   - Pruebe retirar tokens de staking (si ha pasado el tiempo mínimo)

5. **Creación de propuestas**:
   - Navegue a "Create Proposal"
   - Complete el título y descripción
   - Envíe la transacción
   - Verifique que la propuesta aparezca en la lista

6. **Votación de propuestas**:
   - Navegue a la lista de propuestas
   - Seleccione una propuesta
   - Vote a favor o en contra
   - Verifique que su voto se registre correctamente

7. **Filtrado de propuestas**:
   - Verifique que puede filtrar propuestas por estado:
     - ACTIVAS
     - RECHAZADAS
     - ACEPTADAS

8. **Detalles de propuestas**:
   - Haga clic en una propuesta para ver sus detalles
   - Verifique que muestre:
     - Información de la propuesta
     - Conteo de votos
     - Lista de votantes y sus decisiones

## Verificación de los Requerimientos del Proyecto

### Verificación de Requerimientos Funcionales

Para asegurar que todos los requerimientos especificados en la consigna están implementados:

1. **Owner multisig**:
   - Las funciones administrativas solo pueden ser ejecutadas por la multisig del owner
   - Verifique en el contrato `DAO.sol` que las funciones críticas tienen el modificador `onlyOwner`

2. **Multisig de pánico**:
   - Pruebe la función pánico desde la cuenta configurada como pánico
   ```bash
   npx hardhat run scripts/test_panic.js --network localhost
   ```
   - Intente realizar operaciones mientras la DAO está pausada (deberían fallar)
   - Verifique que solo la multisig de pánico puede ejecutar la función `tranquility`

3. **Tokens en staking y tiempo de bloqueo**:
   - Verifique que no puede retirar tokens antes del tiempo mínimo
   - Intente votar sin tener el mínimo requerido de tokens en staking

4. **Creación y votación de propuestas**:
   - Verifique que las propuestas tienen el período de votación configurado
   - Asegúrese que después del período, ya no se puede votar
   - Verifique que las decisiones se toman correctamente según la mayoría de votos

5. **Poder de voto cuadrático**:
   - Verifique que el poder de voto se calcula correctamente según la fórmula especificada
   - Pruebe con diferentes cantidades de tokens para confirmar la relación cuadrática

## Solución de Problemas Comunes

### Problemas de Conexión y Red

1. **Error: No se puede conectar a la red local**
   - Verifique que Ganache o Hardhat Node esté ejecutándose
   - Confirme que está usando el chainId correcto (1337 para Ganache, 31337 para Hardhat)

2. **Error: Nonce demasiado alto o transacciones pendientes**
   - En Metamask: Configuración > Avanzado > Restablecer cuenta
   - Reinicie Ganache y redesplegue los contratos si es necesario

### Problemas con los Contratos

1. **Error: Contratos no desplegados correctamente**
   - Verifique las direcciones en la salida del script de despliegue
   - Confirme que las direcciones en el frontend están actualizadas
   - Si es necesario, ejecute nuevamente el despliegue completo

2. **Error: No se pueden ejecutar funciones en los contratos**
   - Verifique que está conectado con la cuenta correcta en Metamask
   - Confirme que tiene suficiente ETH para gas
   - Verifique que la DAO no está en modo pánico

### Problemas del Frontend

1. **Error: Dependencias faltantes o incompatibles**
   - Reinstale usando la bandera `--legacy-peer-deps`:
   ```bash
   cd frontend/dao-frontend
   npm install --legacy-peer-deps
   ```

2. **Error: Frontend no muestra datos actualizados**
   - Asegúrese de que las direcciones de contratos están correctamente configuradas
   - Intente recargar la página (F5) o borrar la caché del navegador
   - Confirme que Metamask está conectado a la red correcta

## Verificación Final del Sistema

Antes de dar por finalizada la evaluación, verifique estos aspectos críticos:

1. **Test coverage completo (100%)**
   ```bash
   npx hardhat coverage
   xdg-open coverage/index.html  # Para ver el informe en Ubuntu
   ```

2. **Todas las funcionalidades de la dApp operativas**
   - Conexión de wallet (Metamask + otra adicional)
   - Compra de tokens
   - Sistema de staking completo
   - Creación y votación de propuestas
   - Filtrado de propuestas por estado
   - Visualización de detalles y votos

3. **Seguridad de los contratos**
   - Modificadores de acceso implementados correctamente
   - Validaciones para evitar ataques comunes
   - Multisig para operaciones críticas funcionando correctamente

## Casos de Prueba para la Presentación/Defensa

Para la presentación o defensa del proyecto, estos son algunos casos de prueba completos que puede demostrar:

### 1. Flujo Completo de Usuario

1. Conectar wallet (Metamask)
2. Comprar tokens con ETH
3. Hacer staking para votar
4. Hacer staking para proponer
5. Crear una propuesta
6. Votar en propuestas existentes
7. Esperar que expire el período de votación
8. Ejecutar una propuesta aprobada

### 2. Demostración de Seguridad

1. Intentar ejecutar funciones de owner desde una cuenta no autorizada (debe fallar)
2. Activar el modo pánico desde la multisig de pánico
3. Intentar crear propuestas o votar durante el modo pánico (debe fallar)
4. Desactivar el modo pánico y verificar que el sistema vuelve a la normalidad

### 3. Verificación de Votación Cuadrática

1. Realizar staking con diferentes cantidades de tokens en diferentes cuentas
2. Votar desde estas cuentas
3. Demostrar cómo el poder de voto sigue una relación cuadrática con los tokens

## Conclusión

Este documento proporciona una guía completa para configurar, ejecutar y probar el sistema DAO según los requerimientos especificados en la consigna. Se han incluido instrucciones detalladas para:

1. Configurar el entorno Ubuntu 24.04
2. Instalar todas las dependencias necesarias
3. Ejecutar la red Ethereum local con Ganache
4. Desplegar y configurar los contratos inteligentes
5. Ejecutar y verificar los tests con 100% de cobertura
6. Iniciar y configurar el frontend
7. Verificar cada una de las funcionalidades requeridas

Siguiendo esta guía, el evaluador podrá comprobar que el sistema cumple con todos los requisitos funcionales y no funcionales especificados en el obligatorio.
