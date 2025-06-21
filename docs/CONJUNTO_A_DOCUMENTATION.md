# Documentación del Conjunto A: Votación Cuadrática y Delegación

Este documento describe en detalle las funcionalidades específicas del Conjunto A implementadas en nuestro proyecto de DAO.

## Votación Cuadrática

La votación cuadrática es un mecanismo que permite asignar votos a diferentes propuestas de manera que el costo de los votos aumenta cuadráticamente con la cantidad de votos emitidos. Esto previene que los grandes tenedores de tokens dominen completamente todas las decisiones.

### Implementación Técnica

En nuestro contrato `DAO.sol`, la votación cuadrática se implementa de la siguiente manera:

1. **Cálculo del Poder de Voto**: El poder de voto se calcula como la raíz cuadrada del balance de tokens del votante.
2. **Distribución de Votos**: Los usuarios pueden distribuir sus votos entre diferentes propuestas según su preferencia.
3. **Costo Cuadrático**: El costo en tokens de emitir `n` votos es proporcional a `n²`.

### Funciones Principales

- `vote(uint256 proposalId, uint256 voteAmount)`: Permite a un usuario votar en una propuesta específica.
- `calculateVotingPower(address voter)`: Calcula el poder de voto de un usuario basado en su balance de tokens.

## Sistema de Delegación

El sistema de delegación permite que los usuarios deleguen su poder de voto a otros usuarios que consideran más informados o activos en la gobernanza de la DAO.

### Implementación Técnica

La delegación se implementa permitiendo a los usuarios designar a otros como sus delegados:

1. **Designación de Delegados**: Un usuario puede elegir a otro para que vote en su nombre.
2. **Transferencia de Poder de Voto**: El poder de voto del delegante se suma al del delegado.
3. **Cadena de Delegación**: Se admite la delegación en cadena (A delega en B, B delega en C).

### Funciones Principales

- `delegate(address delegatee)`: Permite a un usuario delegar su poder de voto.
- `undelegate()`: Revoca la delegación actual.
- `getDelegatedPower(address delegatee)`: Calcula el poder de voto total de un delegado.

## Interacción Frontend-Contrato

En el frontend, estas funcionalidades se implementan en los siguientes componentes:

1. **Página de Votación**: Permite a los usuarios emitir sus votos con interfaz gráfica que muestra el costo cuadrático.
2. **Página de Delegación**: Interfaz para delegar y visualizar las delegaciones activas.

## Pruebas y Validación

Estas funcionalidades están verificadas mediante pruebas automatizadas:

- `DAO.voting.test.js`: Verifica el funcionamiento de la votación cuadrática.
- `DAO.delegation.test.js`: Comprueba las funcionalidades de delegación y cálculo de poder delegado.

## Requisitos Cumplidos

Esta implementación cumple con todos los requisitos del Conjunto A especificados en el obligatorio, proporcionando un sistema democrático de gobernanza con protección contra la centralización del poder de decisión.
