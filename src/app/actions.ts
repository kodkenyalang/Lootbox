"use server";

export type Item = {
  tokenId: number;
  isLocked: boolean;
  unlockBlock: number;
  imageUrl: string;
  dataAiHint: string;
  blockTimestamp: number;
};
