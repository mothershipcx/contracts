const HDWalletProvider = require('truffle-hdwallet-provider')

const mnemonic =
  process.env.TEST_MNEMONIC ||
  'mothership mnemonic mothership mnemonic mothership mnemonic mothership mnemonic mothership mnemonic mothership mnemonic'
const providerRopsten = new HDWalletProvider(
  mnemonic,
  'https://ropsten.infura.io/',
  0,
)
const providerKovan = new HDWalletProvider(
  mnemonic,
  'https://kovan.infura.io',
  0,
)
const providerMain = new HDWalletProvider(
  process.env.MAIN_MNEMONIC,
  'http://localhost:8545',
  0,
)

module.exports = {
  networks: {
    development: {
      network_id: 15,
      host: 'localhost',
      port: 8545,
      gas: 4000000,
      gasPrice: 20e9,
    },
    main: {
      network_id: 1,
      provider: providerMain,
      gas: 4000000,
      gasPrice: 20e9,
    },
    ropsten: {
      network_id: 3,
      provider: providerRopsten,
      gas: 4000000,
      gasPrice: 20e9,
    },
    kovan: {
      network_id: 42,
      provider: providerKovan,
      gas: 4000000,
      gasPrice: 20e9,
    },
  },
}
