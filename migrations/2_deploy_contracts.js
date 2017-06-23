const SIT = artifacts.require('SIT')
const MSP = artifacts.require('MSP')

module.exports = function(deployer) {
  deployer.deploy(SIT)
  deployer.deploy(MSP)
}
