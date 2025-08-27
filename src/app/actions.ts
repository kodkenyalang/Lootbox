"use server";

import { revalidatePath } from "next/cache";

export type Item = {
  tokenId: number;
  isLocked: boolean;
  unlockBlock: number;
  imageUrl: string;
  dataAiHint: string;
};

// WARNING: This is a mock in-memory store. Data will be lost on server restart.
let inventory: Item[] = [];
let nextTokenId = 1;
let currentBlock = 1000; 

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

if (inventory.length === 0) {
  const initialPlaceholder = placeholders[0];
  inventory.push({
    tokenId: 0,
    isLocked: false,
    unlockBlock: 0,
    imageUrl: initialPlaceholder.url,
    dataAiHint: initialPlaceholder.hint,
  });
}

export async function getItems(): Promise<Item[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  currentBlock += 1;
  return inventory;
}

export async function openLootBox(): Promise<Item> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  currentBlock += Math.floor(Math.random() * 3) + 1;

  const pseudoRandom = Math.random();
  const isLocked = pseudoRandom <= 0.2; // 20% chance
  const RARE_ITEM_LOCK_DURATION_IN_BLOCKS = 50;
  const placeholder = placeholders[nextTokenId % placeholders.length];

  const newItem: Item = {
    tokenId: nextTokenId,
    isLocked,
    unlockBlock: isLocked ? currentBlock + RARE_ITEM_LOCK_DURATION_IN_BLOCKS : 0,
    imageUrl: placeholder.url,
    dataAiHint: placeholder.hint,
  };

  nextTokenId++;
  inventory.unshift(newItem);

  revalidatePath("/");

  return newItem;
}
