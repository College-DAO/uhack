const { expect } = require("chai");
const { ethers } = require("ethers");

describe("Test 1", function() {
  it("test", async function() {
    const StudentLoan = await ethers.getContractFactory("StudentLoan");
    const loan = await StudentLoan.deploy("StudentLoan Deployed!");

    await loan.deployed();
    expect(await loan.createLoan).to.equal(0);

    await new Promise(res => setTimeout(res, 5000))
  });
});