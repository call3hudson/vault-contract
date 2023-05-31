import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Dai, Vault, Dai__factory, Vault__factory } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseUnits } from 'ethers/lib/utils';

describe('Vault', function () {
  let vault: Vault;
  let dai: Dai;

  let owner: SignerWithAddress;
  let user0: SignerWithAddress;
  let user1: SignerWithAddress;

  const v100000 = parseUnits('100000', 18);
  const v1050 = parseUnits('1050', 18);
  const v1000 = parseUnits('1000', 18);
  const v595 = parseUnits('595', 18);
  const v545 = parseUnits('545', 18);
  const v520 = parseUnits('520', 18);
  const v500 = parseUnits('500', 18);
  const v100 = parseUnits('100', 18);
  const v10 = parseUnits('10', 18);
  const v0 = parseUnits('0', 18);

  beforeEach(async () => {
    [owner, user0, user1] = await ethers.getSigners();

    const Dai: Dai__factory = (await ethers.getContractFactory('Dai', owner)) as Dai__factory;
    dai = await Dai.connect(owner).deploy(v100000);
    await dai.deployed();

    const Vault: Vault__factory = (await ethers.getContractFactory(
      'Vault',
      owner
    )) as Vault__factory;
    vault = await Vault.connect(owner).deploy(dai.address);
    await vault.deployed();

    await dai.setMinterAddress(vault.address);
    await dai.transfer(user0.address, v1000);
    await dai.transfer(user1.address, v1000);
  });

  describe('constructor', () => {
    it('Should check the initial supply', async () => {
      // Check the total supply
      const dai_address = await vault.dai();
      expect(dai_address).to.equal(dai.address);
    });
  });

  describe('#deposit', () => {
    it('Should revert if no token was deposited', async () => {
      await expect(vault.connect(user0).deposit(0)).to.revertedWith(
        'Input value must be greater than zero'
      );
    });

    it('Single deposit', async () => {
      await dai.connect(user0).approve(vault.address, v1000);
      await expect(vault.connect(user0).deposit(v1000))
        .to.emit(vault, 'Deposited')
        .withArgs(user0.address, v1000, v1000); // Rate's set as the amount depositing token so the outcome must be 1000
    });

    it('Multiple deposits', async () => {
      await dai.connect(user0).approve(vault.address, v1000);

      const pastBlock = await ethers.provider.getBlockNumber();
      await expect(vault.connect(user0).deposit(v1000))
        .to.emit(vault, 'Deposited')
        .withArgs(user0.address, v1000, v1000); // Rate's set as the amount depositing token so the outcome must be 1000

      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);

      await dai.connect(user1).approve(vault.address, v500);
      const currentBlock = await ethers.provider.getBlockNumber();
      await expect(vault.connect(user1).deposit(v100))
        .to.emit(vault, 'Deposited')
        .withArgs(
          user1.address,
          v100,
          v100.mul(v1000).div(v1000.add(v10.mul(currentBlock - pastBlock)))
        ); // expected vDai = deposited Dai * total vDai supply / (original Dai supply + 10 * blockPassed)
    });
  });

  describe('#withdraw', () => {
    it('Should revert if zero token is to be withdrawn', async () => {
      await expect(vault.connect(user0).withdraw(v0)).to.revertedWith(
        'Input value must be greater than zero'
      );
    });

    it('Should revert if token amount exceeds current supply', async () => {
      await dai.connect(user0).approve(vault.address, v100);
      await vault.connect(user0).deposit(v100);
      await expect(vault.connect(user0).withdraw(v500)).to.revertedWith('Not enough vDai');
    });

    it('Full withdraw', async () => {
      await dai.connect(user0).approve(vault.address, v1000);
      await vault.connect(user0).deposit(v1000);

      /* After 5 block */
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);

      await expect(vault.connect(user0).withdraw(v1000))
        .to.emit(vault, 'Withdrawn')
        .withArgs(user0.address, v1050, v1000);
    });

    it('Double withdraw', async () => {
      await dai.connect(user0).approve(vault.address, v500);
      await vault.connect(user0).deposit(v500);

      /* To make the reward same as user0 */
      await dai.connect(user1).approve(vault.address, v520);
      await vault.connect(user1).deposit(v520);

      /* After 5 block */
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);

      await expect(vault.connect(user0).withdraw(v500))
        .to.emit(vault, 'Withdrawn')
        .withArgs(user0.address, v545, v500);

      /* After another 5 block */
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);
      await ethers.provider.send('evm_mine', []);

      await expect(vault.connect(user1).withdraw(v500))
        .to.emit(vault, 'Withdrawn')
        .withArgs(user1.address, v595, v500);
    });
  });
});
