//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

// ============ Imports ============
import "abdk-libraries-solidity/ABDKMath64x64.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract StudentLoan {
  struct Loan {
    address tokenAddress;
    address tokenOwner;
    address lender;
    uint256 tokenId;
    uint256 interestRate;
    uint256 loanAmount;
    uint256 maxLoanAmount;
    uint256 loanAmountDrawn;
    uint256 firstBidTime;
    uint256 lastBidTime;
    uint256 historicInterest;
    uint256 loanCompleteTime;
  }

  // ============ Mutable storage ============
  uint256 public numLoans;
  mapping(uint256 => Loan) public loans;

  // ============ Events ============
  event LoanCreated(
    uint256 id,
    address indexed owner,
    address tokenAddress,
    uint256 tokenId,
    uint256 maxLoanAmount,
    uint256 loanCompleteTime
  );
  event LoanUnderwritten(uint256 id, address lender);
  event LoanDrawn(uint256 id);
  event LoanRepayed(uint256 id, address lender, address repayer);
  event LoanCancelled(uint256 id);
  event LoanSeized(uint256 id, address lender, address caller);

  // ============ Functions ============

  /**
   * Enables an NFT owner to create a loan, specifying parameters
   * @param _tokenAddress NFT token address
   * @param _tokenId NFT token id
   * @param _interestRate percentage fixed interest rate for period
   * @param _maxLoanAmount maximum allowed Ether bid
   * @param _loanCompleteTime time of loan completion
   * @return Loan id
   */
  function createLoan(
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _interestRate,
    uint256 _maxLoanAmount,
    uint256 _loanCompleteTime
  ) external returns (uint256) {
    require(_loanCompleteTime > block.timestamp, "Can't create loan in past");
    uint256 loanId = ++numLoans;

    IERC721(_tokenAddress).transferFrom(msg.sender, address(this), _tokenId);

    loans[loanId].tokenAddress = _tokenAddress;
    loans[loanId].tokenOwner = msg.sender;
    loans[loanId].tokenId = _tokenId;
    loans[loanId].interestRate = _interestRate;
    loans[loanId].maxLoanAmount = _maxLoanAmount;
    loans[loanId].loanCompleteTime = _loanCompleteTime;

    emit LoanCreated(
      loanId,
      msg.sender,
      _tokenAddress,
      _tokenId,
      _maxLoanAmount,
      _loanCompleteTime
    );

    return loanId;
  }

  function calculateInterestAccrued(uint256 _loanId, uint256 _future)
    public
    view
    returns (uint256)
  {
    Loan memory loan = loans[_loanId];
    uint256 _secondsAsTopBid = block.timestamp + _future - loan.lastBidTime;
    uint256 _secondsSinceFirstBid = loan.loanCompleteTime - loan.firstBidTime;
    int128 _durationAsTopBid = ABDKMath64x64.divu(_secondsAsTopBid, _secondsSinceFirstBid);
    int128 _interestRate = ABDKMath64x64.divu(loan.interestRate, 100);
    uint256 _maxInterest = ABDKMath64x64.mulu(_interestRate, loan.loanAmount);
    return ABDKMath64x64.mulu(_durationAsTopBid, _maxInterest);
  }

  /**
   * Helper: Calculates required additional capital (over topbid) to outbid loan
   * @param _loanId Loan id
   * @param _future allows calculating required additional capital in future
   * @return required interest payment to cover current top bidder
   */
  function calculateTotalInterest(uint256 _loanId, uint256 _future) public view returns (uint256) {
    Loan memory loan = loans[_loanId];
    return loan.historicInterest + calculateInterestAccrued(_loanId, _future);
  }

  /**
   * Helper: Calculate required capital to repay loan
   * @param _loanId Loan id
   * @param _future allows calculating require payment in future
   * @return required loan repayment in Ether
   */
  function calculateRequiredRepayment(uint256 _loanId, uint256 _future)
    public
    view
    returns (uint256)
  {
    Loan memory loan = loans[_loanId];
    return loan.loanAmountDrawn + calculateTotalInterest(_loanId, _future);
  }

  /**
   * Enables a lender/bidder to underwrite a loan, given it is the top bid
   * @param _loanId id of loan to underwrite
   * @dev Requires an unpaid loan, where currentBid < newBid <= maxBid
   */
  function underwriteLoan(uint256 _loanId) external payable {
    Loan storage loan = loans[_loanId];
    require(msg.value > 0, "Can't underwrite with 0 Ether.");
    require(loan.tokenOwner != address(0), "Can't underwrite a repaid loan.");
    require(loan.loanCompleteTime >= block.timestamp, "Can't underwrite expired loan.");

    if (loan.firstBidTime != 0) {
      uint256 _totalInterest = calculateTotalInterest(_loanId, 0);
      uint256 _bidPayout = loan.loanAmount + _totalInterest;
      require(_bidPayout < msg.value, "Can't underwrite < top lender.");
      require(loan.maxLoanAmount + _totalInterest >= msg.value, "Can't underwrite > max loan.");

      // Buyout current top bidder
      (bool sent, ) = payable(loan.lender).call{value: _bidPayout}("");
      require(sent == true, "Failed to buyout top bidder.");
      loan.historicInterest += _totalInterest;
      loan.loanAmount = msg.value - _totalInterest;
    } else {
      require(loan.maxLoanAmount >= msg.value, "Can't underwrite > max loan.");
      loan.firstBidTime = block.timestamp;
      loan.loanAmount = msg.value;
    }

    loan.lender = msg.sender;
    loan.lastBidTime = block.timestamp;
    emit LoanUnderwritten(_loanId, msg.sender);
  }

  /**
   * Enables NFT owner to draw capital from top bid
   * @param _loanId id of loan to draw from
   */
  function drawLoan(uint256 _loanId) external {
    Loan storage loan = loans[_loanId];
    require(loan.tokenOwner == msg.sender, "Must be NFT owner to draw.");
    require(loan.loanAmountDrawn < loan.loanAmount, "Max draw capacity reached.");

    uint256 _availableCapital = loan.loanAmount - loan.loanAmountDrawn;
    loan.loanAmountDrawn = loan.loanAmount;
    // Draw the maximum available loan capital
    (bool sent, ) = payable(msg.sender).call{value: _availableCapital}("");
    require(sent, "Failed to draw capital.");
    emit LoanDrawn(_loanId);
  }

  /**
   * Enables anyone to repay a loan on behalf of owner
   * @param _loanId id of loan to repay
   */
  function repayLoan(uint256 _loanId) external payable {
    Loan storage loan = loans[_loanId];
    require(loan.tokenOwner != address(0), "Can't repay paid loan.");
    require(loan.firstBidTime != 0, "Can't repay loan with 0 bids.");
    require(loan.loanCompleteTime >= block.timestamp, "Can't repay expired loan.");

    uint256 _totalInterest = calculateTotalInterest(_loanId, 0);
    uint256 _additionalCapital = loan.loanAmountDrawn + _totalInterest;
    require(msg.value >= _additionalCapital, "Insufficient repayment.");

    (bool sent, ) = payable(loan.lender).call{value: (loan.loanAmount + _totalInterest)}("");
    require(sent, "Failed to repay loan.");

    IERC721(loan.tokenAddress).transferFrom(address(this), loan.tokenOwner, loan.tokenId);

    loan.tokenOwner = address(0);
    emit LoanRepayed(_loanId, loan.lender, msg.sender);
  }

  /**
   * Enables owner to cancel loan
   * @param _loanId id of loan to cancel
   * @dev requires no active bids to be placed (else, use repay)
   */
  function cancelLoan(uint256 _loanId) external {
    Loan storage loan = loans[_loanId];
    require(loan.tokenOwner == msg.sender, "Must be NFT owner to cancel.");
    require(loan.firstBidTime == 0, "Can't cancel loan with >0 bids.");
    IERC721(loan.tokenAddress).transferFrom(address(this), msg.sender, loan.tokenId);
    loan.tokenOwner = address(0);
    emit LoanCancelled(_loanId);
  }

  /**
   * Enables anyone to seize NFT, for lender, on loan default
   * @param _loanId id of loan to seize collateral
   */
  function seizeNFT(uint256 _loanId) external {
    Loan memory loan = loans[_loanId];
    require(loan.tokenOwner != address(0), "Can't seize from repaid loan.");
    require(loan.loanCompleteTime < block.timestamp, "Can't seize before expiry.");
    IERC721(loan.tokenAddress).transferFrom(address(this), loan.lender, loan.tokenId);
    emit LoanSeized(_loanId, loan.lender, msg.sender);
  }
}
