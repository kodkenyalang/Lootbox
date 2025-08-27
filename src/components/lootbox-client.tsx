"use client";

import { useState, useEffect, useTransition } from "react";
import type { Item } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { Box, Loader2, Sparkles, Wallet } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BrowserProvider, Contract, ethers } from "ethers";

import LootBoxManagerAbi from "@/abis/LootBoxManager.json";
import ItemNFTAbi from "@/abis/ItemNFT.json";
import BlocklockAbi from "@/abis/Blocklock.json";
import deploymentAddresses from "@/lib/deploymentAddresses.json";

const { lootBoxManagerAddress, itemNFTAddress, blocklockAddress } = deploymentAddresses;

const placeholders = [
  { url: "https://picsum.photos/seed/sword/400/400", hint: "glowing sword" },
  { url: "https://picsum.photos/seed/shield/400/400", hint: "ornate shield" },
  { url: "https://picsum.photos/seed/helmet/400/400", hint: "viking helmet" },
  { url: "https://picsum.photos/seed/potion/400/400", hint: "magic potion" },
  { url: "https://picsum.photos/seed/gem/400/400", hint: "crystal gem" },
  { url: "https://picsum.photos/seed/amulet/400/400", hint: "ancient amulet" },
  { url: "https://picsum.photos/seed/ring/400/400", hint: "magic ring" },
  { url: "https://picsum.photos/seed/staff/400/400", hint: "wizard staff" },
];

export function LootBoxClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [revealedItem, setRevealedItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const { toast } = useToast();

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const newProvider = new BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        const newAccount = await newSigner.getAddress();
        
        setProvider(newProvider);
        setSigner(newSigner);
        setAccount(newAccount);

        const network = await newProvider.getNetwork();
        // Filecoin Calibration testnet chainId is 314159
        if (network.chainId !== 314159n) {
             toast({
                variant: "destructive",
                title: "Wrong Network",
                description: "Please connect to the Filecoin Calibration testnet.",
            });
            return;
        }

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Wallet Connection Failed",
          description: "Could not connect to your wallet. Please try again.",
        });
        console.error("Wallet connection error:", error);
      }
    } else {
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this application.",
      });
    }
  };

  const getItems = async (currentSigner: ethers.Signer) => {
      if(!currentSigner) return;
      const itemNFTContract = new Contract(itemNFTAddress, ItemNFTAbi.abi, currentSigner);
      const blocklockContract = new Contract(blocklockAddress, BlocklockAbi.abi, currentSigner);
      
      const balance = await itemNFTContract.balanceOf(await currentSigner.getAddress());
      const fetchedItems: Item[] = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await itemNFTContract.tokenOfOwnerByIndex(await currentSigner.getAddress(), i);
        const isLocked = await blocklockContract.isLocked(tokenId);
        // The getLock function from the provided ABI seems to be incorrect or missing from the final contract.
        // Using isLocked instead. We might need to adjust if getLock is indeed available.
        // const lockInfo = await blocklockContract.getLock(itemNFTAddress, tokenId);
        
        const placeholder = placeholders[Number(tokenId) % placeholders.length];

        fetchedItems.push({
            tokenId: Number(tokenId),
            isLocked: isLocked,
            unlockBlock: 0, // Placeholder, as getLock is not available in the ABI
            imageUrl: placeholder.url,
            dataAiHint: placeholder.hint,
            blockTimestamp: Date.now() // Placeholder, ideally from block data
        });
      }
      setItems(fetchedItems.reverse());
  }

  useEffect(() => {
    if(signer) {
        getItems(signer);
    }
  }, [signer])

  const handleOpenBox = () => {
    if (!signer || !provider) {
        toast({
          variant: "destructive",
          title: "Wallet Not Connected",
          description: "Please connect your wallet to open a loot box.",
        });
        return;
    }

    startTransition(async () => {
      const lootboxContract = new Contract(lootBoxManagerAddress, LootBoxManagerAbi.abi, signer);
      
      try {
        const tx = await lootboxContract.openLootBox({ value: ethers.parseEther("0.1") }); // Example cost
        
        toast({
            title: "Transaction Sent",
            description: "Opening your loot box... please wait for confirmation.",
        });

        const receipt = await tx.wait();

        // Find the event from the transaction receipt
        let newItemTokenId = -1;
        const transferEventInterface = new ethers.Interface(ItemNFTAbi.abi);
        if (receipt.logs) {
            for (const log of receipt.logs) {
                try {
                    const parsedLog = transferEventInterface.parseLog(log);
                    if (parsedLog && parsedLog.name === "Transfer" && parsedLog.args.to === account) {
                        newItemTokenId = Number(parsedLog.args.tokenId);
                        break;
                    }
                } catch(e) {
                    // ignore, not the right event
                }
            }
        }
        
        if (newItemTokenId === -1) {
            throw new Error("Could not find the new item token ID in the transaction receipt.");
        }

        const blocklockContract = new Contract(blocklockAddress, BlocklockAbi.abi, signer);
        const isLocked = await blocklockContract.isLocked(newItemTokenId);
        
        const placeholder = placeholders[newItemTokenId % placeholders.length];

        const newItem: Item = {
          tokenId: newItemTokenId,
          isLocked: isLocked,
          unlockBlock: 0, // Placeholder
          imageUrl: placeholder.url,
          dataAiHint: placeholder.hint,
          blockTimestamp: Date.now(), // Placeholder
        };

        setRevealedItem(newItem);
        setItems(prevItems => [newItem, ...prevItems]);
        toast({
            title: "Success!",
            description: `You've found item #${newItemTokenId}!`,
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Opening Box",
          description: error.reason || "Something went wrong. Please try again.",
        });
        console.error("Open loot box error:", error);
      }
    });
  };

  return (
    <div className="w-full max-w-5xl">
      <section className="text-center bg-card border rounded-lg p-8 sm:p-12 mb-12 flex flex-col items-center shadow-lg shadow-primary/10">
        <div className={`mb-6 transition-transform duration-500 ${isPending ? 'animate-pulse' : ''}`}>
          <Box className="h-24 w-24 sm:h-32 sm:w-32 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Unlock Your Fortune</h2>
        <p className="text-muted-foreground mb-6">A new treasure awaits. Click the button to see what's inside.</p>
        
        {!account ? (
           <Button onClick={connectWallet} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-accent/40 transition-shadow">
                <Wallet className="mr-2 h-6 w-6" />
                Connect Wallet
            </Button>
        ) : (
            <Button onClick={handleOpenBox} disabled={isPending} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-accent/40 transition-shadow">
            {isPending ? (
                <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Opening...
                </>
            ) : (
                <>
                <Sparkles className="mr-2 h-6 w-6" />
                Open Loot Box
                </>
            )}
            </Button>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Your Collection</h2>
        {account ? (
            items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {items.map((item) => (
                <ItemCard key={item.tokenId} item={item} />
                ))}
            </div>
            ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <p>Your collection is empty.</p>
                <p>Open a loot box to find your first item!</p>
            </div>
            )
        ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <p>Connect your wallet to see your collection.</p>
            </div>
        )}
      </section>

      <AlertDialog open={!!revealedItem} onOpenChange={(open) => !open && setRevealedItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl text-accent">You've found an item!</AlertDialogTitle>
            <AlertDialogDescription asChild>
                <div className="pt-4">
                  {revealedItem && <ItemCard item={revealedItem} />}
                </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setRevealedItem(null)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Awesome!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
