import { ethers } from "ethers"; // Ethers
import { PawnBankABI } from "@utils/abi/PawnBank"; // Pawn Bank ABI

export const PAWN_BANK_ADDRESS: string =
  process.env.PAWN_BANK_ADDRESS ?? "0x5ff72172fBa7d68a2A702f05ccF965aD4cdFd561";

export const PawnBankRPC = new ethers.Contract(
  PAWN_BANK_ADDRESS,
  PawnBankABI,
  new ethers.providers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_RPC}`,
    4
  )
);

export function parseEther(num: ethers.BigNumber): number {
  return Number(ethers.utils.formatEther(num.toString()));
}
