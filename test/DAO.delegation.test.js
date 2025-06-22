const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO - Delegación de votos", function () {
  async function deployDAOFixture() {
    const [owner, userA, userB] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy();
    await token.mint(userA.address, 1000);
    await token.mint(userB.address, 1000);

    const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
    const dao = await DAO.deploy(await token.getAddress());

    await dao.setOwner(owner.address);
    await dao.setPanicWallet(owner.address);
    await dao.initParameters(
      100, 
      200, 
      0,   
      1,   
      3,   
      ethers.parseEther("0.01") 
    );
    await dao.tranquility();

    // A aprueba y hace stake
    await token.mint(userA.address, 1000);
    await token.connect(userA).approve(await dao.getAddress(), 1000);
    await dao.connect(userA).stakeForVote(300);


    // B aprueba y hace stake
    await token.mint(userB.address, 1000);
    await token.connect(userB).approve(await dao.getAddress(), 1000);
    await dao.connect(userB).stakeForVote(100);

    return { dao, token, owner, userA, userB };
  }

  it("debería permitir delegar a otro usuario", async function () {
    const { dao, userA, userB } = await deployDAOFixture();

    await dao.connect(userA).delegate(userB.address);
    const delegado = await dao.delegates(userA.address);
    expect(delegado).to.equal(userB.address);
  });

  it("no debería permitir delegarse a sí mismo", async function () {
    const { dao, userA } = await deployDAOFixture();

    await expect(dao.connect(userA).delegate(userA.address))
      .to.be.revertedWith("Cannot delegate to self");
  });

  it("debería reflejar el poder delegado en getVotingPower", async function () {
    const { dao, userA, userB } = await deployDAOFixture();

    await dao.connect(userA).delegate(userB.address);

    // La función getVotingPower devuelve sqrt(power) * 1e9 / votePowerDivider
    // Como votePowerDivider es 1, debería devolver sqrt(power) * 1e9
    const powerB = await dao.getVotingPower(userB.address);
    
    // userB tiene 100 tokens staked + 300 delegados = 400
    // sqrt(400) * 1e9 = 20 * 1e9 = 20000000000
    expect(powerB).to.equal(20000000000);
  });

  it("getVotingPower debería devolver solo el stake propio si no hay delegaciones", async function () {
    const { dao, userA } = await deployDAOFixture();

    // userA tiene 300 tokens staked, sqrt(300) * 1e9 = ~17.32 * 1e9
    const power = await dao.getVotingPower(userA.address);
    // En realidad es 17320508.08... pero Solidity redondea
    expect(power).to.equal(17000000000);
  });
});
