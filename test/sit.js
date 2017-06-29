const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
const SIT = artifacts.require('SITMock')

const assertFail = require('./helpers/assertFail')

contract('SIT', function(accounts) {
  const addressMothership = accounts[0]
  const addressSitHolder1 = accounts[1]
  const addressSitHolder2 = accounts[2]

  let miniMeTokenFactory
  let sit

  it('Deploys all contracts', async function() {
    miniMeTokenFactory = await MiniMeTokenFactory.new()
    sit = await SIT.new(miniMeTokenFactory.address)
  })

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
