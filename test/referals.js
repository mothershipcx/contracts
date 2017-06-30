let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MSP = artifacts.require("MSP");
let ReferalsTokenHolder = artifacts.require("ReferalsTokenHolder");
let LeanContribution = artifacts.require("LeanContribution");

const assertFail = require('./helpers/assertFail')

let miniMeTokenFactory;
let msp;
let referals;
let contribution;

contract("ReferalsTokenHolder", function(accounts) {
  beforeEach(async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
    msp = await MSP.new(miniMeTokenFactory.address, { from: accounts[0] });
    await msp.enableTransfers(true, { from: accounts[0] });
    referals = await ReferalsTokenHolder.new(msp.address);
    msp.generateTokens(referals.address, 100000000000000000000);
    contribution = await LeanContribution.new();
    msp.changeController(contribution.address);
  });

  it("Referals can't spread tokens before the contribution finalizes", async () => {
    await assertFail(async () => {
      await referals.spread([accounts[0]], [1000]);
    });
  });

  it("Referals can spread tokens after the contribution finalizes", async () => {
    await contribution.finalize()
    await referals.spread([accounts[0]], [1000]);
    assert.equal((await msp.balanceOf(accounts[0])).toNumber(), 1000);
  });
});
