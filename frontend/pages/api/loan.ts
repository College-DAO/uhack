import Redis from "ioredis"; // Redis
import { parseEther, PawnBankRPC } from "@utils/ethers"; // RPC

// Types
import type { LoanWithMetadata } from "@utils/types";
import type { NextApiRequest, NextApiResponse } from "next";

export async function collectSingleLoan(
  loanId: number
): Promise<LoanWithMetadata> {
  const client = new Redis(process.env.REDIS_URL);
  let request = await client.get("metadata");
  let metadata: Record<string, Record<string, string>> = {};
  if (request) {
    metadata = JSON.parse(request);
  }

  const loan: any[] = await PawnBankRPC.pawnLoans(loanId);
  const { name, description, imageURL } =
    metadata[`${loan[0].toLowerCase()}-${loan[3].toString()}`];

  return {
    loanId,
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
  };
}

const loans = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  res.send(await collectSingleLoan(Number(id)));
};

export default loans;
