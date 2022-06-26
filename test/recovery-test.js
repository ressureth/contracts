const { expect } = require("chai");
const { ethers } = require("hardhat");

let Recovery, recovery, Factory, factory, account1, account2;
const PASSWORD = "password123";
const HASHED_PASSWORD = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(PASSWORD)
);

beforeEach(async () => {
  [account1, account2] = await ethers.getSigners();
  Factory = await ethers.getContractFactory("Factory");
  factory = await Factory.connect(account1).deploy();
  await factory.deployed();

  Recovery = await ethers.getContractFactory("Recovery");
  await factory.connect(account1).createRecoveryContract(HASHED_PASSWORD);
  recoveryAddress = await factory.recoveryContracts(account1.address);
  console.log("address", recoveryAddress);
  recovery = await Recovery.attach(recoveryAddress);
});

describe("Recovery", function () {
  it("Should store a hashed password to the contract", async function () {
    expect(await recovery.hashedPassword()).to.equal(HASHED_PASSWORD);
  });

  it("Should verify that password matches the hashed password", async function () {
    expect(await recovery.verifyPassword(PASSWORD)).to.be.equal(true);
  });

  it("Should store a hashed password + address to the contract", async function () {
    const HASHED_PASSWORD_ADDRESS = ethers.utils.solidityKeccak256(
      ["string", "string"],
      [PASSWORD, account2.address]
    );
    await recovery.commitLockHash(HASHED_PASSWORD_ADDRESS);
    expect(await recovery.lockHashes(HASHED_PASSWORD_ADDRESS)).to.not.equal(0);
  });

  it("Should verify that password and address matches the locked hash", async function () {
    const HASHED_PASSWORD_ADDRESS = ethers.utils.solidityKeccak256(
      ["string", "address"],
      [PASSWORD, account2.address]
    );

    await recovery.commitLockHash(HASHED_PASSWORD_ADDRESS);
    expect(
      await recovery.connect(account2).verifyLockHash(PASSWORD)
    ).to.be.equal(true);
  });

  it("Should fail if passsord + address doesn't matches the locked hash", async function () {
    const HASHED_PASSWORD_ADDRESS = ethers.utils.solidityKeccak256(
      ["string", "address"],
      [PASSWORD, account2.address]
    );

    await recovery.commitLockHash(HASHED_PASSWORD_ADDRESS);
    expect(
      await recovery.connect(account1).verifyLockHash(PASSWORD)
    ).to.be.equal(false);
  });

  it("Should be able to claim ownership with the right password and address", async function () {
    const HASHED_PASSWORD_ADDRESS = ethers.utils.solidityKeccak256(
      ["string", "address"],
      [PASSWORD, account2.address]
    );

    await recovery.commitLockHash(HASHED_PASSWORD_ADDRESS);
    await recovery.connect(account2).claimOwnership(PASSWORD);
    expect(await recovery.owner()).to.be.equal(account2.address);
  });
});
