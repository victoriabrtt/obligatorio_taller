# Documentación Técnica - DAO

## 1. Arquitectura del Sistema

La arquitectura del sistema se compone de tres capas principales:

### Contratos Inteligentes (Capa Blockchain)
- **Token ERC-20 (MyToken.sol)**: Implementa el token de gobernanza utilizado para votar y crear propuestas.
- **Contrato DAO (DAO.sol)**: El núcleo del sistema que gestiona votaciones, propuestas y staking.
- **Multisig (Multisig.sol)**: Implementa la funcionalidad de multifirma para el owner y el mecanismo de pánico.
- **MultisigFactory (MultisigFactory.sol)**: Factory para crear contratos multisig.

### Backend (Hardhat/Node.js)
- **Scripts de despliegue**: Automatiza el despliegue de los contratos.
- **API simple**: Conecta el frontend con la blockchain.
- **Tests**: Valida la funcionalidad de los contratos.

### Frontend (React/TypeScript)
- **Interfaz de usuario**: Permite a los usuarios interactuar con la DAO.
- **Servicios de conexión**: Servicios para conectar con los contratos mediante Web3.
- **Gestión de estado**: Controla el estado de la aplicación y sincroniza con la blockchain.

## 2. Diagrama de Contratos y Responsabilidades

```
+--------------------+     +--------------------+
|     MyToken        |     |    MultisigFactory |
| (Token ERC-20)     |<----| (Crea multisigs)   |
+--------------------+     +--------------------+
         ^                          ^
         |                          |
         v                          v
+--------------------+     +--------------------+
|       DAO          |---->|      Multisig      |
| (Core governance)  |     | (Owner & Panic)    |
+--------------------+     +--------------------+
```

### Responsabilidades por Contrato:

#### MyToken.sol
- Implementa el estándar ERC-20
- Permite acuñar nuevos tokens (solo al owner)
- Requerimientos cumplidos: Token ERC-20 para poder de voto

#### DAO.sol
- Gestiona el staking para votar y propuestas
- Implementa el sistema de propuestas
- Implementa votación cuadrática (sqrt)
- Implementa delegación de votos
- Implementa mecanismo de pánico
- Requerimientos cumplidos:
  - Tokens ERC20 para poder de voto
  - Staking para votar y proponer
  - Tiempos mínimos de staking
  - Creación de propuestas
  - Votación a favor/contra
  - Conjunto A: votación cuadrática y delegación

#### Multisig.sol
- Implementa funcionalidad multifirma
- Permite aprobar transacciones por múltiples firmantes
- Requerimientos cumplidos: 
  - Owner multisig para la DAO
  - Multisig de pánico

#### MultisigFactory.sol
- Facilita la creación de contratos multisig
- Requerimientos cumplidos: Facilidad para crear multisigs

## 3. Aspectos Asumidos

- El despliegue inicial se realiza por una cuenta única que luego transfiere el control a los multisig.
- La interfaz web se ejecuta en un navegador con acceso a MetaMask u otro proveedor Web3.
- Los usuarios tienen conocimientos básicos para operar una wallet y firmar transacciones.
- Para la votación cuadrática, se asume que los tokens tienen 18 decimales y el cálculo de la raíz se realiza con una aproximación adecuada para Solidity.

## 4. Desafíos Encontrados

- **Implementación de votación cuadrática**: Calcular una raíz cuadrada precisa en Solidity requirió un algoritmo específico debido a las limitaciones de operaciones matemáticas en EVM.
- **Sistema de delegación**: Asegurar que la delegación de votos no permitiera ataques de re-entrancia o votación doble.
- **Multisig para Owner**: Asegurar que la implementación del multisig permitiera todas las operaciones necesarias del owner.
- **Mecanismo de pánico**: Implementar un sistema que pudiera detener todas las operaciones críticas pero permitiera la recuperación.

## 5. Resultados de Pruebas Unitarias

Las pruebas unitarias cubren el 100% del código de los contratos inteligentes, verificando:

| Contrato | Líneas de Código | Cobertura |
|----------|----------------|-----------|
| DAO.sol  | 526            | 100%      |
| MyToken.sol | 14         | 100%      |
| Multisig.sol | 195       | 100%      |
| MultisigFactory.sol | 23 | 100%      |

Se verifican todos los flujos críticos, incluyendo:
- Staking y unstaking
- Creación de propuestas
- Votación y delegación
- Mecanismo de pánico
- Multisig de aprobación

## 6. Flujos Principales

### Flujo de Votación
1. Usuario hace stake de tokens para poder votar
2. Usuario visualiza propuestas activas
3. Usuario vota a favor/contra una propuesta
4. El sistema calcula el poder de voto usando la raíz cuadrada
5. La propuesta actualiza su estado de votación
6. Cuando finaliza el tiempo, la propuesta se ejecuta si tiene mayoría

### Flujo de Creación de Propuestas
1. Usuario hace stake de tokens para poder proponer
2. Usuario crea una propuesta con título y descripción
3. La propuesta queda activa durante el período definido
4. Otros usuarios pueden votar
5. La propuesta se ejecuta o rechaza según los votos al finalizar

### Flujo de Delegación
1. Un usuario con stake para votar decide delegar su voto
2. Especifica la propuesta y la dirección del delegado
3. El delegado puede votar con el poder combinado
4. El sistema registra la delegación para evitar votos duplicados

### Flujo de Pánico
1. El owner multisig activa la función de pánico
2. Todas las operaciones de la DAO se pausan
3. Solo la multisig de pánico puede activar "tranquility"
4. Al activar tranquility, la DAO vuelve a operar normalmente
