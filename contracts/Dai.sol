// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IDai.sol";

contract Dai is Ownable, ERC20, IDai {
    address public minter;
    
    event MinterChanged(address indexed minter);

    modifier onlyMinter {
        require(msg.sender == minter, "Only minter can call this method");
        _;
    }

    constructor(uint256 initialSupply) ERC20("Dai Stablecoin", "Dai") {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) external override onlyMinter{
        _mint(to, amount);
    }
    
    function setMinterAddress(address minter_) external onlyOwner {
        minter = minter_;
        emit MinterChanged(minter);
    }
}