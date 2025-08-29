import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import deploymentAddresses from '../src/lib/deploymentAddresses.json';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const blocklockAddress = deploymentAddresses.blocklockAddress;
  
  if (!blocklockAddress || blocklockAddress.includes("YOUR_")) {
    console.error("Please set blocklockAddress in src/lib/deploymentAddresses.json");
    process.exit(1);
  }

  const initialOwner = deployer.address;

  console.log("Constructor args:", { initialOwner, blocklockAddress });

  const IntegratedLootBox = await ethers.getContractFactory("IntegratedLootBox");
  const integratedLootBox = await IntegratedLootBox.deploy(initialOwner, blocklockAddress);

  await integratedLootBox.waitForDeployment();

  const deployedAddress = await integratedLootBox.getAddress();
  console.log("IntegratedLootBox deployed to:", deployedAddress);

  // Update the deploymentAddresses.json file
  const addressesPath = path.join(__dirname, '../src/lib/deploymentAddresses.json');
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  addresses.integratedLootBoxAddress = deployedAddress;

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated src/lib/deploymentAddresses.json with new IntegratedLootBox address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
