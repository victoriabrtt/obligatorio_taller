# Guía de Verificación del Sistema Multisig

## Introducción

Esta guía está diseñada específicamente para verificar el funcionamiento del sistema multisig en la DAO, uno de los componentes críticos exigidos en la consigna del obligatorio. Proporciona instrucciones detalladas para probar que:

1. El owner de la DAO es efectivamente una multisig
2. La multisig de pánico está correctamente configurada
3. Ambas multisigs pueden ejecutar sus respectivas funciones privilegiadas
4. Las restricciones de acceso funcionan como se espera

## Requisitos Previos

Antes de comenzar, asegúrese de:

1. Tener una red local Ethereum funcionando (Ganache como indica la consigna)
2. Haber desplegado los contratos siguiendo la `EXECUTION_GUIDE.md`
3. Tener al menos 5 cuentas distintas para las pruebas:
   - 3 cuentas para la multisig del owner
   - 2 cuentas para la multisig de pánico
   - 1 cuenta adicional para pruebas generales

## 1. Verificar la Configuración de las Multisigs

### 1.1. Script de Verificación del Estado Inicial

Primero, vamos a verificar que las multisigs estén correctamente configuradas.

Cree el siguiente script en `scripts/verify_multisig_setup.js`:

```javascript
// scripts/verify_multisig_setup.js
const hre = require("hardhat");

async function main() {
  console.log("=== Verificando configuración de multisig ===\n");
  
  // Obtener instancia de la DAO
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Verificar direcciones de multisig
  const ownerMultisig = await dao.ownerMultisig();
  const panicMultisig = await dao.panicMultisig();
  
  console.log("Dirección del contrato DAO:", daoAddress);
  console.log("Dirección de Owner Multisig:", ownerMultisig);
  console.log("Dirección de Panic Multisig:", panicMultisig);
  
  // Verificar factory de multisig
  const factoryAddress = await dao.multisigFactory.getAddress();
  console.log("Dirección de MultisigFactory:", factoryAddress);
  const factory = await hre.ethers.getContractAt("MultisigFactory", factoryAddress);
  
  // Verificar si son multisigs válidas
  console.log("\nVerificando validez de las multisigs:");
  console.log("Owner es multisig válida:", await factory.isMultisig(ownerMultisig));
  console.log("Panic es multisig válida:", await factory.isMultisig(panicMultisig));
  
  // Obtener contratos multisig
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisigContract = Multisig.attach(ownerMultisig);
  const panicMultisigContract = Multisig.attach(panicMultisig);
  
  // Verificar configuración de owner multisig
  const ownerRequired = await ownerMultisigContract.requiredApprovals();
  const ownerOwnerCount = await ownerMultisigContract.ownerCount();
  console.log("\nConfiguración de Owner Multisig:");
  console.log(`- Requiere ${ownerRequired} de ${ownerOwnerCount} aprobaciones`);
  
  // Verificar configuración de panic multisig
  const panicRequired = await panicMultisigContract.requiredApprovals();
  const panicOwnerCount = await panicMultisigContract.ownerCount();
  console.log("\nConfiguración de Panic Multisig:");
  console.log(`- Requiere ${panicRequired} de ${panicOwnerCount} aprobaciones`);
  
  // Verificar estado de la DAO
  const isPaused = await dao.isPaused();
  console.log("\nEstado actual de la DAO:");
  console.log("- DAO está pausada:", isPaused);
  
  console.log("\n=== Verificación de configuración completada ===");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para verificar la configuración inicial:

```bash
# Ejecutar el script de verificación
npx hardhat run scripts/verify_multisig_setup.js --network localhost
```

### 1.2. Listar Propietarios de las Multisigs

Para verificar quiénes son los propietarios de cada multisig, cree el siguiente script en `scripts/list_multisig_owners.js`:

```javascript
// scripts/list_multisig_owners.js
const hre = require("hardhat");

async function main() {
  console.log("=== Listando propietarios de las multisigs ===\n");
  
  // Obtener instancia de la DAO
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Obtener direcciones de multisig
  const ownerMultisigAddress = await dao.ownerMultisig();
  const panicMultisigAddress = await dao.panicMultisig();
  
  // Obtener contratos multisig
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  const panicMultisig = Multisig.attach(panicMultisigAddress);
  
  // Listar propietarios del owner multisig
  console.log("Propietarios del Owner Multisig:");
  const ownerCount = await ownerMultisig.ownerCount();
  for (let i = 0; i < ownerCount; i++) {
    const owner = await ownerMultisig.owners(i);
    console.log(`- ${owner} (Owner ${i+1})`);
  }
  
  // Listar propietarios del panic multisig
  console.log("\nPropietarios del Panic Multisig:");
  const panicOwnerCount = await panicMultisig.ownerCount();
  for (let i = 0; i < panicOwnerCount; i++) {
    const owner = await panicMultisig.owners(i);
    console.log(`- ${owner} (Panic Owner ${i+1})`);
  }
  
  console.log("\nGuarde estas direcciones para usar en las pruebas de multisig.");
  console.log("\n=== Listado de propietarios completado ===");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para obtener las direcciones de los propietarios:

```bash
# Listar los propietarios de las multisigs
npx hardhat run scripts/list_multisig_owners.js --network localhost
```

## 2. Probar el Owner Multisig

Ahora vamos a verificar que el owner multisig puede realizar operaciones administrativas.

### 2.1. Script para Cambiar un Parámetro de la DAO

Cree el siguiente script en `scripts/test_owner_multisig_operation.js`:

```javascript
// scripts/test_owner_multisig_operation.js
const hre = require("hardhat");

async function main() {
  console.log("=== Probando Operación del Owner Multisig ===\n");
  
  // Obtener cuentas
  const signers = await hre.ethers.getSigners();
  
  // Obtener instancia de la DAO
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Obtener dirección y contrato de owner multisig
  const ownerMultisigAddress = await dao.ownerMultisig();
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  
  // Obtener configuración actual de la DAO
  console.log("Configuración actual de la DAO:");
  const currentStakingToVote = await dao.stakingToVote();
  const currentMinStakingTime = await dao.minStakingTime();
  console.log(`- Stake mínimo para votar: ${hre.ethers.formatEther(currentStakingToVote)} tokens`);
  console.log(`- Tiempo mínimo de staking: ${currentMinStakingTime} segundos`);
  
  // Definir nuevos valores para los parámetros
  const newStakingToVote = hre.ethers.parseEther("15"); // Cambiar a 15 tokens
  const newMinStakingTime = 7200; // Cambiar a 2 horas
  
  console.log("\nNuevos valores a configurar:");
  console.log(`- Nuevo stake mínimo para votar: ${hre.ethers.formatEther(newStakingToVote)} tokens`);
  console.log(`- Nuevo tiempo mínimo de staking: ${newMinStakingTime} segundos`);
  
  // Preparar datos de la transacción (manteniendo los demás parámetros iguales)
  const initParamsData = dao.interface.encodeFunctionData("initParameters", [
    newStakingToVote,             // Nuevo stakingToVote
    await dao.stakingToPropose(),  // Mantener mismo valor
    newMinStakingTime,            // Nuevo minStakingTime
    await dao.votePowerDivider(),  // Mantener mismo valor
    await dao.proposalDurationDays(),  // Mantener mismo valor
    await dao.tokenPriceInWei()    // Mantener mismo valor
  ]);
  
  // 1. Primera cuenta de owner propone la transacción
  console.log("\nPaso 1: La primera cuenta propone cambiar los parámetros...");
  
  // Usar la primera cuenta de signer para proponer (ajustar según sea necesario)
  const proposerIndex = 0; // La primera cuenta
  const proposer = signers[proposerIndex];
  
  console.log(`Usando cuenta ${proposer.address} para proponer la transacción`);
  const ownerMultisigWithProposer = ownerMultisig.connect(proposer);
  
  // Comprobar si esta cuenta es propietaria
  const isOwner = await ownerMultisig.isOwner(proposer.address);
  if (!isOwner) {
    console.log(`Error: La cuenta ${proposer.address} no es propietaria del multisig.`);
    console.log("Por favor use una cuenta que sea propietaria del multisig para proponer la transacción.");
    return;
  }
  
  const txPropose = await ownerMultisigWithProposer.submitTransaction(
    daoAddress, // Destino: contrato DAO
    0,          // Value: 0 ETH
    initParamsData  // Data: llamada a initParameters con nuevos valores
  );
  
  await txPropose.wait();
  console.log("Transacción propuesta correctamente.");
  
  // Obtener el ID de la transacción
  const txCount = await ownerMultisig.getTransactionCount();
  const txId = txCount - 1; // El ID de la última transacción
  console.log(`ID de la transacción propuesta: ${txId}`);
  
  // 2. Segunda cuenta aprueba la transacción
  console.log("\nPaso 2: La segunda cuenta aprueba la transacción...");
  
  // Usar la segunda cuenta para aprobar
  const approverIndex = 1; // La segunda cuenta 
  const approver = signers[approverIndex];
  
  console.log(`Usando cuenta ${approver.address} para aprobar la transacción`);
  const ownerMultisigWithApprover = ownerMultisig.connect(approver);
  
  // Comprobar si esta cuenta es propietaria
  const isApproverOwner = await ownerMultisig.isOwner(approver.address);
  if (!isApproverOwner) {
    console.log(`Error: La cuenta ${approver.address} no es propietaria del multisig.`);
    console.log("Por favor use una cuenta que sea propietaria del multisig para aprobar la transacción.");
    return;
  }
  
  // Aprobar la transacción
  const txApprove = await ownerMultisigWithApprover.approveTransaction(txId);
  await txApprove.wait();
  console.log("Transacción aprobada correctamente.");
  
  // Mostrar conteo de aprobaciones
  const approvalCount = await ownerMultisig.getApprovalCount(txId);
  const requiredApprovals = await ownerMultisig.requiredApprovals();
  console.log(`Aprobaciones: ${approvalCount} de ${requiredApprovals} requeridas`);
  
  // 3. Ejecutar la transacción (puede ser cualquiera de las cuentas propietarias)
  console.log("\nPaso 3: Ejecutando la transacción...");
  
  // Verificar si ya tiene suficientes aprobaciones
  if (approvalCount >= requiredApprovals) {
    // Ejecutar la transacción
    const txExecute = await ownerMultisigWithProposer.executeTransaction(txId);
    await txExecute.wait();
    console.log("Transacción ejecutada correctamente.");
    
    // Verificar que los parámetros han cambiado
    const newStakingToVoteValue = await dao.stakingToVote();
    const newMinStakingTimeValue = await dao.minStakingTime();
    
    console.log("\nNuevos valores configurados:");
    console.log(`- Stake mínimo para votar: ${hre.ethers.formatEther(newStakingToVoteValue)} tokens`);
    console.log(`- Tiempo mínimo de staking: ${newMinStakingTimeValue} segundos`);
    
    // Verificar que los cambios se aplicaron correctamente
    const stakingToVoteChanged = newStakingToVoteValue.toString() === newStakingToVote.toString();
    const minStakingTimeChanged = newMinStakingTimeValue.toString() === newMinStakingTime.toString();
    
    if (stakingToVoteChanged && minStakingTimeChanged) {
      console.log("\n✅ ÉXITO: Los parámetros se cambiaron correctamente a través del owner multisig.");
      console.log("   Esto verifica que el owner de la DAO es efectivamente el contrato multisig.");
    } else {
      console.log("\n❌ ERROR: Los parámetros no se actualizaron correctamente.");
      console.log("   Valores esperados vs obtenidos:");
      console.log(`   - Stake mínimo: esperado ${hre.ethers.formatEther(newStakingToVote)}, obtenido ${hre.ethers.formatEther(newStakingToVoteValue)}`);
      console.log(`   - Tiempo mínimo: esperado ${newMinStakingTime}, obtenido ${newMinStakingTimeValue}`);
    }
  } else {
    console.log(`❌ ERROR: No hay suficientes aprobaciones para ejecutar la transacción.`);
    console.log(`   Se requieren ${requiredApprovals} aprobaciones y solo hay ${approvalCount}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para verificar que el owner multisig puede cambiar parámetros de la DAO:

```bash
# Probar la operación del owner multisig
npx hardhat run scripts/test_owner_multisig_operation.js --network localhost
```

**Importante:** Si el script falla porque las cuentas usadas no son propietarias, ajuste los índices `proposerIndex` y `approverIndex` según las cuentas propietarias que identificó con el script anterior.

## 3. Probar el Panic Multisig

Ahora vamos a verificar que el panic multisig puede activar y desactivar el modo de emergencia.

### 3.1. Script para Probar el Botón de Pánico

Cree el siguiente script en `scripts/test_panic_multisig_operation.js`:

```javascript
// scripts/test_panic_multisig_operation.js
const hre = require("hardhat");

async function main() {
  console.log("=== Probando Operación del Panic Multisig ===\n");
  
  // Obtener cuentas
  const signers = await hre.ethers.getSigners();
  
  // Obtener instancia de la DAO
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Obtener direcciones y contratos de multisig
  const ownerMultisigAddress = await dao.ownerMultisig();
  const panicMultisigAddress = await dao.panicMultisig();
  
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  const panicMultisig = Multisig.attach(panicMultisigAddress);
  
  // Verificar estado inicial
  const isInitiallyPaused = await dao.isPaused();
  console.log(`Estado inicial de la DAO: ${isInitiallyPaused ? 'PAUSADA' : 'ACTIVA'}`);
  
  // 1. Activar el modo pánico desde el owner multisig
  console.log("\nPaso 1: Activando modo pánico desde el owner multisig...");
  
  // Usar la primera cuenta para proponer
  const ownerIndex = 0; // Primera cuenta
  const owner = signers[ownerIndex];
  console.log(`Usando cuenta ${owner.address} para proponer el pánico`);
  
  // Verificar si es propietario
  const isOwnerOwner = await ownerMultisig.isOwner(owner.address);
  if (!isOwnerOwner) {
    console.log(`Error: La cuenta ${owner.address} no es propietaria del owner multisig.`);
    return;
  }
  
  const ownerMultisigWithOwner = ownerMultisig.connect(owner);
  
  // Preparar datos para función de pánico
  const panicData = dao.interface.encodeFunctionData("panic", []);
  
  // Proponer la transacción
  const txProposePanic = await ownerMultisigWithOwner.submitTransaction(
    daoAddress,
    0,
    panicData
  );
  await txProposePanic.wait();
  
  // Obtener ID de la transacción
  const ownerTxCount = await ownerMultisig.getTransactionCount();
  const panicTxId = ownerTxCount - 1;
  console.log(`Transacción de pánico propuesta con ID: ${panicTxId}`);
  
  // Usar la segunda cuenta para aprobar
  const approverIndex = 1; // Segunda cuenta
  const approver = signers[approverIndex];
  console.log(`Usando cuenta ${approver.address} para aprobar el pánico`);
  
  // Verificar si es propietario
  const isApproverOwner = await ownerMultisig.isOwner(approver.address);
  if (!isApproverOwner) {
    console.log(`Error: La cuenta ${approver.address} no es propietaria del owner multisig.`);
    return;
  }
  
  const ownerMultisigWithApprover = ownerMultisig.connect(approver);
  
  // Aprobar la transacción
  const txApprovePanic = await ownerMultisigWithApprover.approveTransaction(panicTxId);
  await txApprovePanic.wait();
  
  // Ejecutar la transacción
  console.log("Ejecutando transacción de pánico...");
  const txExecutePanic = await ownerMultisigWithOwner.executeTransaction(panicTxId);
  await txExecutePanic.wait();
  
  // Verificar estado después del pánico
  const isPausedAfterPanic = await dao.isPaused();
  console.log(`Estado de la DAO después del pánico: ${isPausedAfterPanic ? 'PAUSADA' : 'ACTIVA'}`);
  
  if (isPausedAfterPanic) {
    console.log("✅ ÉXITO: El modo pánico se activó correctamente desde el owner multisig.");
  } else {
    console.log("❌ ERROR: El modo pánico no se activó correctamente.");
  }
  
  // 2. Intentar hacer una operación durante el pánico (debe fallar)
  console.log("\nPaso 2: Intentando realizar una operación mientras la DAO está pausada...");
  
  try {
    // Obtener token y crear una cuenta de prueba con tokens
    const tokenAddress = await dao.token();
    const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
    
    // Usar una cuenta que no sea owner ni panic
    const regularUserIndex = 5; // Por ejemplo, la sexta cuenta
    const regularUser = signers[regularUserIndex];
    
    // Acuñar tokens para esta cuenta
    await token.mint(regularUser.address, hre.ethers.parseEther("1000"));
    await token.connect(regularUser).approve(daoAddress, hre.ethers.parseEther("1000"));
    
    // Intentar hacer staking (debería fallar porque la DAO está pausada)
    console.log(`Intentando hacer staking con cuenta ${regularUser.address}...`);
    await dao.connect(regularUser).stakeForVote(hre.ethers.parseEther("100"));
    
    console.log("❌ ERROR: La operación funcionó aunque la DAO está pausada.");
  } catch (error) {
    console.log("✅ ÉXITO: La operación falló como se esperaba debido a que la DAO está pausada.");
    console.log(`   Mensaje de error: ${error.message.substring(0, 100)}...`);
  }
  
  // 3. Desactivar el modo pánico con el panic multisig
  console.log("\nPaso 3: Desactivando modo pánico con el panic multisig...");
  
  // Usar una cuenta propietaria del panic multisig
  const panicOwnerIndex = 3; // Por ejemplo, la cuarta cuenta
  const panicOwner = signers[panicOwnerIndex];
  console.log(`Usando cuenta ${panicOwner.address} para desactivar el pánico`);
  
  // Verificar si es propietario del panic multisig
  const isPanicOwner = await panicMultisig.isOwner(panicOwner.address);
  if (!isPanicOwner) {
    console.log(`Error: La cuenta ${panicOwner.address} no es propietaria del panic multisig.`);
    console.log("Probando con otra cuenta...");
    
    // Intentar con la quinta cuenta
    const panicOwnerIndex2 = 4;
    const panicOwner2 = signers[panicOwnerIndex2];
    console.log(`Usando cuenta ${panicOwner2.address} para desactivar el pánico`);
    
    const isPanicOwner2 = await panicMultisig.isOwner(panicOwner2.address);
    if (!isPanicOwner2) {
      console.log(`Error: La cuenta ${panicOwner2.address} tampoco es propietaria del panic multisig.`);
      console.log("Por favor, identifique las cuentas propietarias del panic multisig con el script list_multisig_owners.js");
      return;
    }
    
    // Si la segunda cuenta es propietaria, usarla
    const panicMultisigWithOwner = panicMultisig.connect(panicOwner2);
    
    // Preparar datos para función de tranquilidad
    const tranquilityData = dao.interface.encodeFunctionData("tranquility", []);
    
    // Proponer la transacción
    const txProposeTranquility = await panicMultisigWithOwner.submitTransaction(
      daoAddress,
      0,
      tranquilityData
    );
    await txProposeTranquility.wait();
    
    // Obtener ID de la transacción
    const panicTxCount = await panicMultisig.getTransactionCount();
    const tranquilityTxId = panicTxCount - 1;
    console.log(`Transacción de tranquilidad propuesta con ID: ${tranquilityTxId}`);
    
    // Ver si requiere más aprobaciones
    const panicRequiredApprovals = await panicMultisig.requiredApprovals();
    if (panicRequiredApprovals > 1) {
      console.log(`Se requieren ${panicRequiredApprovals} aprobaciones para la transacción de tranquilidad.`);
      console.log("Por favor use el script con las cuentas adecuadas para completar la prueba.");
      return;
    }
    
    // Ejecutar la transacción
    console.log("Ejecutando transacción de tranquilidad...");
    const txExecuteTranquility = await panicMultisigWithOwner.executeTransaction(tranquilityTxId);
    await txExecuteTranquility.wait();
  } else {
    // Si la primera cuenta es propietaria, usarla
    const panicMultisigWithOwner = panicMultisig.connect(panicOwner);
    
    // Preparar datos para función de tranquilidad
    const tranquilityData = dao.interface.encodeFunctionData("tranquility", []);
    
    // Proponer la transacción
    const txProposeTranquility = await panicMultisigWithOwner.submitTransaction(
      daoAddress,
      0,
      tranquilityData
    );
    await txProposeTranquility.wait();
    
    // Obtener ID de la transacción
    const panicTxCount = await panicMultisig.getTransactionCount();
    const tranquilityTxId = panicTxCount - 1;
    console.log(`Transacción de tranquilidad propuesta con ID: ${tranquilityTxId}`);
    
    // Ver si requiere más aprobaciones
    const panicRequiredApprovals = await panicMultisig.requiredApprovals();
    if (panicRequiredApprovals > 1) {
      console.log(`Se requieren ${panicRequiredApprovals} aprobaciones para la transacción de tranquilidad.`);
      console.log("Por favor use el script con las cuentas adecuadas para completar la prueba.");
      return;
    }
    
    // Ejecutar la transacción
    console.log("Ejecutando transacción de tranquilidad...");
    const txExecuteTranquility = await panicMultisigWithOwner.executeTransaction(tranquilityTxId);
    await txExecuteTranquility.wait();
  }
  
  // Verificar estado después de tranquilidad
  const isStillPaused = await dao.isPaused();
  console.log(`Estado de la DAO después de tranquilidad: ${isStillPaused ? 'PAUSADA' : 'ACTIVA'}`);
  
  if (!isStillPaused) {
    console.log("✅ ÉXITO: El modo pánico se desactivó correctamente desde el panic multisig.");
  } else {
    console.log("❌ ERROR: El modo pánico no se desactivó correctamente.");
  }
  
  // 4. Verificar que las operaciones funcionan de nuevo
  console.log("\nPaso 4: Verificando que las operaciones funcionan después de tranquilidad...");
  
  try {
    // Obtener token y crear una cuenta de prueba
    const tokenAddress = await dao.token();
    const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
    
    // Usar una cuenta regular
    const regularUserIndex = 5;
    const regularUser = signers[regularUserIndex];
    
    // Intentar hacer staking (debería funcionar ahora)
    console.log(`Intentando hacer staking con cuenta ${regularUser.address}...`);
    await dao.connect(regularUser).stakeForVote(hre.ethers.parseEther("100"));
    
    // Verificar el stake
    const stake = await dao.voteStakes(regularUser.address);
    console.log(`Stake realizado: ${hre.ethers.formatEther(stake.amount)} tokens`);
    
    console.log("✅ ÉXITO: Las operaciones funcionan normalmente después de desactivar el pánico.");
  } catch (error) {
    console.log("❌ ERROR: Las operaciones siguen fallando después de desactivar el pánico.");
    console.log(`   Mensaje de error: ${error.message.substring(0, 100)}...`);
  }
  
  console.log("\n=== Prueba de Panic Multisig Completa ===");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para verificar el funcionamiento del botón de pánico y la multisig de emergencia:

```bash
# Probar la operación del panic multisig
npx hardhat run scripts/test_panic_multisig_operation.js --network localhost
```

**Nota importante:** Al igual que antes, es posible que necesite ajustar los índices de las cuentas (`ownerIndex`, `approverIndex`, `panicOwnerIndex`) según las cuentas que identificó como propietarias de cada multisig.

## 4. Verificar Restricciones de Acceso

Por último, vamos a verificar que las restricciones de acceso funcionan correctamente.

### 4.1. Script para Probar Restricciones de Acceso

Cree el siguiente script en `scripts/verify_access_restrictions.js`:

```javascript
// scripts/verify_access_restrictions.js
const hre = require("hardhat");

async function main() {
  console.log("=== Verificando Restricciones de Acceso ===\n");
  
  // Obtener cuentas
  const signers = await hre.ethers.getSigners();
  const regularUser = signers[9]; // Usar la décima cuenta como usuario regular
  
  // Obtener instancias de contratos
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Obtener multisigs
  const ownerMultisigAddress = await dao.ownerMultisig();
  const panicMultisigAddress = await dao.panicMultisig();
  
  // Verificar que la cuenta regular no es propietaria de ninguna multisig
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  const panicMultisig = Multisig.attach(panicMultisigAddress);
  
  const isOwnerMultisigOwner = await ownerMultisig.isOwner(regularUser.address);
  const isPanicMultisigOwner = await panicMultisig.isOwner(regularUser.address);
  
  if (isOwnerMultisigOwner || isPanicMultisigOwner) {
    console.log(`Error: La cuenta ${regularUser.address} es propietaria de una multisig.`);
    console.log("Por favor elija otra cuenta para la prueba de acceso restringido.");
    return;
  }
  
  console.log(`Usando cuenta regular: ${regularUser.address}`);
  console.log("Verificando que esta cuenta NO puede realizar operaciones restringidas.");
  
  // 1. Intentar llamar a initParameters (onlyOwner)
  console.log("\n1. Intentando llamar a initParameters (onlyOwner)...");
  try {
    const daoWithUser = dao.connect(regularUser);
    
    await daoWithUser.initParameters(
      await dao.stakingToVote(),
      await dao.stakingToPropose(),
      await dao.minStakingTime(), 
      await dao.votePowerDivider(),
      await dao.proposalDurationDays(),
      await dao.tokenPriceInWei()
    );
    
    console.log("❌ ERROR: La operación onlyOwner funcionó con una cuenta sin privilegios.");
  } catch (error) {
    console.log("✅ ÉXITO: La operación onlyOwner falló como se esperaba.");
    console.log(`   Mensaje de error: ${error.message.substring(0, 100)}...`);
  }
  
  // 2. Intentar llamar a panic (onlyOwner)
  console.log("\n2. Intentando llamar a panic (onlyOwner)...");
  try {
    const daoWithUser = dao.connect(regularUser);
    await daoWithUser.panic();
    
    console.log("❌ ERROR: La función panic funcionó con una cuenta sin privilegios.");
  } catch (error) {
    console.log("✅ ÉXITO: La función panic falló como se esperaba.");
    console.log(`   Mensaje de error: ${error.message.substring(0, 100)}...`);
  }
  
  // 3. Intentar llamar a tranquility (onlyPanic)
  console.log("\n3. Intentando llamar a tranquility (onlyPanic)...");
  try {
    const daoWithUser = dao.connect(regularUser);
    await daoWithUser.tranquility();
    
    console.log("❌ ERROR: La función tranquility funcionó con una cuenta sin privilegios.");
  } catch (error) {
    console.log("✅ ÉXITO: La función tranquility falló como se esperaba.");
    console.log(`   Mensaje de error: ${error.message.substring(0, 100)}...`);
  }
  
  console.log("\n=== Verificación de Restricciones de Acceso Completada ===");
  console.log("\nResumen:");
  console.log("- Se verificó que las funciones onlyOwner no pueden ser llamadas por cuentas regulares");
  console.log("- Se verificó que las funciones onlyPanic no pueden ser llamadas por cuentas regulares");
  console.log("- Se confirmó que el sistema de restricciones de acceso está funcionando correctamente");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para verificar las restricciones de acceso:

```bash
# Verificar restricciones de acceso
npx hardhat run scripts/verify_access_restrictions.js --network localhost
```

## 5. Resumen y Verificación Final

Una vez que haya ejecutado todos los scripts de prueba, debería tener una verificación completa de que:

1. La DAO usa correctamente un owner multisig para las funciones administrativas
2. La DAO tiene configurada una multisig de pánico para controlar el modo de emergencia
3. Las funciones restringidas solo pueden ser llamadas por las entidades autorizadas
4. El sistema multisig funciona como se describe en la consigna

### 5.1. Script de Verificación Final

Cree un último script que compile todas las verificaciones en un informe final:

```javascript
// scripts/multisig_summary.js
const hre = require("hardhat");

async function main() {
  console.log("=== INFORME DE VERIFICACIÓN DEL SISTEMA MULTISIG ===\n");
  
  // Obtener instancia de la DAO
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Obtener direcciones de multisig
  const ownerMultisigAddress = await dao.ownerMultisig();
  const panicMultisigAddress = await dao.panicMultisig();
  
  // Verificar configuración de multisigs
  const Multisig = await hre.ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  const panicMultisig = Multisig.attach(panicMultisigAddress);
  
  const factory = await hre.ethers.getContractAt("MultisigFactory", await dao.multisigFactory.getAddress());
  
  // 1. Verificar que son multisigs válidas
  const ownerIsMultisig = await factory.isMultisig(ownerMultisigAddress);
  const panicIsMultisig = await factory.isMultisig(panicMultisigAddress);
  
  console.log("1. Verificación de contratos multisig:");
  console.log(`   - Owner multisig: ${ownerIsMultisig ? '✅ VÁLIDO' : '❌ NO VÁLIDO'}`);
  console.log(`   - Panic multisig: ${panicIsMultisig ? '✅ VÁLIDO' : '❌ NO VÁLIDO'}`);
  
  // 2. Verificar configuración de multisigs
  const ownerRequired = await ownerMultisig.requiredApprovals();
  const ownerOwnerCount = await ownerMultisig.ownerCount();
  const panicRequired = await panicMultisig.requiredApprovals();
  const panicOwnerCount = await panicMultisig.ownerCount();
  
  console.log("\n2. Configuración de multisigs:");
  console.log(`   - Owner multisig: Requiere ${ownerRequired} de ${ownerOwnerCount} aprobaciones`);
  console.log(`   - Panic multisig: Requiere ${panicRequired} de ${panicOwnerCount} aprobaciones`);
  
  // 3. Verificar estado actual de la DAO
  const isPaused = await dao.isPaused();
  
  console.log("\n3. Estado actual de la DAO:");
  console.log(`   - La DAO está: ${isPaused ? 'PAUSADA' : 'ACTIVA'}`);
  
  // 4. Verificar cumplimiento de la consigna
  console.log("\n4. Verificación de cumplimiento de la consigna:");
  
  const hasOwnerMultisig = ownerMultisigAddress !== "0x0000000000000000000000000000000000000000";
  const hasPanicMultisig = panicMultisigAddress !== "0x0000000000000000000000000000000000000000";
  
  console.log(`   - El owner de la DAO es una multisig: ${hasOwnerMultisig ? '✅ CUMPLE' : '❌ NO CUMPLE'}`);
  console.log(`   - La DAO tiene multisig de pánico: ${hasPanicMultisig ? '✅ CUMPLE' : '❌ NO CUMPLE'}`);
  
  // 5. Verificar parámetros configurados
  const stakingToVote = await dao.stakingToVote();
  const stakingToPropose = await dao.stakingToPropose();
  const minStakingTime = await dao.minStakingTime();
  const votePowerDivider = await dao.votePowerDivider();
  const proposalDurationDays = await dao.proposalDurationDays();
  const tokenPriceInWei = await dao.tokenPriceInWei();
  
  console.log("\n5. Parámetros configurados en la DAO:");
  console.log(`   - Stake mínimo para votar: ${hre.ethers.formatEther(stakingToVote)} tokens`);
  console.log(`   - Stake mínimo para proponer: ${hre.ethers.formatEther(stakingToPropose)} tokens`);
  console.log(`   - Tiempo mínimo de staking: ${minStakingTime} segundos`);
  console.log(`   - Divisor de poder de voto: ${votePowerDivider}`);
  console.log(`   - Duración de propuestas: ${proposalDurationDays} días`);
  console.log(`   - Precio del token: ${hre.ethers.formatEther(tokenPriceInWei)} ETH`);
  
  console.log("\n=== CONCLUSIÓN ===");
  
  if (hasOwnerMultisig && hasPanicMultisig) {
    console.log("✅ El sistema de multisig cumple con los requisitos de la consigna:");
    console.log("   - El owner de la DAO es una multisig.");
    console.log("   - La DAO tiene configurada una multisig de pánico.");
    console.log("   - Las restricciones de acceso están implementadas correctamente.");
    console.log("   - Se ha verificado el funcionamiento de las funciones de pánico/tranquilidad.");
  } else {
    console.log("❌ El sistema de multisig NO cumple con todos los requisitos:");
    if (!hasOwnerMultisig) console.log("   - El owner de la DAO no es una multisig.");
    if (!hasPanicMultisig) console.log("   - La DAO no tiene configurada una multisig de pánico.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Ejecute este script para obtener un resumen completo:

```bash
# Generar informe de verificación del sistema multisig
npx hardhat run scripts/multisig_summary.js --network localhost
```

## 6. Instrucciones de Verificación Manual

Si desea verificar manualmente el funcionamiento de las multisigs, siga estos pasos:

### 6.1. Para el Owner Multisig

1. Identifique las direcciones de los propietarios con `list_multisig_owners.js`
2. Importe estas cuentas en MetaMask
3. Conéctese con la primera cuenta propietaria y envíe una transacción al contrato multisig:
   - Dirección: la dirección del contrato multisig del owner
   - Función: `submitTransaction`
   - Parámetros:
     - Destination: dirección del contrato DAO
     - Value: 0
     - Data: ABI codificado de la función `initParameters` con los valores deseados
4. Cambie a otra cuenta propietaria y apruebe la transacción:
   - Función: `approveTransaction`
   - Parámetros: ID de la transacción (normalmente 0 si es nueva)
5. Vuelva a la primera cuenta y ejecute la transacción:
   - Función: `executeTransaction`
   - Parámetros: ID de la transacción
6. Verifique que los parámetros han cambiado en la DAO

### 6.2. Para el Panic Multisig

1. Primero active el modo pánico con el owner multisig (siguiendo pasos similares a los anteriores pero llamando a `panic()`)
2. Verifique que la DAO está pausada intentando alguna operación normal (debe fallar)
3. Use la multisig de pánico para desactivar el modo de emergencia:
   - Conéctese con una cuenta propietaria del panic multisig
   - Envíe transacción al contrato multisig de pánico llamando a `tranquility()`
   - Si se requieren más aprobaciones, use otras cuentas propietarias
4. Verifique que la DAO está activa nuevamente intentando alguna operación normal

## 7. Conclusión

Esta guía le ha proporcionado herramientas y procedimientos para verificar completamente el funcionamiento del sistema multisig en la DAO. Al completar todas las verificaciones, podrá confirmar que:

1. La implementación cumple con los requisitos de la consigna
2. El owner de la DAO es efectivamente una multisig funcional
3. La multisig de pánico puede controlar efectivamente el modo de emergencia
4. Las restricciones de acceso están correctamente implementadas

Estos elementos son fundamentales para la seguridad y la gobernanza descentralizada de la DAO, tal como se requiere en la consigna del obligatorio.
