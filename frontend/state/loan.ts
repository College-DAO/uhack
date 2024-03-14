import axios from "axios"; // Axios
import { eth } from "@state/eth"; // ETH state
import { toast } from "react-toastify"; // Toast notifications
import { BigNumber, ethers } from "ethers"; // Ethers
import { ERC721ABI } from "@utils/abi/erc721"; // ABI: ERC721
import { createContainer } from "unstated-next"; // State
import { PawnBankABI } from "@utils/abi/PawnBank"; // ABI: PawnBank
import { PAWN_BANK_ADDRESS } from "@utils/ethers"; // Utils


function useLoan() {
  const { provider } = eth.useContainer();

  async function collectERC721Contract(
    address: string
  ): Promise<ethers.Contract | undefined> {
    if (provider) {
      return new ethers.Contract(
        address,
        ERC721ABI,
        await provider.getSigner()
      );
    }
  }

  async function collectPawnBankContract(): Promise<
    ethers.Contract | undefined
  > {
    if (provider) {
      return new ethers.Contract(
        PAWN_BANK_ADDRESS,
        PawnBankABI,
        await provider.getSigner()
      );
    }
  }

  async function underwriteLoan(loanId: number, value: number): Promise<void> {
    const PawnBank = await collectPawnBankContract();
    if (PawnBank) {
      const loan: any = await PawnBank.pawnLoans(loanId);

      let underWriteAmount: BigNumber;
      if (loan.firstBidTime == 0) {
        underWriteAmount = ethers.utils.parseEther(value.toString());
      } else {
        const interest = await PawnBank.calculateTotalInterest(loanId, 120);
        underWriteAmount = ethers.utils
          .parseEther(value.toString())
          .add(interest);
      }

      try {
        const tx = await PawnBank.underwriteLoan(loanId, {
          value: underWriteAmount,
          gasLimit: 150000,
        });
        await tx.wait(1);
        toast.success("Successfully underwrote NFT.");
      } catch (e) {
        console.error(e);
        toast.error(`Error when attempting to underwrite NFT.`);
      }
    }
  }

  async function repayLoan(loanId: number): Promise<void> {
    const PawnBank = await collectPawnBankContract();
    if (PawnBank) {
      const contractRequired = await PawnBank.calculateRequiredRepayment(
        loanId,
        120
      );

      try {
        const tx = await PawnBank.repayLoan(loanId, {
          value: contractRequired,
          gasLimit: 300000,
        });
        await tx.wait(1);
        toast.success("Successfully repaid loan.");
      } catch (e) {
        console.error(e);
        toast.error(`Error when attempting to repay loan ${loanId}.`);
      }
    }
  }

  async function seizeLoan(loanId: number): Promise<void> {
    const PawnBank = await collectPawnBankContract();
    if (PawnBank) {
      try {
        const tx = await PawnBank.seizeNFT(loanId, { gasLimit: 120000 });
        await tx.wait(1);
        toast.success("Successfully seized NFT from loan.");
      } catch (e) {
        console.error(e);
        toast.error(`Error when attempting to seize NFT from loan ${loanId}.`);
      }
    }
  }


  async function drawLoan(loanId: number): Promise<void> {
    const PawnBank = await collectPawnBankContract();
    if (PawnBank) {
      try {
        const tx = await PawnBank.drawLoan(loanId, { gasLimit: 75000 });
        await tx.wait(1);
        toast.success("Successfully drew from loan.");
      } catch (e) {
        console.error(e);
        toast.error(`Error when attempting to draw from loan ${loanId}.`);
      }
    }
  }

  async function cancelLoan(loanId: number): Promise<void> {
    const PawnBank = await collectPawnBankContract();
    if (PawnBank) {
      try {
        const tx = await PawnBank.cancelLoan(loanId, { gasLimit: 75000 });
        await tx.wait(1);
        toast.success("Successfully cancelled loan.");
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function createLoan(
    contract: string,
    id: string,
    rate: number,
    amount: number,
    completion: number,
    metadata: Record<string, string>
  ): Promise<number | undefined> {
    const nft = await collectERC721Contract(contract);
    const PawnBank = await collectPawnBankContract();

    if (nft && PawnBank) {
      await axios.post("/api/metadata", {
        tokenAddress: contract,
        tokenId: id,
        ...metadata,
      });

      const tx = await nft.approve(PAWN_BANK_ADDRESS, id, { gasLimit: 50000 });
      await tx.wait(1);

      const pawn = await PawnBank.createLoan(
        contract,
        id,
        rate,
        ethers.utils.parseEther(amount.toString()),
        Math.round(completion / 1000),
        { gasLimit: 350000 }
      );
      const confirmed_tx = await pawn.wait(1);
      const creation_event = confirmed_tx.events.filter(
        (event) => event && "event" in event && event.event === "LoanCreated"
      )[0];
      return creation_event.args[0].toString();
    }
  }

  return {
    createLoan,
    drawLoan,
    seizeLoan,
    cancelLoan,
    underwriteLoan,
    repayLoan,
  };
}

export const loan = createContainer(useLoan);
