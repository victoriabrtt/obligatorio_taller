# MiToken dApp

Este proyecto es una dApp simple que permite interactuar con un token ERC20 llamado MiToken. La aplicación permite conectarse a MetaMask, consultar el balance de cualquier dirección y realizar transferencias de tokens.

## Resumen rápido

```
1️⃣ Instalación: npm install
2️⃣ Compila:     npm run compile
3️⃣ Inicia nodo: npm run node         (Terminal 1 - mantener abierta)
4️⃣ Despliega:   npm run deploy       (Terminal 2)
5️⃣ Servidor:    npm run serve:express (Terminal 3)
6️⃣ Configura:   MetaMask con http://127.0.0.1:8545 y Chain ID 31337
7️⃣ Usa:         Abre http://localhost:3000 y conecta MetaMask
```

## Características

- Conectar a MetaMask con un solo clic
- Consultar el balance de cualquier dirección (función `balanceOf`)
- Transferir tokens a cualquier dirección (función `transfer`)
- El contrato asigna todo el suministro inicial (1,000,000 tokens) al creador del contrato

## Requisitos previos

- Node.js (v12 o superior)
- npm (v6 o superior)
- MetaMask instalado en tu navegador
- Git (opcional, solo para clonar el repositorio)

## Guía paso a paso

Esta guía te llevará por todo el proceso, desde la instalación hasta el uso de la dApp.

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌────────────────┐
│  Instalación │────►│  Compilación │────►│  Nodo Hardhat  │────►│   Despliegue   │
└─────────────┘     └──────────────┘     └────────────────┘     └────────────────┘
                                                                        │
                                                                        ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌────────────────┐
│    Usar     │◄────│   Conectar   │◄────│ Config MetaMask │◄────│Servidor Express│
│    dApp     │     │   MetaMask   │     │                 │     │                │
└─────────────┘     └──────────────┘     └────────────────┘     └────────────────┘
```

### 1. Instalación

```bash
# Clona el repositorio (opcional, si lo descargaste como archivo ZIP puedes saltarte este paso)
git clone <URL_del_repositorio>

# Navega a la carpeta del proyecto
cd Trabajo2

# Instala las dependencias
npm install
```

### 2. Compilación del contrato

```bash
# Compila el contrato MiToken
npm run compile
```

Este comando generará los artefactos necesarios en la carpeta `web/artifacts/`.

### 3. Inicia el nodo local de Hardhat

Abre una nueva terminal, navega a la carpeta del proyecto y ejecuta:

```bash
# Inicia un nodo de Ethereum local
npm run node
```

IMPORTANTE: Deja esta terminal abierta durante todo el proceso. Este comando inicia una blockchain local de Ethereum que escucha en `http://127.0.0.1:8545` y tiene el Chain ID `31337`.

### 4. Despliega el contrato

Abre otra terminal (dejando abierta la del nodo Hardhat), navega a la carpeta del proyecto y ejecuta:

```bash
# Despliega el contrato en la red local
npm run deploy
```

Este comando despliega el contrato MiToken en tu blockchain local y guarda la dirección del contrato en `web/contract-address.json`.

### 5. Inicia el servidor web

Manteniendo las otras dos terminales abiertas (nodo Hardhat y la terminal donde desplegaste), abre una tercera terminal y ejecuta:

```bash
# Usando Express (opción recomendada)
npm run serve:express
```

Esto iniciará un servidor web en `http://localhost:3000` que sirve la dApp.

#### Otras formas de servir la dApp (opcional)

Si prefieres, puedes usar alguna de estas alternativas:

```bash
# Usando Python
npm run serve:python

# Usando el servidor simple 'serve'
npm run serve

# O directamente con Express
node server.js
```

También puedes usar la extensión "Live Server" de VS Code:
1. Abre el archivo `web/index.html` en VS Code
2. Haz clic derecho en el archivo y selecciona "Open with Live Server"

### 6. Configura MetaMask

Este paso es **CRÍTICO**. MetaMask debe estar configurado correctamente para conectarse a tu nodo Hardhat local:

1. Abre la extensión de MetaMask en tu navegador
2. Haz clic en el selector de redes (arriba)
3. Selecciona "Agregar red" > "Agregar una red manualmente"
4. Configura la red con estos valores exactos:
   - **Nombre de la red**: Hardhat Local
   - **URL de RPC**: http://127.0.0.1:8545
   - **ID de la cadena**: 31337
   - **Símbolo de la moneda**: ETH

IMPORTANTE: La URL de RPC debe ser exactamente http://127.0.0.1:8545 y el ID de cadena debe ser exactamente 31337.

### 7. Usa la dApp

1. Abre la dApp en tu navegador en http://localhost:3000
2. Haz clic en "Conectar Wallet" y autoriza la conexión en MetaMask
3. Si MetaMask te muestra que estás en una red incorrecta, cambia a la red "Hardhat Local"
4. Ahora puedes:
   - **Consultar balance**: Ingresa una dirección y haz clic en "Consultar"
   - **Transferir tokens**: Ingresa la dirección destino, la cantidad y haz clic en "Transferir"

IMPORTANTE: Asegúrate de ver "Hardhat (Chain ID: 31337)" en la información de red en la dApp. Si ves otro Chain ID, verifica tu configuración de MetaMask.

### 8. Importa una cuenta con fondos (opcional)

Para usar una cuenta con fondos y tokens MiToken predeterminados:

1. En MetaMask, haz clic en tu foto de perfil > "Importar cuenta"
2. Copia una clave privada del nodo Hardhat (mostrada en la terminal donde ejecutaste `npm run node`)
3. Pega la clave privada y haz clic en "Importar"

Esta cuenta tendrá ETH para pagar gas y será el dueño de todos los tokens MiToken.

## Arquitectura del proyecto

```
┌───────────────────────────────────────────┐
│               Navegador                   │
│  ┌────────────┐          ┌────────────┐   │
│  │  Frontend  │◄────────►│  MetaMask  │   │
│  │   (dApp)   │          │            │   │
│  └────────────┘          └────────────┘   │
└───────────┬───────────────────────────────┘
            │
            │ JSON-RPC
            ▼
┌───────────────────────────────────────────┐
│         Nodo Ethereum (Hardhat)           │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │            Blockchain              │   │
│  │      ┌────────────────────────┐    │   │
│  │      │    Contrato MiToken    │    │   │
│  │      └────────────────────────┘    │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

## Estructura del proyecto

```
Trabajo2/
├── contracts/              # Contratos de Solidity
│   └── MiToken.sol         # Contrato ERC20
├── scripts/                # Scripts de despliegue
│   └── deploy.js           # Script para desplegar el contrato
├── web/                    # Frontend de la dApp
│   ├── index.html          # Página principal
│   ├── app.js              # Lógica de la aplicación
│   └── contract-address.json # Dirección del contrato desplegado
├── server.js               # Servidor Express para la dApp
├── hardhat.config.js       # Configuración de Hardhat (Chain ID 31337)
└── package.json            # Dependencias y scripts
```

## Detalles técnicos

### Contrato MiToken

El contrato `MiToken.sol` es un token ERC20 estándar con las siguientes características:
- **Nombre**: MiToken
- **Símbolo**: MTK
- **Decimales**: 18
- **Suministro inicial**: 1,000,000 tokens
- Todo el suministro inicial se asigna al creador del contrato

## Solución de problemas comunes

### ✅ MetaMask no puede detectar el Chain ID

Este es un problema común al configurar redes locales. Si ves este mensaje:

> No se pudo capturar el id. de cadena. ¿La dirección URL de RPC es correcta?

Solución paso a paso:

1. **Verifica que el nodo Hardhat esté ejecutándose**
   - Comprueba la terminal donde ejecutaste `npm run node`
   - Debería mostrar "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"

2. **Configura MetaMask con valores exactos**
   - URL de RPC: http://127.0.0.1:8545 (usa 127.0.0.1, no localhost)
   - ID de cadena: 31337 (debe ser este número exacto)
   - Asegúrate de no tener espacios adicionales en la URL

3. **Reinicia MetaMask**
   - Haz clic en tu foto de perfil > Configuración > Avanzado > Restablecer cuenta
   - O cierra completamente el navegador y ábrelo de nuevo

4. **Verifica la configuración de Hardhat**
   - El archivo `hardhat.config.js` debe tener `chainId: 31337` en la sección networks.hardhat
   
5. **Prueba estas soluciones adicionales**
   - Intenta usar la URL completa con protocolo: http://127.0.0.1:8545 
   - Abre una nueva ventana de navegación privada/incógnito e intenta ahí
   - Desactiva temporalmente cualquier extensión de seguridad/privacidad
   - En algunos sistemas, puede ser necesario permitir específicamente conexiones al localhost

6. **Si sigues teniendo problemas**
   - Ejecuta `lsof -i :8545` en terminal para verificar que el puerto está abierto
   - Intenta reiniciar el nodo Hardhat: detén el proceso y ejecútalo nuevamente
   - Comprueba que no hay otro nodo Ethereum usando el mismo puerto

### ✅ La conexión a MetaMask falla

1. **Revisa la consola del navegador** (F12 > Console) para ver errores detallados
2. **Asegúrate de que MetaMask esté desbloqueado** antes de conectar
3. **Prueba otra cuenta** de MetaMask si la actual tiene problemas

### ✅ Error al cargar la dirección del contrato

1. **Verifica el despliegue**: Ejecuta `npm run deploy` nuevamente
2. **Comprueba el archivo**: Abre `web/contract-address.json` y verifica que contenga una dirección válida
3. **Verifica el nodo**: Asegúrate de que el nodo Hardhat siga ejecutándose
4. **Orden correcto**: Primero inicia el nodo, luego despliega el contrato, y finalmente inicia el servidor web

### ✅ No puedes transferir tokens

1. **Asegúrate de usar la cuenta correcta**: La cuenta que desplegó el contrato tiene todos los tokens
2. **Verifica el saldo**: Consulta tu balance antes de transferir
3. **Formato correcto**: Usa puntos para decimales, no comas
4. **Confirma la transacción**: Asegúrate de confirmar la transacción en MetaMask cuando aparezca

### ✅ Otros problemas técnicos

1. **Reinicia todo el proceso**: A veces, reiniciar todos los servicios soluciona problemas inesperados
2. **Limpia la caché**: Prueba con Ctrl+F5 o limpia la caché del navegador
3. **Prueba otro navegador**: Si tienes problemas persistentes con un navegador, prueba otro

## Nota importante

Este proyecto es una dApp educativa y no está optimizada para uso en producción. En un entorno real, se requeriría una mayor seguridad, pruebas exhaustivas y auditorías de contratos.
