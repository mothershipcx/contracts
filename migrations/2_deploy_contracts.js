const MiniMeTokenFactory = artifacts.require('MiniMeTokenFactory')
const SIT = artifacts.require('SIT')
const MSP = artifacts.require('MSP')

const addressSIT = ''

module.exports = async function(deployer, network) {
  if (network === 'development') return // Don't deploy on tests

  // MiniMeTokenFactory send
  const miniMeTokenFactoryFuture = MiniMeTokenFactory.new()

  // MiniMeTokenFactory wait
  const miniMeTokenFactory = await miniMeTokenFactoryFuture
  console.log('MiniMeTokenFactory: ' + miniMeTokenFactory.address)
  console.log()

  // SIT send
  let sitFuture
  if (addressSIT.length === 0) {
    // Testnet
    sitFuture = SIT.new(miniMeTokenFactory.address)
  } else {
    sitFuture = SIT.at(addressSIT)
  }
  // MSP send
  const mspFuture = MSP.new(miniMeTokenFactory.address)

  // SIT wait
  const sit = await sitFuture
  console.log('SIT: ' + sit.address)
  // MSP wait
  const msp = await mspFuture
  console.log('MSP: ' + msp.address)
  console.log()

  // MSP initialize checkpoints for 0th TX gas savings
  await msp.generateTokens('0x0', 1)
  await msp.destroyTokens('0x0', 1)
}
