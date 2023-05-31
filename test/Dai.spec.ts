import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Dai, Dai__factory } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseUnits } from 'ethers/lib/utils';

describe('Dai', function () {
  let dai: Dai;

  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user: SignerWithAddress;

  const v100000 = parseUnits('100000', 18);
  const v5000 = parseUnits('5000', 18);

  beforeEach(async () => {
    [owner, minter, user] = await ethers.getSigners();

    const Dai: Dai__factory = (await ethers.getContractFactory('Dai', owner)) as Dai__factory;
    dai = await Dai.connect(owner).deploy(v100000);
    await dai.deployed();
  });

  describe('constructor', () => {
    it('Should check the initial supply', async () => {
      // Check the total supply
      const totalSupply = await dai.totalSupply();
      expect(totalSupply).to.equal(v100000);
    });
  });

  describe('#mint', () => {
    it('Should allow the minter to mint tokens', async () => {
      // Set the minter address
      await dai.setMinterAddress(minter.address);

      // Mint some tokens to the user
      const amountToMint = v5000;
      await dai.connect(minter).mint(user.address, amountToMint);

      // Check the user's balance
      const userBalance = await dai.balanceOf(user.address);
      expect(userBalance).to.equal(amountToMint);
    });

    it('Should not allow a non-minter to mint tokens', async () => {
      // Try to mint some tokens as a non-minter
      await expect(dai.connect(user).mint(user.address, v5000)).to.be.revertedWith(
        'Only minter can call this method'
      );
    });
  });

  describe('#setMinterAddress', () => {
    it('Should allow the owner to change the minter', async () => {
      // Set the minter address
      await dai.setMinterAddress(minter.address);

      // Check the minter's address
      const minter_address = await dai.minter();
      expect(minter_address).to.equal(minter.address);
    });

    it('Should not allow the non-owner to change the minter', async () => {
      // Set the minter address
      await expect(dai.connect(user).setMinterAddress(minter.address)).to.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
  });
});
