# MiToken dApp

Este proyecto es una dApp simple que permite interactuar con un token ERC20 llamado MiToken. La dApp permite conectarse a una wallet (como MetaMask), consultar el balance de cualquier dirección y realizar transferencias de tokens.

## Características

- Conectar a una wallet en el navegador (MetaMask)
- Consultar el balance de cualquier dirección (función `balanceOf`)
- Transferir tokens a cualquier dirección (función `transfer`)
- El contrato asigna todo el suministro inicial al creador (deployer)

## Requisitos previos

- Node.js (v12 o superior)
- npm (v6 o superior)
- MetaMask instalado en el navegador

## Instalación

1. Clona este repositorio o descomprime el archivo del proyecto.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:

```bash
npm install
```

## Compilación del contrato

Para compilar el contrato MiToken:

```bash
npm run compile
```

Esto generará los artefactos del contrato en la carpeta `web/artifacts/`.

## Despliegue del contrato

### Opción 1: Despliegue en red local

1. Inicia una red local de Hardhat en una terminal:

```bash
npm run node
```

2. En otra terminal, despliega el contrato en la red local:

```bash
npm run deploy
```

### Opción 2: Despliegue en una red de prueba (Sepolia)

1. Configura tu archivo `.env` con tu clave privada y la URL del proveedor (no incluido en este repo por seguridad).
2. Ejecuta:

```bash
npm run deploy-live
```

## Ejecución de la dApp

Una vez que el contrato esté desplegado, puedes ejecutar la dApp de las siguientes maneras:

### Opción 1: Servidor web con scripts npm (recomendado)

Hemos añadido varios scripts para facilitar el acceso a la dApp:

```bash
# Usando Express (recomendado)
npm run serve:express

# Usando Python
npm run serve:python

# Usando el servidor simple serve
npm run serve
```

### Opción 2: Servidor web con comandos directos

Si prefieres ejecutar los comandos directamente:

```bash
# Usando Express
node server.js

# Usando Python 3
python3 -m http.server 3000 --bind 127.0.0.1 --directory ./web

# Usando http-server
npx http-server ./web
```

### Opción 3: Live Server en VSCode

Si estás utilizando Visual Studio Code:

1. Instala la extensión "Live Server" desde el Marketplace de VSCode
2. Abre el archivo `web/index.html` en VSCode
3. Haz clic derecho en el archivo y selecciona "Open with Live Server"

### Opción 4: Abrir el archivo directamente

También puedes abrir el archivo `web/index.html` directamente en tu navegador, pero algunas funciones pueden no trabajar correctamente debido a restricciones de seguridad por las políticas CORS.

## Uso de la dApp

1. Abre la dApp en tu navegador.
2. Haz clic en "Conectar Wallet" para conectar MetaMask.
3. Asegúrate de que MetaMask esté conectado a la misma red donde desplegaste el contrato.
4. Para consultar un balance:
   - Ingresa una dirección en el campo correspondiente.
   - Haz clic en "Consultar".
5. Para transferir tokens:
   - Ingresa la dirección destino.
   - Ingresa la cantidad de tokens a transferir.
   - Haz clic en "Transferir".
   - Confirma la transacción en MetaMask.

## Estructura del proyecto

```
Trabajo2/
├── contracts/              # Contratos de Solidity
│   └── MiToken.sol         # Contrato ERC20
├── scripts/                # Scripts de despliegue
│   └── deploy.js           # Script para desplegar el contrato
├── web/                    # Frontend de la dApp
│   ├── index.html          # Página principal de la dApp
│   ├── app.js              # Lógica de la aplicación
│   └── contract-address.json # Dirección del contrato desplegado
├── hardhat.config.js       # Configuración de Hardhat
└── package.json            # Dependencias y scripts
```

## Nota sobre el contrato MiToken

El contrato MiToken es un token ERC20 básico que:
- Tiene el símbolo "MTK"
- Tiene 18 decimales
- Tiene un suministro inicial de 1,000,000 tokens
- Asigna todo el suministro inicial al deployer del contrato

## Solución de problemas

### Problemas con el servidor web

Si encuentras errores 404 o no puedes acceder a la dApp, prueba estas soluciones:

1. **Usa el servidor Express incluido** (más confiable):
   ```bash
   node server.js
   ```

2. **Verifica que estés en la carpeta correcta**:
   Asegúrate de estar ejecutando los comandos desde la carpeta `Trabajo2`.

3. **Accede directamente al archivo HTML**:
   Abre el archivo `/Users/juancortabarria/Documents/TallerObligatorio/obligatorio_taller/Trabajo2/web/index.html` directamente en tu navegador.

4. **Comprueba los errores en la consola del navegador**:
   Presiona F12 y ve a la pestaña Console para verificar si hay errores CORS u otros problemas.

### La dApp no puede conectarse a MetaMask

- Asegúrate de que MetaMask esté instalado y desbloqueado.
- Verifica que estés en la red correcta en MetaMask.
- Configura una red personalizada en MetaMask con estos parámetros:
  - Nombre: Hardhat Local
  - URL RPC: http://localhost:8545 (o http://127.0.0.1:8545)
  - ID de Cadena: 31337
  - Símbolo de Moneda: ETH

### Error al cargar la dirección del contrato

- Asegúrate de que el contrato se haya desplegado correctamente ejecutando `npm run deploy`.
- Verifica que el archivo `web/contract-address.json` contenga la dirección correcta.
- Comprueba que el nodo de Hardhat esté ejecutándose (`npm run node`).
- Abre la consola del navegador (F12 > Console) para ver mensajes de error detallados.

### La transferencia falla

- Asegúrate de tener suficientes tokens para transferir.
- Comprueba que tengas ETH para pagar el gas de la transacción.
- Verifica que la dirección de destino sea válida.

## Consideraciones de seguridad

Este es un proyecto educativo y no está optimizado para uso en producción. En un entorno real, se deberían implementar medidas adicionales de seguridad y auditorías del contrato.
