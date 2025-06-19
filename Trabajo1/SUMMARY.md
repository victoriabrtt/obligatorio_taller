# Resumen del Trabajo 1 - Sistema de Staking con NFT

## Implementación

El proyecto ha sido implementado exitosamente con los siguientes componentes:

### Contratos

1. **OrtToken.sol**: 
   - Token ERC20 estándar implementado con OpenZeppelin
   - Utilizado para el staking

2. **UyArt.sol**: 
   - NFT ERC721 personalizado implementado sin usar OpenZeppelin (100% código propio)
   - Supply máximo de 100 tokens
   - Implementa todos los métodos requeridos por EIP-721
   - Soporte para almacenar y mostrar metadatos para cada NFT

3. **StakeForNFT.sol**: 
   - Contrato de staking con restricciones específicas:
     - Solo permite staking por 1000 bloques desde el despliegue
     - Requiere un mínimo de 1000 tokens y solo acepta múltiplos de 1000
     - Limita el máximo total a 100,000 tokens
   - Maneja el minteo de NFTs después del período de staking (1 NFT por cada 1000 tokens stakeados)
   - Implementa la generación básica de metadatos para los NFTs

4. **Deploy.sol**:
   - Contrato auxiliar que facilita el despliegue y configuración de todos los contratos

### Pruebas

- Tests unitarios que verifican todas las restricciones y requisitos:
  1. Período de tiempo limitado para staking
  2. Requisitos de cantidad mínima y múltiplos
  3. Límite máximo total
  4. Minteo de NFTs proporcional al staking
  5. Prevención de reclamo múltiple de NFTs

### Mejoras y Observaciones

- **Metadatos NFT**: Se ha implementado una solución básica para la generación de metadatos. Para una implementación completa en producción, se recomendaría:
  1. Generar un JSON completo que siga el estándar de metadatos ERC721
  2. Subir este JSON a IPFS para asegurar descentralización
  3. Agregar imágenes únicas para cada NFT

- **Seguridad**: El contrato implementa verificaciones de seguridad básicas como:
  1. Verificación de direcciones no nulas
  2. Control de acceso para el minteo de NFTs
  3. Prevención de ataques de reentrada
  4. Verificación de balances y límites

## Flujo de Uso

1. Se despliegan los contratos OrtToken, UyArt y StakeForNFT
2. Se configura el contrato de staking en el NFT
3. Los usuarios aprueban el gasto de sus tokens
4. Los usuarios hacen staking de sus tokens (en múltiplos de 1000)
5. Después de 1000 bloques, finaliza el período de staking
6. Los usuarios reclaman sus NFTs (1 por cada 1000 tokens)

Este flujo se puede ver en acción ejecutando el script `workflow_demo.js`.

## Conclusión

El proyecto implementa exitosamente todos los requisitos especificados en la consigna:
- Usa el token ERC20 base
- Modifica el contrato de staking con las restricciones pedidas
- Crea un NFT propio (UyArt) implementado desde cero
- Integra todo el sistema para permitir el minteo de NFTs en proporción al staking realizado
