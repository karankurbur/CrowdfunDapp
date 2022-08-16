const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfundr", function () {
  let contract;
  let owner;
  let account1;
  let account2;

  const resetContract = async () => {
    [owner, account1, account2] = await ethers.getSigners();
    const Crowdfundr = await ethers.getContractFactory("Crowdfundr");
    const crowdfundr = await Crowdfundr.deploy(
      owner.address,
      ethers.utils.parseUnits("200")
    );
    await crowdfundr.deployed();
    contract = crowdfundr;
  };

  const goPastTimeLimit = async () => {
    const thiryFiveDays = 35 * 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [thiryFiveDays]);
    await ethers.provider.send("evm_mine");
  };

  const checkNFTBalance = async (address, amount) => {
    const balance = await contract.balanceOf(address);
    expect(amount).to.equal(balance);
  };

  const getBalance = async (address) => {
    const balance = await ethers.provider.getBalance(address);
    const etherBalance = parseInt(ethers.utils.formatEther(balance), 10);
    return etherBalance;
  };

  // Checks if address is near th expectedBalance by 1 ETH
  // Accounts for gas
  const checkAddressBalance = async (address, expectedBalance) => {
    const etherBalance = await getBalance(address);
    expect(Math.abs(expectedBalance - etherBalance)).to.be.lessThanOrEqual(1);
  };

  describe("Owner Cancel", function () {
    beforeEach(async function () {
      await resetContract();
    });

    it("should allow owner to cancel when goal is not met and fundraise has not failed", async function () {
      await contract.cancelFundraise();
      expect(await contract.cancelled()).to.equal(true);
    });

    it("should fail allow owner to cancel when goal is met", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("250") });
      await expect(contract.cancelFundraise()).to.be.revertedWith(
        "contribution limit is met"
      );
    });

    it("should fail allow owner to cancel when fundraise has failed", async function () {
      await goPastTimeLimit();
      await expect(contract.cancelFundraise()).to.be.revertedWith(
        "crowdfund timelimit is over"
      );
    });

    it("should fail allow a non-owner to cancel", async function () {
      await expect(
        contract.connect(account1).cancelFundraise()
      ).to.be.revertedWith("not owner");
    });
  });

  describe("Owner Withdrawals", function () {
    let ownerBalance;

    beforeEach(async function () {
      await resetContract();
      ownerBalance = await getBalance(owner.address);
    });

    it("should allow an owner to withdraw when a fundraise has been successful", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("350") });
      await contract.ownerWithdraw(ethers.utils.parseUnits("150"));
      await checkAddressBalance(contract.address, 200);
      await checkAddressBalance(owner.address, ownerBalance + 150);
    });

    it("should allow an owner to withdraw multiple times when a fundraise has been successful", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("350") });
      await contract.ownerWithdraw(ethers.utils.parseUnits("50"));
      await checkAddressBalance(contract.address, 300);
      await checkAddressBalance(owner.address, ownerBalance + 50);
      await contract.ownerWithdraw(ethers.utils.parseUnits("50"));
      await checkAddressBalance(contract.address, 250);
      await checkAddressBalance(owner.address, ownerBalance + 100);
    });

    it("should revert when an owner tries to withdraw more than the contract balance", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("350") });
      await expect(
        contract.ownerWithdraw(ethers.utils.parseUnits("450"))
      ).to.be.revertedWith("withdrawal over contributions");
    });

    it("should revert when an owner tries to withdraw when cancelled", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("150") });
      await contract.cancelFundraise();
      await expect(
        contract.ownerWithdraw(ethers.utils.parseUnits("150"))
      ).to.be.revertedWith("crowdfund cancelled");
    });

    it("should revert when an owner tries to withdraw when failed", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("150") });
      await goPastTimeLimit();
      await expect(
        contract.ownerWithdraw(ethers.utils.parseUnits("150"))
      ).to.be.revertedWith("crowdfund timelimit is over");
    });

    it("should revert when an owner tries to withdraw when contribution limit is not met", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("150") });
      await expect(
        contract.ownerWithdraw(ethers.utils.parseUnits("150"))
      ).to.be.revertedWith("contribution limit not met");
    });

    it("should fail allow a non-owner to withdraw", async function () {
      await expect(
        contract.connect(account1).ownerWithdraw(ethers.utils.parseUnits("150"))
      ).to.be.revertedWith("not owner");
    });
  });

  describe("Contributor Withdrawals", function () {
    let account1Balance;

    beforeEach(async function () {
      await resetContract();
      account1Balance = await getBalance(account1.address);
    });

    it("should allow a contributor to withdraw when a fundraise has been cancelled", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("50") });
      await contract.cancelFundraise();
      await contract.connect(account1).contributorWithdraw();
      await checkAddressBalance(contract.address, 0);
      expect(await contract.getContribution(account1.address)).to.equal(0);
      await checkAddressBalance(account1.address, account1Balance);
    });

    it("should allow a contributor to withdraw when a fundraise has failed", async function () {
      await contract
        .connect(account1)
        .contribute({ value: ethers.utils.parseUnits("50") });
      await goPastTimeLimit();
      await contract.connect(account1).contributorWithdraw();
      expect(await contract.getContribution(account1.address)).to.equal(0);
      await checkAddressBalance(account1.address, account1Balance);
    });
  });

  describe("Contributor Deposits", function () {
    let account1Balance;
    let account2Balance;

    beforeEach(async function () {
      await resetContract();
      account1Balance = await getBalance(account1.address);
      account2Balance = await getBalance(account2.address);
    });

    it("should allow contributions from multiple accounts", async function () {
      const contributionAmount = ethers.utils.parseUnits("50");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });
      expect(await contract.getContribution(account1.address)).to.equal(
        contributionAmount
      );

      await checkAddressBalance(account1.address, account1Balance - 50);

      await contract
        .connect(account2)
        .contribute({ value: contributionAmount });
      expect(await contract.getContribution(account2.address)).to.equal(
        contributionAmount
      );

      await checkAddressBalance(account2.address, account2Balance - 50);
    });

    it("should allow a contribution when the goal is not met, fundraise is not cancelled, and when time limit is not met", async function () {
      const contributionAmount = ethers.utils.parseUnits("50");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });
      expect(await contract.getContribution(account1.address)).to.equal(
        contributionAmount
      );
      await checkAddressBalance(account1.address, account1Balance - 50);
    });

    it("should allow a contribution that completes the goal", async function () {
      const contributionAmount = ethers.utils.parseUnits("250");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });
      expect(await contract.getContribution(account1.address)).to.equal(
        contributionAmount
      );
      await checkAddressBalance(account1.address, account1Balance - 250);
    });

    it("should not allow a contribution after the goal has been met", async function () {
      const contributionAmount = ethers.utils.parseUnits("250");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });
      await expect(
        contract.connect(account1).contribute({ value: contributionAmount })
      ).to.be.revertedWith("contribution limit is met");
      await checkAddressBalance(account1.address, account1Balance - 250);
    });

    it("should not allow a contribution if it has been cancelled", async function () {
      const contributionAmount = ethers.utils.parseUnits("250");
      await contract.cancelFundraise();
      await expect(
        contract.connect(account1).contribute({ value: contributionAmount })
      ).to.be.revertedWith("crowdfund cancelled");
      await checkAddressBalance(account1.address, account1Balance);
    });

    it("should not allow a contribution after the time limit has been met", async function () {
      const contributionAmount = ethers.utils.parseUnits("250");
      await goPastTimeLimit();
      await expect(
        contract.connect(account1).contribute({ value: contributionAmount })
      ).to.be.revertedWith("crowdfund timelimit is over");
      await checkAddressBalance(account1.address, account1Balance);
    });
  });

  describe("NFT", function () {
    beforeEach(async function () {
      await resetContract();
    });

    it("should mint an 100 NFT after a 100 ETH contribution", async function () {
      const contributionAmount = ethers.utils.parseUnits("100");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await checkNFTBalance(account1.address, 100);
    });

    it("should mint 4 NFTs after a 4.5 ETH contribution", async function () {
      const contributionAmount = ethers.utils.parseUnits("4");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await checkNFTBalance(account1.address, 4);
    });

    it("should mint 3 NFTs after two 1.5 ETH contributions", async function () {
      const contributionAmount = ethers.utils.parseUnits("1.5");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await checkNFTBalance(account1.address, 1);
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await checkNFTBalance(account1.address, 3);
    });
  });

  describe("Helper Functions", function () {
    beforeEach(async function () {
      await resetContract();
    });

    it("should time limit not over after 7 days", async function () {
      const thiryFiveDays = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [thiryFiveDays]);
      await ethers.provider.send("evm_mine");
      expect(await contract.timeLimitOver()).to.equal(false);
    });

    it("should time limit over after 35 days", async function () {
      await goPastTimeLimit();
      expect(await contract.timeLimitOver()).to.equal(true);
    });

    it("should say goal is met after 350 ETH contribution", async function () {
      const contributionAmount = ethers.utils.parseUnits("350");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await goPastTimeLimit();
      expect(await contract.goalMet()).to.equal(true);
    });

    it("should say goal is not met after 150 ETH contribution", async function () {
      const contributionAmount = ethers.utils.parseUnits("150");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await goPastTimeLimit();
      expect(await contract.goalMet()).to.equal(false);
    });

    it("should say fundraise failed after time limit and under 200 ETH", async function () {
      const contributionAmount = ethers.utils.parseUnits("150");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await goPastTimeLimit();
      expect(await contract.failed()).to.equal(true);
    });

    it("should say fundraise not failed after 250 ETH contribution", async function () {
      const contributionAmount = ethers.utils.parseUnits("250");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });
      expect(await contract.failed()).to.equal(false);
    });

    it("should get contribution for multiple accounts", async function () {
      const contributionAmount = ethers.utils.parseUnits("150");
      await contract
        .connect(account1)
        .contribute({ value: contributionAmount });

      await contract
        .connect(account2)
        .contribute({ value: contributionAmount });

      expect(await contract.getContribution(account1.address)).to.equal(
        contributionAmount
      );
      expect(await contract.getContribution(account2.address)).to.equal(
        contributionAmount
      );
    });
  });
});
