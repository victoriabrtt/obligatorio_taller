// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MiToken is ERC20 {
    /**
     * @dev Constructor que asigna todos los tokens al creador del contrato
     * Se crean 1,000,000 tokens con 18 decimales
     */
    constructor() ERC20("MiToken", "MTK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
