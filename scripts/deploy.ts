import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import deploymentAddresses from '../src/lib/deploymentAddresses.json';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // We get the contract to deploy
  // The constructor arguments are (_itemNFTAddress, _blocklockAddress, _userAddress)
  const itemNFTAddress = deploymentAddresses.itemNFTAddress;
  const blocklockAddress = deploymentAddresses.blocklockAddress;
  
  if (!itemNFTAddress || !blocklockAddress || itemNFTAddress.includes("YOUR_") || blocklockAddress.includes("YOUR_")) {
    console.error("Please set itemNFTAddress and blocklockAddress in src/lib/deploymentAddresses.json");
    process.exit(1);
  }

  const userAddress = deployer.address; // Or specify another address if needed

  console.log("Constructor args:", { itemNFTAddress, blocklockAddress, userAddress });

  const LootBoxManager = await ethers.getContractFactory("LootBoxManager");
  const lootBoxManager = await LootBoxManager.deploy(itemNFTAddress, blocklockAddress, userAddress);

  await lootBoxManager.waitForDeployment();

  const deployedAddress = await lootBoxManager.getAddress();
  console.log("LootBoxManager deployed to:", deployedAddress);

  // Update the deploymentAddresses.json file
  const addressesPath = path.join(__dirname, '../src/lib/deploymentAddresses.json');
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  
  addresses.lootBoxManagerAddress = deployedAddress;

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated src/lib/deploymentAddresses.json with new LootBoxManager address.");
  console.log("You might need to deploy ItemNFT and Blocklock contracts first and update their addresses in the JSON file.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
