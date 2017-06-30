const BigNumber = require('bignumber.js')

const MultiSigWallet = artifacts.require('MultiSigWallet')
const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
const SIT = artifacts.require('SITMock')
const MSP = artifacts.require('MSPMock')
const Contribution = artifacts.require('ContributionMock')
const ContributionWallet = artifacts.require('ContributionWallet')
const SITExchanger = artifacts.require('SITExchanger')
const MSPPlaceholder = artifacts.require('MSPPlaceholderMock')

const assertFail = require('./helpers/assertFail')

contract('Mothership tokens contribution', function(accounts) {
  const addressMothership = accounts[0]
  const addressCommunity = accounts[1]
  const addressTeam = accounts[2]
  const addressSitHolder1 = accounts[3]
  const addressSitHolder2 = accounts[4]

  let multisigMothership
  let multisigTeam
  let miniMeTokenFactory
  let sit
  let msp
  let contribution
  let contributionWallet
  let mspPlaceholder

  const startBlock = 1000000
  const endBlock = 1040000
  const totalSupply = new BigNumber(web3.toWei(200000000))
  const exchangeRate = 5000
  const minimumGoal = 10

  it('Deploys all contracts', async function() {
    multisigMothership = await MultiSigWallet.new([addressMothership], 1)
    multisigCommunity = await MultiSigWallet.new([addressCommunity], 1)
    multisigTeam = await MultiSigWallet.new([addressTeam], 1)
    // TODO create a referal bonuses withdrawal contract instead
    multisigReferals = await MultiSigWallet.new([addressTeam], 1)

    miniMeTokenFactory = await MiniMeTokenFactory.new()
    sit = await SIT.new(miniMeTokenFactory.address)
    msp = await MSP.new(miniMeTokenFactory.address)

    contribution = await Contribution.new()
    contributionWallet = await ContributionWallet.new(
      multisigMothership.address,
      endBlock,
      contribution.address,
    )

    sitExchanger = await SITExchanger.new(
      sit.address,
      msp.address,
      contribution.address,
    )

    mspPlaceholder = await MSPPlaceholder.new(
      multisigCommunity.address,
      msp.address,
      contribution.address,
      sitExchanger.address,
    )

    await msp.changeController(contribution.address)

    // Generate some SIT tokens before initializeing the contribution
    assert.isOk(await sit.generateTokens(addressSitHolder1, web3.toWei(1000)))

    await contribution.initialize(
      msp.address,
      mspPlaceholder.address,
      totalSupply,
      exchangeRate,
      minimumGoal,
      startBlock,
      endBlock,
      contributionWallet.address,
      sitExchanger.address,
      multisigTeam.address,
      multisigReferals.address, // TODO referal bonuses contract
      sit.address,
    )
  })

  it('MSP total supply and contribution limits', async function() {
    assert.equal(
      await msp.totalSupply(),
      0,
      'MSP initial total supply should be 0',
    )
    const _totalSupply = await contribution.totalSupplyCap()
    assert.isAbove(_totalSupply.toNumber(), 0)
    assert.ok(
      _totalSupply.equals(totalSupply),
      `MSP contribution total supply cap should be ${totalSupply}`,
    )
    const _totalSaleSupply = await contribution.totalSaleSupplyCap()
    assert.ok(
      _totalSaleSupply.equals(totalSupply.times(70).dividedBy(100)),
      `MSP contribution total sale supply cap should be 70% of total supply, got ${_totalSaleSupply.toNumber()}`,
    )
  })

  it('Check buying tokens, aware for oversale', async function() {
    await contribution.setMockedBlockNumber(1005000)
    await sit.setMockedBlockNumber(1005000)
    await msp.setMockedBlockNumber(1005000)

    // Buy some tokens
    await msp.sendTransaction({
      value: web3.toWei(5),
      gas: 300000,
      gasPrice: '20000000000',
    })

    // Buying tokens should affect total supply counters
    const _totalSupply = await msp.totalSupply()
    const _totalSold = await contribution.totalSold()
    assert.isAbove(_totalSupply.toNumber(), 0)
    assert.isAbove(_totalSold.toNumber(), 0)
    assert.ok(_totalSupply.equals(_totalSold))

    // Try to oversale
    const _cap = await contribution.totalSaleSupplyCap()
    const _amount = _cap.minus(web3.toWei(5)).plus(1)
    await assertFail(async function() {
      await msp.sendTransaction({
        value: _amount,
        gas: 300000,
        gasPrice: '20000000000',
      })
    }, 'Should not allow to buy over the sale total cap')
  })

  it("won't generate tokens for payments bellow the minimum_investment", async function() {
    await contribution.setMinimumInvestment(web3.toWei(20000000))
    assert.equal(
      (await contribution.minimum_investment()).toNumber(),
      web3.toWei(20000000),
    )

    await assertFail(async function() {
      await contribution.proxyPayment(addressSitHolder1, {
        from: addressSitHolder1,
        value: web3.toWei(10000000),
      })
    })
  })

  it('Finalize, check balances', async function() {
    const _totalSold = await contribution.totalSold()
    assert.isAbove(_totalSold.toNumber(), 0)

    await contribution.setMockedBlockNumber(endBlock + 1)
    await contribution.finalize()

    const _cap = await contribution.totalSupplyCap()

    const _sitTotalSupply = await sit.totalSupply()
    assert.isAbove(_sitTotalSupply.toNumber(), 0)
    const _balanceSIT = await msp.balanceOf(sitExchanger.address)
    assert.ok(_balanceSIT.equals(_sitTotalSupply))

    const _balanceTeam = await msp.balanceOf(multisigTeam.address)
    assert.ok(_balanceTeam.equals(_cap.mul(0.05)))

    const _balanceReferals = await msp.balanceOf(multisigReferals.address)
    assert.ok(_balanceReferals.equals(_cap.mul(0.05)))

    const _mspTotalSupply = await msp.totalSupply()
    assert.ok(
      _mspTotalSupply.equals(
        _totalSold.plus(_balanceSIT).plus(_balanceTeam).plus(_balanceReferals),
      ),
    )
  })
})
