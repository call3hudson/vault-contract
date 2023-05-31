// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDai is IERC20 {
    function mint(address to, uint256 amount) external;
}
