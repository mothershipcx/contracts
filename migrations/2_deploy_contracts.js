const MetaToken = artifacts.require('MetaToken')

module.exports = function(deployer) {
  deployer.deploy(MetaToken)
}
