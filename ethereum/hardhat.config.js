require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const {
  BNB_RPC_URL,
  BNB_TEST_RPC_URL,
  SEPOLIA_RPC_URL,
  PRIVATE_KEY,
  PRIVATE_KEY2,
  PRIVATE_KEY3,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: true,
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: false,
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 20,
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    bnbTestnet: {
      url: BNB_TEST_RPC_URL || "",
      chainId: 97,
      accounts: [PRIVATE_KEY || "", PRIVATE_KEY2 || "", PRIVATE_KEY3 || ""].filter(Boolean),
    },
    bnbnet: {
      url: BNB_RPC_URL || "",
      chainId: 56,
      accounts: [PRIVATE_KEY || "", PRIVATE_KEY2 || "", PRIVATE_KEY3 || ""].filter(Boolean),
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: [PRIVATE_KEY || "", PRIVATE_KEY2 || "", PRIVATE_KEY3 || ""].filter(Boolean),
      chainId: 11155111,
    },
  },
};
