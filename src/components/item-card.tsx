import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Lock, Unlock } from "lucide-react";
import type { Item } from "@/app/actions";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="flex flex-col overflow-hidden border-2 border-primary/20 bg-card shadow-lg shadow-primary/10 hover:border-primary/50 transition-all duration-300 group">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Item #{item.tokenId}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex items-center justify-center">
        <div className="aspect-square w-full relative overflow-hidden rounded-b-md">
            <Image
                src={item.imageUrl}
                alt={`Loot item #${item.tokenId}`}
                width={400}
                height={400}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={item.dataAiHint}
            />
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-card-foreground/5">
        {item.isLocked ? (
          <Badge className="w-full justify-center bg-accent text-accent-foreground hover:bg-accent/90" variant="default">
            <Lock className="mr-2 h-4 w-4" />
            Locked until block {item.unlockBlock}
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-full justify-center">
            <Unlock className="mr-2 h-4 w-4" />
            Unlocked
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
