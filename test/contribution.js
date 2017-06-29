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

  it('Deploys all contracts', async function() {
    multisigMothership = await MultiSigWallet.new([addressMothership], 1)
    multisigCommunity = await MultiSigWallet.new([addressCommunity], 1)
    multisigTeam = await MultiSigWallet.new([addressTeam], 1)

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
    await contribution.initialize(
      msp.address,
      mspPlaceholder.address,
      totalSupply,
      exchangeRate,
      startBlock,
      endBlock,
      contributionWallet.address,
      sitExchanger.address,
      multisigTeam.address,
      sit.address,
    )
  })

  describe('SIT', function() {
    it('total supply', async function() {
      assert.equal(
        await sit.totalSupply(),
        0,
        'SIT initial total supply should be 0',
      )
    })

    it('nobody can buy', async function() {
      await assertFail(async function() {
        await sit.send(web3.toWei(1))
      })
    })

    describe('generate tokens', function() {
      const sitHolders = [
        {
          name: 'holder1',
          account: addressSitHolder1,
          amount: web3.toWei(10000000),
        },
        {
          name: 'holder2',
          account: addressSitHolder2,
          amount: web3.toWei(20000000),
        },
      ]

      sitHolders.forEach(test => {
        it(`could generate SIT token for ${test.name}`, async function() {
          const totalSupply = await sit.totalSupply()

          assert.equal(
            await sit.balanceOf(test.account),
            0,
            `Initial SIT balance for account ${test.name} should be 0`,
          )

          assert.isOk(
            await sit.generateTokens(test.account, test.amount),
            `SIT tokens should be generated for account ${test.name}`,
          )

          const balance = await sit.balanceOf(test.account)
          assert.equal(
            balance.toNumber(),
            test.amount,
            `SIT holder balance for account ${test.name} should be increased`,
          )

          const newTotalSupply = await sit.totalSupply()
          assert.equal(
            newTotalSupply.toNumber(),
            totalSupply.add(test.amount).toNumber(),
            `SIT total supply should be increased by ${test.amount} after generating tokens for ${test.name}`,
          )

          await assertFail(async function() {
            const res = await sit.generateTokens(test.account, 1, {
              from: test.account,
            })
          }, `account ${test.name} could not generate SIT to itself`)
        })
      })

      it('not transferable', async function() {
        const amount = web3.toWei(1000)
        const balance = await sit.balanceOf(addressSitHolder1)
        assert.isAtLeast(
          balance.toNumber(),
          amount,
          'SIT holder should have enough tokens to transfer',
        )

        await assertFail(async function() {
          await sit.transfer(addressSitHolder2, amount, {
            from: addressSitHolder1,
          })
        }, 'transfer is not allowed')
      })
    })
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
})
