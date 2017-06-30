let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MSP = artifacts.require("MSP");
let ReferalsTokenHolder = artifacts.require("ReferalsTokenHolder");
let FinalizableMock = artifacts.require("FinalizableMock");

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
    msp.generateTokens(accounts[1], 100000000000000000000);
    contribution = await FinalizableMock.new();
    msp.changeController(contribution.address);
  });

  it("Referals can't spread tokens before the contribution finalizes", async () => {
    await assertFail(async () => {
      await referals.spread([accounts[0]], [1000]);
    });
  });

  it("Referals can spread tokens after the contribution finalizes", async () => {
    console.log('hi')
    await contribution.finalize()
    console.log('hi')
    console.log(await msp.transfersEnabled());
    await msp.transfer(accounts[0], 1000, {from: accounts[1]});
    console.log('hi')
    await referals.spread([accounts[0]], [1000]);
    console.log('hi')
    assert.equal((await msp.balanceOf(accounts[0])).toNumber(), 1000);
  });
});
