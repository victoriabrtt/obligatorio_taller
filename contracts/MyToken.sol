// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev Implementación del token de gobernanza para la DAO.
 * Extiende el estándar ERC20 de OpenZeppelin y utiliza el control de acceso Ownable.
 * Este token es utilizado para staking y votación en la plataforma DAO.
 */
contract MyToken is ERC20, Ownable {
    /**
     * @dev Constructor que inicializa el token con nombre "MyToken" y símbolo "MTK".
     * No se mintean tokens inicialmente, deben ser creados explícitamente por el owner.
     */
    constructor() ERC20("MyToken", "MTK") {}

    /**
     * @dev Permite al owner crear nuevos tokens y asignarlos a una dirección.
     * @param to La dirección que recibirá los tokens minteados.
     * @param amount La cantidad de tokens a mintear (en unidades completas, no wei).
     * @notice Solo el propietario del contrato puede llamar esta función.
     * @notice El monto se expresa en la unidad más pequeña del token (wei para 18 decimales).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
