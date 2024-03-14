// Base NFT Loan
export interface Loan {
  loanId: number;
  tokenAddress: string;
  tokenOwner: string;
  lender: string;
  tokenId: number;
  interestRate: number;
  loanAmount: number;
  maxLoanAmount: number;
  loanAmountDrawn: number;
  firstBidTime: number;
  lastBidTime: number;
  historicInterest: number;
  loanCompleteTime: number;
}

export interface LoanWithMetadata extends Loan {
  imageURL: string;
  name: string;
  description: string;
}
