//New
import { LootBoxClient } from "@/components/lootbox-client";
import { Gem } from "lucide-react";

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background font-body">
      <header className="w-full max-w-5xl text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Gem className="h-10 w-10 text-primary" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
            LootBox
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the thrill of discovery. One click to open a loot box on the Filecoin network and unveil your reward. Will you find a rare, time-locked treasure?
        </p>
      </header>
      
      <LootBoxClient />
    </main>
  );
}
