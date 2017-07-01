let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MSP = artifacts.require("MSP");
const BigNumber = require("bignumber.js");

let miniMeTokenFactory;
let msp;

contract("MSP", function(accounts) {
  beforeEach(async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
    msp = await MSP.new(miniMeTokenFactory.address, { from: accounts[0] });
    await msp.enableTransfers(true, { from: accounts[0] });
    msp.generateTokens(accounts[0], 100000000000000000000);
    await msp.changeController("0x0");
  });

  // CREATION
  it("creation: should have imported an initial balance of 100000000000000000000 from the old Token", async () => {
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  // TRANSERS
  it("transfers: should transfer 100000000000000000000 to accounts[1] with accounts[0] having 100000000000000000000", async () => {
    watcher = msp.Transfer();
    await msp.transfer(accounts[1], 100000000000000000000, {
      from: accounts[0]
    });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args._from, accounts[0]);
    assert.equal(logs[0].args._to, accounts[1]);
    assert.equal(logs[0].args._amount.toNumber(), 100000000000000000000);
    assert.equal(await msp.balanceOf.call(accounts[0]), 0);
    assert.equal(
      (await msp.balanceOf.call(accounts[1])).toNumber(),
      100000000000000000000
    );
  });

  it("transfers: should fail when trying to transfer 100000000000000000001 to accounts[1] with accounts[0] having 100000000000000000000", async () => {
    await msp.transfer(
      accounts[1],
      new BigNumber(web3.toWei(100000000000000000001)),
      {
        from: accounts[0]
      }
    );
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  // APPROVALS
  it("approvals: msg.sender should approve 100 to accounts[1]", async () => {
    watcher = msp.Approval();
    await msp.approve(accounts[1], 100, { from: accounts[0] });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Approval");
    assert.equal(logs[0].args._owner, accounts[0]);
    assert.equal(logs[0].args._spender, accounts[1]);
    assert.strictEqual(logs[0].args._amount.toNumber(), 100);

    assert.strictEqual(
      (await msp.allowance.call(accounts[0], accounts[1])).toNumber(),
      100
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
    watcher = msp.Transfer();
    await msp.approve(accounts[1], 100, { from: accounts[0] });

    assert.strictEqual((await msp.balanceOf.call(accounts[2])).toNumber(), 0);
    await msp.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });

    var logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args._from, accounts[0]);
    assert.equal(logs[0].args._to, accounts[2]);
    assert.strictEqual(logs[0].args._amount.toNumber(), 20);

    assert.strictEqual(
      (await msp.allowance.call(accounts[0], accounts[1])).toNumber(),
      80
    );

    assert.strictEqual((await msp.balanceOf.call(accounts[2])).toNumber(), 20);
    await msp.balanceOf.call(accounts[0]);
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", async () => {
    await msp.approve(accounts[1], 100, { from: accounts[0] });
    await msp.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await msp.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await msp.allowance.call(accounts[0], accounts[1]);

    assert.strictEqual(
      (await msp.allowance.call(accounts[0], accounts[1])).toNumber(),
      60
    );

    assert.strictEqual((await msp.balanceOf.call(accounts[2])).toNumber(), 40);

    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  //should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", async () => {
    await msp.approve(accounts[1], 100, { from: accounts[0] });
    await msp.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    });
    assert.strictEqual(
      (await msp.allowance.call(accounts[0], accounts[1])).toNumber(),
      50
    );

    assert.strictEqual((await msp.balanceOf.call(accounts[2])).toNumber(), 50);

    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
    await msp.transferFrom.call(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    assert.strictEqual((await msp.balanceOf.call(accounts[2])).toNumber(), 50);
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
    await msp.transferFrom.call(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });

  it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
    await msp.approve(accounts[1], 100, { from: accounts[0] });
    await msp.transferFrom(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    await msp.approve(accounts[1], 0, { from: accounts[0] });
    await msp.transferFrom.call(accounts[0], accounts[2], 10, {
      from: accounts[1]
    });
    assert.equal(
      (await msp.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000
    );
  });
});
