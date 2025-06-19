// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Escrow {

    address public participant1;
    address public participant2;
    uint public expirationInDays;
    uint public valueEthP1;
    uint public valueTokenP2;
    bool public ethDeposited;
    bool public tokensDeposited;

    constructor(address _p1, uint _v1, address _p2, uint _v2, uint _days) {
        require(_v1 > 0, "Invalid Value Eth;");
        require(_v2 > 0, "Invalid Value Token;");
        participant1 = _p1;
        participant2 = _p2;
        expirationInDays = _days;
        valueEthP1 = _v1;
        valueTokenP2 = _v2;
    }

    function depositEth() public payable {
        require(msg.value == valueEthP1, "Insufficient Funds!");

        // sabemos que p1 deposito v1 en eth
        // chequear que p2 deposito v2 de OrtTokens: 2 opciones
        // atributo bool en estado de contrato
        // ejecutar balanceOf del address de Escrow en el contrato de OrtToken

        ethDeposited = true;
        if (tokensDeposited) {
            // ejecuta escrow
        }
    }

}