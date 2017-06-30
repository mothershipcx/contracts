let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MiniMeToken = artifacts.require("MiniMeToken");
let MSP = artifacts.require("MSP");

let miniMeTokenFactory;
let msp;

contract("MSP", function(accounts) {
  beforeEach(async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
    msp = await MSP.new(miniMeTokenFactory.address, { from: accounts[0] });
    await msp.enableTransfers(true, { from: accounts[0] });
    msp.generateTokens(accounts[0], 100000000000000000000);
  });

  it("A cloned Token will keep the original Token's transaction history", async () => {
    await msp.transfer(accounts[1], 50000000000000000000);

    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the transfer"
    );

    let msp2 = MSP.at(
      (await msp.createCloneToken(
        "Mothership Token Clone",
        18,
        "MSPC",
        web3.eth.blockNumber,
        true
      )).logs[0].args._cloneToken
    );

    assert.equal(
      (await msp2.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the clone process"
    );

    assert.equal(
      (await msp2.balanceOf.call(accounts[1])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the second account after the clone process"
    );

    assert.equal(
      await msp2.name.call(),
      "Mothership Token Clone",
      "Mothership Token Clone isn't the cloned token's name."
    );

    assert.equal(
      await msp2.symbol.call(),
      "MSPC",
      "MSPC isn't the cloned token's symbol."
    );

    assert.equal(
      (await msp2.decimals.call()).toNumber(),
      18,
      "18 isn't the cloned token's decimals"
    );
  });

  it("A cloned Token can be cloned whithout the calling createCloneToken", async () => {
    await msp.transfer(accounts[1], 50000000000000000000);

    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the transfer"
    );

    let msp2 = await MiniMeToken.new(
      miniMeTokenFactory.address,
      msp.address,
      web3.eth.blockNumber,
      "Mothership Token Clone",
      18,
      "MSPC",
      true
    );

    assert.equal(
      (await msp2.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the clone process"
    );

    assert.equal(
      (await msp2.balanceOf.call(accounts[1])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the second account after the clone process"
    );

    assert.equal(
      await msp2.name.call(),
      "Mothership Token Clone",
      "Mothership Token Clone isn't the cloned token's name."
    );

    assert.equal(
      await msp2.symbol.call(),
      "MSPC",
      "MSPC isn't the cloned token's symbol."
    );

    assert.equal(
      (await msp2.decimals.call()).toNumber(),
      18,
      "18 isn't the cloned token's decimals"
    );
  });
});
