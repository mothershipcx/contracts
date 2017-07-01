let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let LeanContribution = artifacts.require("LeanContribution");
let MSP = artifacts.require("MSP");

const assertFail = require("./helpers/assertFail");

let msp;
let contribution;

contract("MSP", function(accounts) {
  beforeEach(async () => {
    let miniMeTokenFactory = await MiniMeTokenFactory.new({
      from: accounts[0]
    });
    msp = await MSP.new(miniMeTokenFactory.address, { from: accounts[0] });
    await msp.enableTransfers(true, { from: accounts[0] });
    msp.generateTokens(accounts[0], 50100);
    msp.generateTokens(accounts[1], 50100);
    contribution = await LeanContribution.new();
  });

  it("Controler and only controler can burn", async () => {
    assert.equal((await msp.balanceOf.call(accounts[0])).toNumber(), 50100);
    await msp.destroyTokens(accounts[0], 100);
    assert.equal((await msp.balanceOf.call(accounts[0])).toNumber(), 50000);

    await msp.changeController(contribution.address);
    await msp.changeBurner(accounts[1]);
    await contribution.initialize(msp.address);

    await assertFail(async () => {
      await msp.destroyTokens(accounts[0], 50000);
    });
    assert.equal((await msp.balanceOf.call(accounts[0])).toNumber(), 50000);
  });

  it("Burner can also burn it's own tokens", async () => {
    await msp.changeController(contribution.address);
    await contribution.initialize(msp.address);

    await msp.destroyTokens(accounts[0], 50100);
    assert.equal((await msp.balanceOf.call(accounts[0])).toNumber(), 0);

    await assertFail(async () => {
      await msp.destroyTokens(accounts[1], 50100);
    });
    assert.equal((await msp.balanceOf.call(accounts[1])).toNumber(), 50100);
  });
});
