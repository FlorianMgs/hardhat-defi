require("@nomiclabs/hardhat-waffle")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("dotenv").config()

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const MAINNET_RPC_URL = process.env.ALCHEMY_MAINNET_URL

module.exports = {
	solidity: {
		compilers: [{ version: "0.8.17" }, { version: "0.6.12" }, { version: "0.4.19" }],
	},
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 1337,
			forking: {
				url: MAINNET_RPC_URL,
			},
			blockConfirmations: 1,
		},
		// goerli: {
		// 	chainId: 5,
		// 	blockConfirmations: 3,
		// },
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		account1: {
			default: 1,
		},
		account2: {
			default: 2,
		},
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		coinmarketcap: COINMARKETCAP_API_KEY,
	},
	mocha: {
		timeout: 600000,
	},
}
