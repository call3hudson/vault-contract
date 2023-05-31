// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IDai.sol";

contract Vault is ERC20 {
    using SafeERC20 for IDai;

    uint256 public constant REWARD = 1e19;
    IDai public immutable dai;
    uint256 public lastBlockNumber;
    
    event Deposited(address indexed sender, uint amountDeposited, uint amountRewarded);
    
    event Withdrawn(address indexed sender, uint amountWithdrawn, uint amountBurned);
    
    modifier greaterThanZero(uint256 value) {
        require(value > 0, "Input value must be greater than zero");
        _;
    }

    constructor(IDai dai_) ERC20("Dai Vault", "vDai") {
        dai = dai_;
    }

    // Deposit Dai token and earn vDai token
    function deposit(uint256 tokenAmount) greaterThanZero(tokenAmount)  external {
        _mintReward();

        // Keep the current Dai amount of vault inside
        uint256 totalAmount = dai.balanceOf(address(this));

        // Transfer Dai token to vault
        dai.safeTransferFrom(msg.sender, address(this), tokenAmount);

        uint256 amountToMint;
        if (totalSupply() > 0)
            amountToMint = totalSupply() * tokenAmount / totalAmount;
        else
            // In this case, sender will earn vDai at the default rate
            amountToMint = tokenAmount;

        _mint(msg.sender, amountToMint); 

        emit Deposited(msg.sender, tokenAmount, amountToMint);
    }

    // Burn vDai token and withdraw Dai token
    function withdraw(uint256 tokenAmount) greaterThanZero(tokenAmount) external {
        require(balanceOf(msg.sender) >= tokenAmount, "Not enough vDai");
        _mintReward();

        uint256 totalAmount = dai.balanceOf(address(this));
        uint256 totalSupply = totalSupply();

        // Burn vDai
        _burn(msg.sender, tokenAmount);

        // Withdraw the deposited token immediately
        uint256 amountToWithdraw = totalAmount * tokenAmount / totalSupply;
        dai.safeTransfer(msg.sender, amountToWithdraw);

        emit Withdrawn(msg.sender, amountToWithdraw, tokenAmount);
    }

    // Mint accumulated token
    function _mintReward() internal {         
        // Calculate the amount of Dai
        uint256 accumulated = (block.number - lastBlockNumber) * REWARD;
        lastBlockNumber = block.number;

        // You don't need to pay if nobody deposits
        if (totalSupply() == 0)
            return;

        // Mint accumulated Dai from contract
        dai.mint(address(this), accumulated);
    }
}