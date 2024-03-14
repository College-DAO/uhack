import * as dotenv from "dotenv"; // Env
import "@nomiclabs/hardhat-waffle"; // Hardhat

// Hardhat plugins
import "hardhat-gas-reporter"; // Gas stats
import "hardhat-abi-exporter"; // ABI exports
import "@nomiclabs/hardhat-solhint"; // Solhint

// Setup env
dotenv.config();
const ALCHEMY_API_KEY: string = process.env.ALCHEMY_API_KEY ?? "";
const SEPOLIA_DEPLOY_PK: string = process.env.SEPOLIA_DEPLOY_PK ?? "";

// Export Hardhat params
export default {
  solidity: "0.8.4",
  networks: {
    // Fork mainnet for testing
    hardhat: {
      forking: {
        url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 12864983,
      },
    },
    // Deploy to Sepolia
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${SEPOLIA_DEPLOY_PK}`],
    },
  },
  // Gas reporting
  gasReporter: {
    currency: "USD",
    gasPrice: 20,
  },
  // Export ABIs
  abiExporter: {
    path: "./abi",
    clear: true,
  },
};
