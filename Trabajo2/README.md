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

### Opción 1: Servidor web simple (para desarrollo)

Puedes usar un servidor web simple como `http-server`:

```bash
npx http-server ./web
```

O si tienes Python instalado:

```bash
# Python 3
python -m http.server --directory web

# Python 2
python -m SimpleHTTPServer
```

### Opción 2: Abrir el archivo directamente

También puedes abrir el archivo `web/index.html` directamente en tu navegador, pero algunas funciones pueden no trabajar correctamente debido a restricciones de seguridad.

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

### La dApp no puede conectarse a MetaMask

- Asegúrate de que MetaMask esté instalado y desbloqueado.
- Verifica que estés en la red correcta en MetaMask.

### Error al cargar la dirección del contrato

- Asegúrate de que el contrato se haya desplegado correctamente.
- Verifica que el archivo `web/contract-address.json` contenga la dirección correcta.

### La transferencia falla

- Asegúrate de tener suficientes tokens para transferir.
- Comprueba que tengas ETH para pagar el gas de la transacción.
- Verifica que la dirección de destino sea válida.

## Consideraciones de seguridad

Este es un proyecto educativo y no está optimizado para uso en producción. En un entorno real, se deberían implementar medidas adicionales de seguridad y auditorías del contrato.
