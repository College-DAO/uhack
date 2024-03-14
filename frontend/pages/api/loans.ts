import Redis from "ioredis"; // Redis
import { parseEther, PawnBankRPC } from "@utils/ethers"; // RPC

// Types
import type { BigNumber } from "ethers";
import type { LoanWithMetadata } from "@utils/types";
import type { NextApiRequest, NextApiResponse } from "next";


async function collectAllLoans(): Promise<LoanWithMetadata[]> {
  const client = new Redis(process.env.REDIS_URL);
  let request = await client.get("metadata");
  let metadata: Record<string, Record<string, string>> = {};
  if (request) {
    metadata = JSON.parse(request);
  }

  const numLoans: BigNumber = await PawnBankRPC.numLoans();
  const numLoansInt: number = numLoans.toNumber();

  let loans: LoanWithMetadata[] = [];

  for (let i = 0; i < numLoansInt; i++) {
    const loan: any[] = await PawnBankRPC.pawnLoans(i);
    const { name, description, imageURL } =
      metadata[`${loan[0].toLowerCase()}-${loan[3].toString()}`];

    loans.push({
      loanId: i,
      name,
      description,
      imageURL,
      tokenAddress: loan[0],
      tokenOwner: loan[1],
      lender: loan[2],
      tokenId: loan[3].toNumber(),
      interestRate: loan[4].toNumber(),
      loanAmount: parseEther(loan[5]),
      maxLoanAmount: parseEther(loan[6]),
      loanAmountDrawn: parseEther(loan[7]),
      firstBidTime: loan[8].toNumber(),
      lastBidTime: loan[9].toNumber(),
      historicInterest: parseEther(loan[10]),
      loanCompleteTime: loan[11].toNumber(),
    });
  }

  return loans.reverse();
}

// Return loan data
const loans = async (req: NextApiRequest, res: NextApiResponse) => {
  res.send(await collectAllLoans());
};

export default loans;
