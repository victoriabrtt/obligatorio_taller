// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IERC20 {
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);
}

contract OrtToken is IERC20 {

    string constant public NAME = "Ort Token";
    string constant public SYMBOL = "ORT";
    uint8 constant public DECIMALS = 18;
    uint constant public TOTAL_SUPPLY = 10000**18;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowences;

    constructor() {
        balances[msg.sender] = TOTAL_SUPPLY;
    }

    function name() external pure returns (string memory) {
        return NAME;
    }

    function symbol() external pure returns (string memory) {
        return SYMBOL;
    }

    function decimals() external pure returns (uint8) {
        return DECIMALS;
    }

    function totalSupply() external pure returns (uint256) {
        return TOTAL_SUPPLY;
    }

    function balanceOf(address _owner) external view returns (uint256 balance) {
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value) external returns (bool success){
        require(_value > 0, "Cantidad debe ser mayor a 0");
        require(balances[msg.sender] >= _value, "Sin suficiente balance");
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success) {
        require(_value > 0, "Cantidad debe ser mayor a 0");
        require(balances[_from] >= _value, "Sin suficiente balance");
        require(allowences[_from][msg.sender] <= _value, "No tiene permitido");
        balances[_from] -= _value;
        balances[_to] += _value;
        allowences[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        require(_value >= 0, "Invalid value;");
        allowences[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) external view returns (uint256 remaining) {
        return allowences[_owner][_spender];
    }

}