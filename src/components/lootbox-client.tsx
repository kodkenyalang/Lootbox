"use client";

import { useState, useTransition } from "react";
import { openLootBox, type Item } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { Box, Loader2, Sparkles } from "lucide-react";
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

export function LootBoxClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [revealedItem, setRevealedItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleOpenBox = () => {
    startTransition(async () => {
      try {
        const newItem = await openLootBox();
        setRevealedItem(newItem);
        setItems(prevItems => [newItem, ...prevItems]);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error Opening Box",
          description: "Something went wrong. Please try again.",
        });
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
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Your Collection</h2>
        {items.length > 0 ? (
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
