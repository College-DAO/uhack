import axios from "axios"; // Axios
import Link from "next/link"; // Routing
import Layout from "@components/Layout"; // Layout wrapper
import LoanCard from "@components/LoanCard"; // LoanCard component
import styles from "@styles/pages/Home.module.scss"; // Component styles
import { useRouter } from "next/dist/client/router"; // Router
import type { LoanWithMetadata } from "@utils/types"; // Types
import { ReactElement, useState, useEffect } from "react"; // React

export default function Home(): ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [loans, setLoans] = useState<LoanWithMetadata[]>([]);

  async function collectLoans(): Promise<void> {
    setLoading(true);
    const { data } = await axios.get("/api/loans");
    setLoans(data);
    setLoading(false);
  }

  useEffect(() => {
    collectLoans();
  }, []);

  return (
    <Layout>
      <div>
        <div className={styles.home__cta}>
          <h1>Borrow for your education</h1>
          <p>
            P2P Student Loans is a hybrid lending platform unlocking
            alternative financing options and opportunities to earn fixed rewards.
          </p>

          <div>
            <Link href="/create">
              <a>Create loan</a>
            </Link>
          </div>
        </div>
        <div className={styles.home__feature}>
          <div className="sizer">
            <h2>All loans</h2>
            <p>Retrieved {loans.length} loans.</p>

            {loading ? (
              <div className={styles.home__feature_text}>
                <h3>Loading loans...</h3>
                <p>Please wait as we collect loans from the blockchain.</p>
              </div>
            ) : loans.length == 0 ? (
              <div className={styles.home__feature_text}>
                <h3>No Loans Found</h3>
                <p>Create a loan!</p>
              </div>
            ) : (
              <div className={styles.home__feature_loans}>
                {loans.map((loan, i) => {
                  return (
                    <LoanCard
                      key={i}
                      name={loan.name}
                      description={loan.description}
                      contractAddress={loan.tokenAddress}
                      imageURL={loan.imageURL}
                      tokenId={loan.tokenId.toString()}
                      onClickHandler={() => router.push(`/loan/${loan.loanId}`)}
                      loanDetails={{
                        interest: loan.interestRate,
                        amount: loan.loanAmount,
                        max: loan.maxLoanAmount,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
