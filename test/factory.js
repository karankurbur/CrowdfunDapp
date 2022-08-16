const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundrFactory", function () {
  let contract;
  let owner;
  let account1;
  let account2;
  before(async function () {
    [owner, account1, account2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("CrowdfundrFactory");
    contract = await Factory.deploy();
    await contract.deployed();
  });

  // TODO: create test that creates multiple instances and interacts

  it("Should create a crowdfundr contract and get its contract address by index", async function () {
    await contract.createInstance(5);
    const crowdfundrContractAddress = await contract.getCreatedContractByIndex(
      0
    );
    expect(crowdfundrContractAddress).to.not.equal(null);

    const CrowdFundContract = await ethers.getContractFactory("Crowdfundr");
    const crowdfundContract = await CrowdFundContract.attach(
      crowdfundrContractAddress
    );
    expect(await crowdfundContract.owner()).to.equal(owner.address);
  });

  it("Create multiple crowdfundr contracts and check constructor params", async function () {
    await contract.connect(account1).createInstance(5);
    await contract.connect(account2).createInstance(10);

    const contract1 = await contract.getCreatedContractByIndex(0);
    const contract2 = await contract.getCreatedContractByIndex(1);

    const CrowdFundContract = await ethers.getContractFactory("Crowdfundr");
    const crowdfundContract1 = await CrowdFundContract.attach(contract1);
    const crowdfundContract2 = await CrowdFundContract.attach(contract2);

    expect(await crowdfundContract1.owner()).to.equal(account1.address);
    expect(await crowdfundContract2.owner()).to.equal(account2.address);
    expect(await crowdfundContract1.goal()).to.equal(
      ethers.utils.parseUnits("5")
    );
    expect(await crowdfundContract2.goal()).to.equal(
      ethers.utils.parseUnits("10")
    );
  });
});
