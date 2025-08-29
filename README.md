# LootBox dApp

LootBox is a decentralized application (dApp) that allows users to open "loot boxes" on the Filecoin Calibration testnet. Each box contains an NFT, with a chance to receive a rare, time-locked item. This project leverages the Filecoin Virtual Machine (FVM) for smart contract execution and demonstrates a simple, single-transaction loot box mechanism.

This project was built with Next.js, Hardhat, Ethers.js, and shadcn/ui.

 <!-- Replace with a real screenshot URL -->

## Core Features

-   **One-Click Loot Box**: A single transaction on the Filecoin network handles the entire process of opening a loot box and receiving an NFT.
-   **On-Chain Randomness**: A portable pseudo-randomness implementation determines the contents of each loot box.
-   **Time-Locked Rare Items**: Rare NFTs are minted in a "locked" state using a `Blocklock` smart contract, making them non-transferable for a set number of blocks.
-   **Web3 Wallet Integration**: Connects with MetaMask to manage user identity and sign transactions.
-   **Filecoin Calibration Network**: All smart contract interactions occur on the public Filecoin Calibration testnet.

## Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   ├── Blocklock.sol
│   ├── ItemNFT.sol
│   └── LootBoxManager.sol
├── public/                 # Static assets
├── scripts/                # Deployment scripts
│   └── deploy.ts
├── src/
│   ├── abis/               # Contract ABIs (JSON interfaces)
│   ├── app/                # Next.js app directory (pages and layout)
│   ├── components/         # React components
│   ├── lib/                # Utility functions and configs
│   └── ...
├── hardhat.config.ts       # Hardhat configuration
├── next.config.ts          # Next.js configuration
└── package.json            # Project dependencies and scripts
```

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or later)
-   [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
-   [MetaMask](https://metamask.io/) browser extension

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd lootbox-dapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root by copying the example file:

```bash
cp .env.example .env
```

Open the `.env` file and add your wallet's private key and a Filecoin Calibration RPC URL. You can get an RPC URL from services like [Ankr](https://www.ankr.com/rpc/filecoin/) or [Glif](https://glif.io/).

```
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
FILECOIN_CALIBRATION_RPC_URL="YOUR_RPC_URL"
```

**Important**: Your wallet will need some testnet `tFIL` to pay for gas fees. You can get some from a [Filecoin faucet](https://faucet.calibnet.fil.network/).

### 4. Deploy the Smart Contracts

The `LootBoxManager` contract depends on the `ItemNFT` and `Blocklock` contracts. You must deploy them first.

**a. Deploy `ItemNFT` and `Blocklock`:**

You will need to write and run deployment scripts for these contracts. You can create new files in the `scripts/` directory (e.g., `deploy-item-nft.ts`). After deploying them, you need to update `src/lib/deploymentAddresses.json` with their addresses.

**b. Update `deploymentAddresses.json`:**

Open `src/lib/deploymentAddresses.json` and replace the placeholder addresses with your deployed contract addresses.

```json
{
  "lootBoxManagerAddress": "YOUR_LOOTBOX_MANAGER_ADDRESS",
  "itemNFTAddress": "0xYourItemNFTContractAddress...",
  "blocklockAddress": "0xYourBlocklockContractAddress..."
}
```

**c. Compile All Contracts:**

```bash
npm run compile
```

This command uses Hardhat to compile all contracts in the `contracts/` directory and places the artifacts (bytecode and ABI) in `src/artifacts/`.

**d. Deploy `LootBoxManager`:**

Now, run the deployment script for the main contract:

```bash
npm run deploy
```

This script will deploy `LootBoxManager` to the Filecoin Calibration testnet and automatically update `src/lib/deploymentAddresses.json` with its new address.

### 5. Run the Application

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## How to Use the dApp

1.  **Connect Your Wallet**: Click the "Connect Wallet" button and approve the connection in MetaMask. Ensure your MetaMask is set to the "Filecoin - Calibration testnet".
2.  **Open a Loot Box**: Click the "Open Loot Box" button to initiate a transaction.
3.  **Confirm Transaction**: Approve the transaction in MetaMask.
4.  **View Your Collection**: Once the transaction is confirmed on the blockchain, your new NFT will appear in the "Your Collection" section. If you received a rare item, it will show a "Locked" status with an unlock block number.
