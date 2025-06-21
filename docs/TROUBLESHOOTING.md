# Guía de Solución de Problemas de la DAO

Este documento proporciona soluciones a los problemas comunes que pueden surgir durante la ejecución y uso del proyecto DAO. Sirve como referencia tanto para el desarrollo como para la defensa oral del proyecto.

## Problema Principal: Funcionalidad "Comprar Tokens"

El problema principal que enfrentamos fue que la funcionalidad de "Comprar Tokens" en el frontend no funcionaba correctamente, arrojando errores como "Internal JSON-RPC error" o "missing revert data".

### Análisis del Problema

Después de un análisis exhaustivo, identificamos varias causas potenciales:

1. **Interacción Web3/Metamask**: Problemas en la comunicación entre la aplicación React y MetaMask.
2. **Estado del DAO**: El contrato DAO podría estar pausado, impidiendo la compra de tokens.
3. **Permisos de contrato**: Problemas de permisos o propietario del contrato.
4. **Parámetros incorrectos**: Valores incorrectos en la transacción (gas, precio, etc.).
5. **Errores de Circuit Breaker**: MetaMask podría estar bloqueando transacciones.

### Estrategia de Solución

Se implementó una solución para mejorar la interacción entre el frontend y los contratos:

1. **Método estándar mejorado**:
   - Simplificación del cálculo del precio del token
   - Aumento del límite de gas
   - Mejora del manejo de errores

2. **Método de transacción directa**:
   - Optimización de parámetros de transacción
   - Eliminación de datos complejos en la transacción

3. **Método de envío directo de ETH**:
   - Transacción mínima solo con ETH hacia el contrato
   - Confiando en el fallback del contrato

## Implementación de la Solución

### 1. Mejoras en el Frontend

- **Optimización de Transacciones**: Se implementaron mejoras en `dao.service.ts`:
  - `buyTokens`: Método estándar simplificado
  - Manejo mejorado de errores y confirmaciones

- **Interfaz Mejorada**: 
  - Feedback claro al usuario durante el proceso de compra
  - Indicadores de estado de transacción

### 2. Scripts de Utilidad

- **Scripts de Hardhat**: 
  - `check_balances.js`: Verificación de balances de tokens y ETH
  - `unpause_dao.js`: Asegura que el DAO no esté pausado

### 3. Mejoras en el Manejo de Errores

- Registro detallado de errores en la consola
- Mensajes de error descriptivos para el usuario
- Sistema de cascada que prueba automáticamente diferentes métodos

## Problemas Específicos y Soluciones

### Error "Invalid Block Tag"

**Problema:** 
```
Error al comprar tokens: Fallaron todos los métodos (incluso emergencia): Error en modo de emergencia: could not coalesce error (error={ "code": -32603, "data": { "cause": null, "code": -32000, "data": { "data": null, "message": "Received invalid block tag 44. Latest block number is 38" }, "message": "Received invalid block tag 44. Latest block number is 38" }, "message": "Internal JSON-RPC error." })
```

**Causa:** 
Este error ocurre cuando hay una discrepancia entre el estado que MetaMask tiene en caché y el estado real del nodo Hardhat. Específicamente, cuando intentamos obtener el `nonce` (número de transacción) para una dirección, MetaMask está buscando un bloque que aún no existe en el nodo local.

**Solución:**
1. Eliminamos la especificación manual del `nonce` en las transacciones
2. Simplificamos las transacciones para que MetaMask maneje automáticamente parámetros como `nonce` y `gasLimit`
3. Agregamos un botón específico para resetear el estado de MetaMask en la UI
4. Documentamos el proceso de reinicio completo del entorno en caso de persistir el error

**Cómo Resolver si Vuelve a Ocurrir:**

1. **Reinicia completamente el entorno**:
   ```bash
   # Terminal 1: Detener y reiniciar Hardhat
   npx hardhat node

   # Terminal 2: Redeployar contratos
   npx hardhat run scripts/deployment/deploy_dao_with_funds.js --network localhost
   ```

2. **Reiniciar MetaMask**:
   - Abre MetaMask
   - Ve a Configuración > Avanzado
   - Haz clic en "Restablecer cuenta" (esto limpia el caché de transacciones sin afectar tus fondos)

3. **Actualizar los contratos en el frontend**:
   - Asegúrate de que las direcciones de contrato en `contracts.ts` coincidan con las nuevas direcciones desplegadas

4. **Reiniciar la aplicación**:
   - Si todo lo demás falla, reinicia completamente la aplicación y el nodo local

La clave de la solución fue entender que en un entorno de desarrollo con nodos que se reinician frecuentemente, es mejor dejar que MetaMask maneje los parámetros de transacción automáticamente en lugar de especificarlos manualmente.

## Guía Rápida para Resolución de Problemas

Si encuentras problemas mientras utilizas la aplicación, aquí hay una guía rápida de verificación y solución:

### Pasos Básicos de Verificación

1. **Verificar que la red local de Hardhat está funcionando**:
   ```bash
   npx hardhat node
   ```

2. **Verificar que los contratos están desplegados correctamente**:
   ```bash
   npx hardhat run scripts/deployment/deploy_dao_with_funds.js --network localhost
   ```
   Anota las direcciones de los contratos desplegados.

3. **Verificar que las direcciones de contrato están actualizadas**:
   Comprueba que el archivo `frontend/dao-frontend/src/contracts/contracts.ts` tiene las direcciones correctas.

4. **Verificar el estado del DAO**:
   ```bash
   npx hardhat run scripts/utils/check_dao.js --network localhost
   ```

### Soluciones a Problemas Comunes

#### El DAO está pausado
```bash
npx hardhat run scripts/utils/unpause_dao.js --network localhost
```

#### Problemas de Propiedad (Ownership)
```bash
npx hardhat console --network localhost
> const token = await ethers.getContractAt("MyToken", "0x[DIRECCIÓN_DEL_TOKEN]")
> await token.owner()
```

#### Verificar balances de tokens
```bash
npx hardhat run scripts/utils/check_balances.js --network localhost
```

#### Realizar una compra directa de tokens (para pruebas)
```bash
npx hardhat run scripts/tokens/buy_tokens_direct.js --network localhost
```

#### Acuñar tokens directamente (bypass del DAO)
```bash
npx hardhat run scripts/tokens/mint_tokens_direct.js --network localhost -- 50 0x[DIRECCIÓN_DESTINO]
```

#### Balances o Nonces inconsistentes
```bash
# Reiniciar el nodo Hardhat completamente
npx hardhat node --reset
```

## Lecciones Aprendidas

1. **Debugging en aplicaciones blockchain**:
   - La identificación de errores en aplicaciones Web3 es compleja debido a la naturaleza distribuida y las múltiples capas involucradas
   - Las herramientas de desarrollo de Ethereum (Hardhat, MetaMask) proporcionan información limitada sobre errores

2. **Gestión de permisos**:
   - Es crucial entender el modelo de permisos (Ownable, roles) en contratos inteligentes
   - La transferencia de propiedad entre contratos debe diseñarse cuidadosamente

3. **Implementación de métodos de recuperación**:
   - Siempre proporcionar rutas alternativas para funcionalidades críticas
   - Incluir mecanismos de bypass y rescate en caso de emergencia

4. **Experiencia del usuario**:
   - Proporcionar retroalimentación clara sobre los estados de las transacciones
   - Ofrecer métodos alternativos en caso de falla

## Recomendaciones para la Defensa Oral

1. Explica la arquitectura general del proyecto (contratos y frontend)
2. Describe el flujo de compra de tokens y staking
3. Muestra cómo funcionan la votación cuadrática y delegación (Conjunto A)
4. Demuestra el funcionamiento del sistema completo
5. Discute posibles mejoras y consideraciones para un entorno de producción

## Pasos para Probar la Solución

1. Iniciar el nodo Hardhat: `npx hardhat node`
2. Desplegar los contratos: `npx hardhat run scripts/deployment/deploy_dao.js --network localhost`
3. Iniciar el frontend: `cd frontend/dao-frontend && npm start`
4. Probar la compra de tokens con MetaMask
5. Demostrar la votación cuadrática y delegación (Conjunto A)

## Consideraciones de Seguridad

Al desarrollar aplicaciones blockchain, se deben tener en cuenta estas consideraciones:

1. Asegurar que los contratos estén correctamente testeados
2. Implementar un sistema de multisig para operaciones críticas
3. Usar mecanismos de pausa para detener la actividad en caso de problemas
4. Diseñar una arquitectura que permita actualizaciones seguras
