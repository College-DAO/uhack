import type { ReactElement } from "react"; // Types
import styles from "@styles/components/LoanCard.module.scss"; // Component styles

export default function LoanCard({
  imageURL,
  name,
  description,
  contractAddress,
  tokenId,
  selected = false,
  onClickHandler,
  loanDetails,
  ...props
}: {
  imageURL: string;
  name: string;
  description: string;
  contractAddress: string;
  tokenId: string;
  selected: boolean;
  onClickHandler: Function;
  loanDetails?: Record<string, number>;
}): ReactElement {
  return (
    <button
      className={selected ? `${styles.card} ${styles.active}` : styles.card}
      onClick={() => onClickHandler()}
      {...props}
    >
      <div>
        <img src={imageURL} alt="NFT Image" />
      </div>

      <h3>{name}</h3>
      <div>
        <p>{description}</p>
      </div>
      <span>
        {contractAddress.substr(0, 6) +
          "..." +
          contractAddress.slice(contractAddress.length - 4)}{" "}
        : {tokenId}
      </span>

      {loanDetails && loanDetails.interest ? (
        <div className={styles.card__loan}>
          <div>
            <h4>Interest</h4>
            <h2>{loanDetails.interest}%</h2>
          </div>

          <div>
            <h4>Raised (ETH)</h4>
            <h2>
              {loanDetails.amount.toFixed(2)} / {loanDetails.max.toFixed(2)}
            </h2>
          </div>
        </div>
      ) : null}
    </button>
  );
}
