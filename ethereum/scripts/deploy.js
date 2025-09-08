const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TokenFactory with account:", deployer.address);

  // 获取 TokenFactory 合约工厂
  const TokenFactory = await ethers.getContractFactory("TokenFactory");

  // 部署 TokenFactory 合约
  const factory = await TokenFactory.deploy();
  await factory.waitForDeployment();

  console.log("TokenFactory deployed to:", factory.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
