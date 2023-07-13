# Vault

```shell
Develop yield farming smart contract.

Flow.
1. Users deposit ETH, then get yETH token as a receipt.
2. The deposited ETH will be deposited Idle finance to generate yield.

Spec.
1. There are two contracts - Vault, and Strategy.
2. Users deposit ETH on Vault contract.
3. There is `invest` function in Vault contract, and it move 90% of total deposited funds to strategy contract, and strategy contract deposit them to Idle finance.
4. When withdraw from the vault, if the ETH balance of vault is lower than withdrawal amount, then it automatically withdraw required amount from strategy.

Requirements.
1. Develop vault, and strategy contract
2. write unit test and mainnet forking test
```

This project demonstrates a basic Vault(Not EIP4626).

Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat coverage
```
