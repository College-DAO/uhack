`StudentLoan.sol` issues StudentLoans that track all details about an individual loan. Users can `createLoan`, `underwriteLoan`, `drawLoan`, `repayLoan`, `cancelLoan`, or `seizeNFT`.

## Run locally

```bash
# Install dependencies
npm install

# Optional: compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy contracts
npx hardhat run scripts/deploy.ts --network sepolia
```
