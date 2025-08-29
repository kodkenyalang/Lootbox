
"use client";

import { useState, useEffect, useTransition } from "react";
import type { Item } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { Box, Loader2, Sparkles, Wallet, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { BrowserProvider, Contract, ethers } from "ethers";

import IntegratedLootBoxAbi from "@/abis/IntegratedLootBox.json";
import BlocklockAbi from "@/abis/Blocklock.json";
import deploymentAddresses from "@/lib/deploymentAddresses.json";

const { integratedLootBoxAddress, blocklockAddress } = deploymentAddresses;

const areContractsDeployed = 
    integratedLootBoxAddress && !integratedLootBoxAddress.includes("YOUR_") &&
    blocklockAddress && !blocklockAddress.includes("YOUR_");

export function LootBoxClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [revealedItem, setRevealedItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(0);

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

  const getItems = async (currentSigner: ethers.Signer, currentProvider: BrowserProvider) => {
    if (!areContractsDeployed) return;
    const lootboxContract = new Contract(integratedLootBoxAddress, IntegratedLootBoxAbi.abi, currentSigner);
    const blocklockContract = new Contract(blocklockAddress, BlocklockAbi.abi, currentSigner);
    
    try {
        const address = await currentSigner.getAddress();
        const balance = await lootboxContract.balanceOf(address);
        const latestBlock = await currentProvider.getBlock("latest");
        const currentBlockNumber = latestBlock ? latestBlock.number : 0;
        setCurrentBlock(currentBlockNumber);
        
        // This is a simplified way to fetch items. 
        // A robust implementation would use events or a subgraph.
        const fetchedItems: Item[] = [];
        const balanceNum = Number(balance);
        for (let i = 0; i < balanceNum; i++) {
            // Note: This contract does not have `tokenOfOwnerByIndex`, so this approach is not possible.
            // We must rely on listening to `LootBoxOpened` events.
            // The logic here will mainly refresh existing items.
        }

        const updatedItems = await Promise.all(items.map(async (item) => {
            const isLocked = await blocklockContract.isLocked(item.tokenId);
            let unlockBlock = item.unlockBlock;
            if (isLocked) {
              try {
                const lock = await blocklockContract.getLock(item.tokenId);
                unlockBlock = Number(lock);
              } catch (e) {
                console.warn("Could not retrieve lock for token:", item.tokenId);
              }
            }
            return { ...item, isLocked, unlockBlock };
        }));

        setItems(updatedItems.sort((a, b) => b.tokenId - a.tokenId));
    } catch (error) {
        console.error("Error fetching items:", error);
        toast({
            variant: "destructive",
            title: "Error Fetching Items",
            description: "Could not fetch your item collection.",
        });
    }
  };


  useEffect(() => {
    if(signer && provider && areContractsDeployed) {
        getItems(signer, provider);
    }
  }, [signer, provider]);

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
      const lootboxContract = new Contract(integratedLootBoxAddress, IntegratedLootBoxAbi.abi, signer);
      
      try {
        const tx = await lootboxContract.requestLootBoxOpen();
        
        toast({
            title: "Transaction Sent",
            description: "Opening your loot box... please wait for confirmation.",
        });

        const receipt = await tx.wait();

        const eventTopic = lootboxContract.interface.getEvent("LootBoxOpened");
        if (receipt.logs && eventTopic) {
            const event = receipt.logs
                .map((log: any) => {
                    try {
                        const parsedLog = lootboxContract.interface.parseLog(log);
                        if (parsedLog?.name === 'LootBoxOpened' && parsedLog.args.user === account) {
                            return parsedLog;
                        }
                    } catch (e) {
                        return null;
                    }
                    return null;
                })
                .find((log): log is ethers.LogDescription => log !== null);

            if (event) {
                const { tokenId, wasLocked } = event.args;
                const latestBlock = await provider.getBlock("latest");
                const currentBlockNumber = latestBlock?.number ?? 0;
                
                let unlockBlock = 0;
                if (wasLocked) {
                    const blocklockContract = new Contract(blocklockAddress, BlocklockAbi.abi, signer);
                    try {
                        unlockBlock = Number(await blocklockContract.getLock(tokenId));
                    } catch(e) {
                        console.error("Could not get lock for new item");
                        // Fallback based on contract constant
                        unlockBlock = currentBlockNumber + 50; 
                    }
                }

                const newItem: Item = {
                    tokenId: Number(tokenId),
                    isLocked: wasLocked,
                    unlockBlock: unlockBlock,
                    imageUrl: `https://picsum.photos/400/400?random=${Number(tokenId)}`,
                    dataAiHint: wasLocked ? 'rare treasure' : 'common item',
                    blockTimestamp: latestBlock?.timestamp ?? 0,
                };

                setRevealedItem(newItem);
                setItems(prev => [newItem, ...prev.filter(i => i.tokenId !== newItem.tokenId)].sort((a,b) => b.tokenId - a.tokenId));
                 toast({
                    title: "Success!",
                    description: `You found Item #${newItem.tokenId}!`,
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Event not found",
                    description: "Could not find the LootBoxOpened event for your address in the transaction.",
                });
            }
        } else {
             toast({
                variant: "destructive",
                title: "No logs in receipt",
                description: "The transaction receipt did not contain any event logs.",
            });
        }
      } catch (error: any) {
        const errorMessage = error.reason || "An unexpected error occurred. Please check the console.";
        toast({
          variant: "destructive",
          title: "Error Opening Box",
          description: errorMessage,
        });
        console.error("Open loot box error:", error);
      }
    });
  };

  if (!areContractsDeployed) {
    return (
        <Alert variant="destructive" className="w-full max-w-2xl mx-auto my-12">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Contracts Not Deployed</AlertTitle>
            <AlertDescription>
                The application is not configured with smart contract addresses. Please deploy your contracts and update the <code className="font-mono bg-muted px-1 py-0.5 rounded">src/lib/deploymentAddresses.json</code> file.
            </AlertDescription>
        </Alert>
    )
  }

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
