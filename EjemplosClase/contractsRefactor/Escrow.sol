// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./OrtToken.sol";

contract Escrow {

    address public immutable p1;
    address public immutable p2;
    uint public immutable deadline;
    bool public p1Deposit;
    bool public p2Deposit;
    uint public immutable valueEth;
    uint public immutable valueToken;
    IERC20 public immutable token;
    bool public executed;

    event EthDeposited(address from, uint amount);
    event TokenDeposited(address from, uint amount);
    event EscrowExecuted();

    modifier notExecuted() {
        require(!executed, "el escrow ya se ejecuto");
        _;
    }


    constructor (address _p1, address _p2, uint _days, uint _valueEth, uint _valueToken, address _token) {
        require(_valueEth > 0, "Debe ser positivo");
        require(_valueToken > 0, " Debe ser positivo");
        require(_days >0, "debe ser positivo");
        p1 = _p1;
        p2 = _p2;
        deadline = block.timestamp + (_days * 1 days);
        valueEth = _valueEth;
        valueToken = _valueToken;
        token = IERC20(_token);
    }

    function depositEth() external payable notExecuted {
        require(msg.sender == p1, "depositario invalido");
        require(!p1Deposit, "el monto ya fue depositado");
        require(valueEth == msg.value, "valor de eth incorrecto");
        require(block.timestamp < deadline, "el escrow ya no esta activo");

        p1Deposit = true;

        emit EthDeposited(msg.sender, msg.value);

        if (p2Deposit) executeEscrow();
    }

    function depositToken() external notExecuted {
        require(msg.sender == p2, "depositario invalido");
        require(!p2Deposit, "el monto ya fue depositado");
        require(block.timestamp < deadline, "el escrow ya no esta activo");
        require(token.balanceOf(msg.sender) >= valueToken, "el usuario no tiene suficiente balance");

        token.transferFrom(msg.sender, address(this), valueToken);
        p2Deposit = true;

        emit TokenDeposited(msg.sender, valueToken);

        if (p1Deposit) executeEscrow();
    }

    function executeEscrow() internal {
        require(p1Deposit, "no se deposito eth");
        require(p2Deposit, "no se deposito tokens");

        executed = true;

        (bool sent, ) = p2.call{value: valueEth}("");
        require(sent, "No se pudo transferir eth");

        token.transfer(p1, valueToken);

        emit EscrowExecuted();
    }

}