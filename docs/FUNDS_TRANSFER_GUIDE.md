# Guía para Verificar y Utilizar los Fondos Recibidos

## Fondos Enviados

Hemos enviado a tu dirección `0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2`:

- **100 ETH**: Para pagar gas y realizar transacciones
- **150 MTK (MyToken)**: Tokens del proyecto para interactuar con la DAO

## Cómo Verificar los Fondos

### Opción 1: Usando MetaMask

1. Abre tu extensión de MetaMask
2. Asegúrate de estar conectado a la red correcta (Localhost 8545)
3. Tu balance de ETH debería mostrar aproximadamente 101 ETH
4. Para ver los tokens MTK:
   - Haz clic en "Importar token"
   - Selecciona "Token personalizado"
   - Ingresa la dirección del token: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
   - El símbolo se rellenará automáticamente como "MTK"
   - Decimales: 18
   - Haz clic en "Importar"

### Opción 2: Usando Etherscan Local

Si tienes acceso al Hardhat local UI (normalmente en http://localhost:8545/):
1. Busca tu dirección: `0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2`
2. Deberías ver tanto tu balance de ETH como las transacciones recientes

## Historial de Transacciones

Las últimas transacciones realizadas a tu dirección fueron:

1. Envío de 100 ETH: 
   - Hash: 0x4e7c7c9ee1ad9a956c51c5783e70e77b85a23539653fb8e3330666bb20501886

2. Envío de tokens MTK:
   - Primera transacción (100 MTK): 0x1fa0723776a8ef687188d13f5fc126ec446f024fe748ee6c3b0ecf49cecd4525
   - Segunda transacción (50 MTK): 0x2fc48de4fceb4345ee92c420a022557a6c959fc4c33b86b28f539619563d33c4

## Si No Puedes Ver los Fondos

Si no puedes ver los ETH o los tokens en tu wallet:

1. **Reinicia MetaMask** (hay varias opciones según la versión):
   
   **Opción A - Usando el menú Configuración**:
   - Haz clic en el ícono de la cuenta circular arriba a la derecha
   - Selecciona "Configuración" en el menú desplegable
   - Ve a "Avanzado"
   - Busca "Restablecer cuenta" o "Reset account" y haz clic 
   - Esto refrescará el estado de tu wallet sin perder fondos
   
   **Opción B - Si no aparece la opción "Restablecer cuenta"**:
   - Haz clic en el ícono de MetaMask
   - Haz clic en los tres puntos verticales (⋮) en la esquina superior derecha
   - Selecciona "Configuración"
   - Ve a "Avanzado"
   - Busca "Borrar datos de actividad y nonces" o "Clear activity and nonce data"
   
   **Opción C - Método manual**:
   - Cierra completamente el navegador
   - Vuelve a abrir el navegador
   - Desbloquea MetaMask con tu contraseña
   - Haz clic en la red (donde dice "Localhost 8545")
   - Selecciona otra red (como "Ethereum Mainnet") y luego vuelve a seleccionar "Localhost 8545"
   - Esto fuerza a MetaMask a refrescar su estado con la red

2. **Verifica la red**:
   - Asegúrate de que estás conectado a la red Hardhat local (normalmente Localhost:8545)
   - Configuración de red:
     - Nombre de red: Hardhat
     - Nueva URL de RPC: http://localhost:8545
     - ID de cadena: 31337
     - Símbolo de moneda: ETH

3. **Importa los tokens manualmente** con la dirección de contrato mencionada anteriormente

### Métodos Específicos Cuando No Encuentras el Botón "Restablecer Cuenta"

Si no puedes encontrar el botón de "Restablecer cuenta" en MetaMask (esto puede variar según la versión), aquí tienes métodos alternativos:

#### 1. Reiniciar Estado con el Menú de Red

Este es el método más sencillo y efectivo en la mayoría de los casos:

1. Haz clic en el nombre de la red actual (donde dice "Localhost 8545")
2. Selecciona una red diferente (como "Ethereum Mainnet")
3. Espera unos segundos
4. Vuelve a seleccionar "Localhost 8545"
5. Esto fuerza a MetaMask a refrescar todos los datos de esa red

#### 2. Usar Método de Sincronización de Cuentas

Este método alternativo está disponible en muchas versiones de MetaMask:

1. Haz clic en el ícono de usuario o identidad (arriba a la derecha)
2. Busca una opción llamada "Sincronizar con móvil" o "Sync accounts"
3. Cierra ese diálogo sin completar la sincronización
4. Esto fuerza un refresco del estado de la cuenta

#### 3. Configuración Avanzada Alternativa

Si no encuentras "Restablecer cuenta", busca estas opciones alternativas en el menú de Configuración > Avanzado:

- "Borrar datos de caché" / "Clear cache data"
- "Reiniciar cuenta" (con diferente traducción) / "Reset account" 
- "Borrar datos de actividad" / "Clear activity data"
- "Sincronizar con blockchain" / "Sync with blockchain"

#### 4. Forzar Actualización de Estado Mediante Transacción

Si los métodos anteriores no funcionan:

1. Intenta hacer una transacción muy pequeña (0.0001 ETH) a cualquier otra dirección
2. Esto forzará a MetaMask a actualizar su estado con la blockchain
3. Después de esto, tu balance debería mostrarse correctamente

#### 5. Desconectar y Reconectar la Aplicación

Si estás utilizando la aplicación DAO:

1. En MetaMask, ve a la pestaña "Conectados" o "Connected"
2. Busca la conexión a localhost:3000 o la aplicación DAO
3. Desconecta la aplicación
4. Recarga la página de la aplicación
5. Vuelve a conectar MetaMask cuando se te solicite

## Métodos Alternativos y Solución de Problemas Avanzada

Si después de intentar los métodos anteriores aún no puedes ver tus fondos, aquí hay algunas soluciones más avanzadas:

### Importar la Cuenta a un Navegador Diferente

A veces, la instalación de MetaMask en un navegador específico puede tener problemas. Puedes intentar:

1. Instalar MetaMask en otro navegador (si usas Chrome, prueba Firefox o viceversa)
2. Importar tu cuenta usando la frase de recuperación o clave privada
3. Configurar la red Localhost 8545 como se indicó anteriormente

### Usar la Opción "Actividad" para Forzar Refresco

1. Abre MetaMask
2. Haz clic en la pestaña "Actividad"
3. Desliza hacia abajo para forzar un refresco de las transacciones
4. Vuelve a la pestaña "Activos"

### Borrar Caché de Sitio Local

Si estás usando la aplicación en localhost:3000, puedes intentar:

1. Abrir la configuración del navegador
2. Ir a "Privacidad y seguridad" > "Borrar datos de navegación"
3. Seleccionar solo "Imágenes y archivos almacenados en caché"
4. Borrar los datos
5. Volver a cargar la aplicación

### Reinstalar MetaMask (último recurso)

**¡IMPORTANTE! Asegúrate de tener tu frase de recuperación guardada antes de hacer esto.**

1. Desinstala la extensión de MetaMask
2. Vuelve a instalar desde la tienda oficial de extensiones
3. Restaura tu wallet usando la frase de recuperación
4. Configura la red local nuevamente

### Verificación de Fondos Mediante Consola del Navegador

Si los métodos anteriores no funcionan y necesitas verificar si los fondos realmente están en tu dirección, puedes usar este método alternativo:

1. Abre tu navegador y asegúrate de estar conectado a la aplicación DAO
2. Abre la consola del navegador:
   - En Chrome/Edge: Presiona F12 o haz clic derecho > Inspeccionar > Consola
   - En Firefox: Presiona F12 o haz clic derecho > Inspeccionar > Consola
   - En Safari: Habilita las herramientas de desarrollo en Preferencias > Avanzado y luego haz clic derecho > Inspeccionar Elemento > Consola
3. Copia y pega el siguiente código desde el archivo `scripts/browser_check_funds.js`:

```javascript
// Script para verificar fondos directamente desde la consola del navegador
(async function checkFundsInBrowser() {
  // Dirección a verificar
  const addressToCheck = "0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2";
  
  // URL del proveedor Hardhat
  const providerUrl = "http://localhost:8545";
  
  try {
    console.log("🔍 Verificando fondos para " + addressToCheck + "...");
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    // Verificar balance de ETH
    const ethBalance = await provider.getBalance(addressToCheck);
    const formattedEthBalance = ethers.utils.formatEther(ethBalance);
    console.log("💰 Balance de ETH: " + formattedEthBalance + " ETH");
    
    // Dirección del contrato del token
    const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    // ABI mínimo para consultar el balance
    const minABI = [
      {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
      }
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, minABI, provider);
    const tokenBalance = await tokenContract.balanceOf(addressToCheck);
    const formattedTokenBalance = ethers.utils.formatEther(tokenBalance);
    console.log("🪙 Balance de Token: " + formattedTokenBalance + " MTK");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
```

4. Presiona Enter para ejecutar el código
5. Los resultados mostrarán si tus ETH y tokens MTK están realmente disponibles en tu dirección

Este método verifica directamente con la blockchain local, sin depender de MetaMask, lo que te permitirá saber si el problema está en la transferencia o solo en la visualización de MetaMask.

### Verificación Técnica del Entorno

Si necesitas verificar detalladamente el estado de la blockchain, los contratos y los balances:

1. Abre una terminal en la carpeta del proyecto
2. Ejecuta el script de diagnóstico:
   ```bash
   npx hardhat run scripts/diagnose_environment.js --network localhost
   ```
3. Este script verificará:
   - La conexión a la red local
   - Las cuentas disponibles
   - La información de despliegue
   - Los contratos desplegados
   - El balance de ETH y tokens en tu dirección

Esto es especialmente útil si estás teniendo problemas para ver los fondos en MetaMask pero necesitas confirmar que realmente existen en la blockchain.

## Cómo Usar Estos Fondos

Ahora puedes:
1. Interactuar con la aplicación DAO en http://localhost:3000
2. Votar en propuestas
3. Crear nuevas propuestas
4. Hacer staking de tokens

Si sigues teniendo problemas para ver o usar los fondos, por favor contáctame y te ayudaré a resolver el problema.

## Resumen de Soluciones - Guía Paso a Paso

Si sigues teniendo problemas para ver tus fondos en MetaMask, sigue estos pasos en orden:

### Paso 1: Verificación Básica
1. Confirma que la red local Hardhat está ejecutándose (puerto 8545)
2. Verifica que estés usando la dirección correcta en MetaMask: `0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2`
3. Comprueba que estás conectado a la red correcta (Localhost 8545, chainID 31337)

### Paso 2: Reinicio de MetaMask (Prueba todos los métodos)
1. Cambia temporalmente a otra red y vuelve a Localhost 8545
2. Busca y utiliza cualquiera de estas opciones en la configuración de MetaMask:
   - "Restablecer cuenta" / "Reset account"
   - "Borrar datos de actividad" / "Clear activity data"
   - "Sincronizar con móvil" / "Sync with mobile"
   - "Reiniciar wallet" / "Reset wallet"
3. Cierra completamente el navegador y vuelve a abrirlo

### Paso 3: Verificación de red y contratos
1. Elimina y vuelve a agregar la red Localhost 8545 en MetaMask con estos parámetros:
   - Nombre de red: Hardhat
   - Nueva URL de RPC: http://localhost:8545
   - ID de cadena: 31337
   - Símbolo de moneda: ETH
2. Verifica que la blockchain local esté funcionando con el script de diagnóstico
3. Vuelve a importar el token MTK usando la dirección `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### Paso 4: Métodos alternativos
1. Usa la consola del navegador para verificar fondos directamente (Sección "Verificación de Fondos Mediante Consola")
2. Prueba desde otro navegador instalando MetaMask e importando tu cuenta
3. Reinicia el nodo local de Hardhat (detener y volver a iniciar)
4. Si nada funciona, considera solicitar una nueva transferencia de fondos

### Recuerda
- Los fondos existen en la blockchain, no en MetaMask. MetaMask solo es una ventana para ver estos fondos.
- Si el script de diagnóstico o la consola del navegador muestran que tienes fondos, pero no aparecen en MetaMask, es un problema de visualización, no de fondos reales.
