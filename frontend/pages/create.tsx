import axios from "axios"; // Axios requests
import { eth } from "@state/eth"; // State: ETH
import { loan } from "@state/loan"; // State: Loans
import { toast } from "react-toastify"; // Toast notifications
import Layout from "@components/Layout"; // Layout wrapper
import DatePicker from "react-datepicker"; // Datepicker
import LoanCard from "@components/LoanCard"; // Component: Loancard
import styles from "@styles/pages/Create.module.scss"; // Component styles
import { ReactElement, useEffect, useState } from "react"; // State management
import { NextRouter, useRouter } from "next/dist/client/router"; // Next router

enum State {
  selectNFT = 0,
  setTerms = 1,
}

export default function Create() {
  const router: NextRouter = useRouter();

  const { address, unlock }: { address: string | null; unlock: Function } =
    eth.useContainer();
  const { createLoan }: { createLoan: Function } = loan.useContainer();

  const [state, setState] = useState<number>(State.selectNFT);
  const [numOSNFTs, setNumOSNFTs] = useState<number>(0);
  const [NFTList, setNFTList] = useState<Object[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<Object | null>(null);
  const [interest, setInterest] = useState<number>(5);
  const [maxAmount, setMaxAmount] = useState<number>(3);
  const [loanCompleted, setLoanCompleted] = useState<number>(
    new Date().setDate(new Date().getDate() + 7)
  );

  function renderActionButton() {
    if (!address) {
      return <button onClick={() => unlock()}>Unlock</button>;
    } else if (state === State.selectNFT && selected) {
      return (
        <button onClick={() => setState(State.setTerms)}>Craft terms</button>
      );
    } else if (state === State.selectNFT) {
      return <button disabled>Must select NFT</button>;
    } else if (
      state === State.setTerms &&
      (!interest || !maxAmount || !loanCompleted)
    ) {
      return <button disabled>Must enter terms</button>;
    } else if (state === State.setTerms && !loading) {
      return <button onClick={createLoanWithLoading}>Create loan</button>;
    } else if (state === State.setTerms) {
      return <button disabled>Creating loan...</button>;
    }
  }

  function filter721(assets: Object[]): Object[] {
    return assets.filter(
      (asset) => asset.asset_contract.schema_name === "ERC721"
    );
  }

  async function collectNFTs(): Promise<void> {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://testnet-api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=${numOSNFTs}&limit=9`
      );
      setNumOSNFTs(response.data.assets.length);
      setNFTList([...NFTList, ...filter721(response.data.assets)]);
    } catch {
      toast.error("Error when collecting wallet NFT's.");
    }
    setLoading(false);
  }

  async function createLoanWithLoading(): Promise<void> {
    setLoading(true);
    try {
      const loanId = await createLoan(
        selected.asset_contract.address,
        selected.token_id,
        interest,
        maxAmount,
        loanCompleted,
        {
          imageURL: selected.image_preview_url ?? "",
          name: selected.name ?? "Untitled",
          description: selected.description ?? "No Description",
        }
      );
      router.push(`/loan/${loanId}`);
    } catch {
      toast.error("Error when attempting to create loan.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (address) collectNFTs();
  }, [address]);

  return (
    <Layout>
      <div className="sizer">
        <div className={styles.create}>
          <h1>Create loan</h1>
          <p>Select an NFT and choose your terms.</p>

          <div className={styles.create__action}>
            <div className={styles.create__action_phase}>
              <div
                className={
                  state === State.selectNFT
                    ? styles.create__action_active
                    : undefined
                }
              >
                <span>Select NFT</span>
              </div>

              <div
                className={
                  state === State.setTerms
                    ? styles.create__action_active
                    : undefined
                }
              >
                <span>Set Terms</span>
              </div>
            </div>

            <div className={styles.create__action_content}>
              {address ? (
                state === State.selectNFT ? (
                  <div className={styles.create__action_select}>
                    {NFTList.length > 0 ? (
                      <>
                        <div className={styles.create__action_select_list}>
                          {NFTList.map((nft, i) => {
                            return (
                              <LoanCard
                                key={i}
                                onClickHandler={() => setSelected(nft)}
                                selected={
                                  selected?.token_id === nft.token_id &&
                                  selected?.asset_contract?.address ===
                                    nft.asset_contract.address
                                }
                                imageURL={nft.image_preview_url}
                                name={nft.name ?? "Untitled"}
                                description={
                                  nft.description ?? "No description"
                                }
                                contractAddress={nft.asset_contract.address}
                                tokenId={nft.token_id}
                              />
                            );
                          })}
                        </div>

                        {numOSNFTs % 9 == 0 && !loading ? (
                          <div className={styles.create__action_select_more}>
                            <button onClick={collectNFTs}>
                              Load more NFTs
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <NoOwnedNFTs />
                    )}
                    {loading ? (
                      <CreateLoadingNFTs />
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.create__action_terms}>
                    <div>
                      <h3>NFT Contract Address</h3>
                      <p>Contract address for ERC-721 NFT.</p>
                      <input
                        type="text"
                        value={selected.asset_contract.address}
                        disabled
                      />
                    </div>

                    <div>
                      <h3>NFT ID</h3>
                      <p>Unique identifier for your NFT.</p>
                      <input type="text" value={selected.token_id} disabled />
                    </div>

                    <div>
                      <h3>Interest Rate</h3>
                      <p>
                        Maximum interest rate you are willing to pay for these
                        terms.
                      </p>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="5"
                        min="0.01"
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                      />
                    </div>

                    <div>
                      <h3>Max Loan Amount</h3>
                      <p>
                        Maximum loaned Ether you are willing to pay interest
                        for.
                      </p>
                      <input
                        type="number"
                        placeholder="3"
                        step="0.01"
                        min="0"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <h3>Loan Completion Date</h3>
                      <p>Date of loan termination.</p>
                      <DatePicker
                        selected={loanCompleted}
                        onChange={(date) => setLoanCompleted(date)}
                        showTimeSelect
                        minDate={new Date()}
                      />
                    </div>
                  </div>
                )
              ) : (<CreateUnauthenticated />)
              }
            </div>
          </div>

          <div className={styles.create__button}>{renderActionButton()}</div>
        </div>
      </div>
    </Layout>
  );
}

function CreateUnauthenticated(): ReactElement {
  return (
    <div className={styles.create__action_content_unauthenticated}>
      <img src="/vectors/unlock.svg" height="30px" alt="Unlock" />
      <h3>Unlock wallet</h3>
      <p>Please connect your wallet to get started.</p>
    </div>
  );
}

function CreateLoadingNFTs(): ReactElement {
  return (
    <div className={styles.create__action_loading}>
      <span>Loading NFTs...</span>
    </div>
  );
}

function NoOwnedNFTs(): ReactElement {
  return (
    <div className={styles.create__action_content_unauthenticated}>
      <img src="/vectors/empty.svg" alt="Empty" height="30px" />
      <h3>No NFTs in wallet.</h3>
      <p>Please mint NFTs before trying to create loan.</p>
    </div>
  );
}
