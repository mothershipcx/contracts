const SIT = artifacts.require('SIT')

const assertFail = require('./helpers/assertFail')

contract('Mothership tokens contribution', function(accounts) {
  const SIT_TOTAL_SUPPLY_CAP = 40000000

  const mothership = accounts[0]
  const sitHolder1 = accounts[1]
  const sitHolder2 = accounts[2]

  let sit

  it('Deploys all contracts', async function() {
    sit = await SIT.new()
    assert.equal(
      await sit.totalSupply(),
      0,
      'SIT initial total supply should be 0',
    )
    assert.equal(
      await sit.totalSupplyCap(),
      SIT_TOTAL_SUPPLY_CAP,
      `SIT total supply should be ${SIT_TOTAL_SUPPLY_CAP}`,
    )
  })

  describe('SIT', function() {
    describe('minting tokens', function() {
      const sitHolder1Amount = 10000000,
        sitHolder2Amount = 20000000

      const sitHolders = [
        { name: 'holder1', account: sitHolder1, amount: sitHolder1Amount },
        { name: 'holder2', account: sitHolder2, amount: sitHolder2Amount },
      ]

      sitHolders.forEach(test => {
        it(`could mint SIT token for ${test.name}`, async function() {
          assert.equal(
            await sit.balanceOf(test.account),
            0,
            `Initial SIT balance for account ${test.name} should be 0`,
          )

          assert.isOk(
            await sit.mint(test.account, test.amount),
            `SIT tokens should be minted for account ${test.name}`,
          )

          assert.equal(
            await sit.balanceOf(test.account),
            test.amount,
            `SIT holder balance for account ${test.name} should be increased`,
          )

          await assertFail(async function() {
            const res = await sit.mint(test.account, 1, {
              from: test.account,
            })
            console.log('MINT', res)
          }, `account ${test.name} could not mint SIT to itself`)
        })
      })

      it('total supply', async function() {
        const totalSupply = await sit.totalSupply()
        assert.equal(
          totalSupply,
          sitHolder1Amount + sitHolder2Amount,
          'total supply should increase after minting new tokens',
        )

        await assertFail(async function() {
          await sit.mint(sitHolder1, SIT_TOTAL_SUPPLY_CAP - totalSupply + 1)
        }, 'minting over the total supply cap should throw an error')
      })
    })

    it('nobody can buy', async function() {
      await assertFail(async function() {
        await sit.send(web3.toWei(1))
      })
    })
  })
})
