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
  })

  describe('SIT', function() {
    it('total supply', async function() {
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

    describe('minting tokens', function() {
      const sitHolders = [
        { name: 'holder1', account: sitHolder1, amount: 10000000 },
        { name: 'holder2', account: sitHolder2, amount: 20000000 },
      ]

      sitHolders.forEach(test => {
        it(`could mint SIT token for ${test.name}`, async function() {
          const totalSupply = await sit.totalSupply()

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

          const newTotalSupply = await sit.totalSupply()
          assert.equal(
            newTotalSupply.toNumber(),
            totalSupply.add(test.amount).toNumber(),
            `SIT total supply should be increased by ${test.amount} after minting for ${test.name}`,
          )

          await assertFail(async function() {
            const res = await sit.mint(test.account, 1, {
              from: test.account,
            })
            console.log('MINT', res)
          }, `account ${test.name} could not mint SIT to itself`)
        })
      })

      it('stop minting if supply cap reached', async function() {
        await assertFail(async function() {
          const totalSupply = await sit.totalSupply()
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
