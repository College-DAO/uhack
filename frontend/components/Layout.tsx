import Link from "next/link"; // Dynamic routing
import { eth } from "@state/eth"; // State management
import type { ReactElement } from "react"; // Types
import NextNProgress from "nextjs-progressbar"; // Navigation progress bar
import styles from "@styles/components/Layout.module.scss"; // Component styles
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"; // Jazzicon

/**
 * Layout wrapper for application
 * @param {ReactElement} children to inject into content section
 * @returns {ReactElement} containing layout
 */
export default function Layout({
  children,
}: {
  children: ReactElement;
}): ReactElement {
  return (
    <div>
      <NextNProgress
        color="#000000"
        startPosition={0.3}
        stopDelayMs={200}
        height={3}
        options={{
          showSpinner: false,
        }}
      />

      <Header />
      <div className={styles.layout__content}>{children}</div>
      <Footer />
    </div>
  );
}

function Header(): ReactElement {
  const { address, unlock }: { address: null | string; unlock: Function } =
    eth.useContainer();

  return (
    <div className={styles.layout__header}>
      <div className={styles.layout__header_logo}>
        <Link href="/">
          <a>
            <img src="/vectors/logo.png" alt="logo" width="35" height="35" />
          </a>
        </Link>
      </div>

      <div className={styles.layout__header_actions}>
        <Link href="/create">
          <a>Create loan</a>
        </Link>

        <button onClick={() => unlock()}>
          {address ? (
            <>
              <span>
                {address.substr(0, 6) +
                  "..." +
                  address.slice(address.length - 4)}
              </span>

              <Jazzicon diameter={16} seed={jsNumberForAddress(address)} />
            </>
          ) : (
            "Unlock"
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Bottom footer
 * @returns {ReactElement} bottom footer component
 */
function Footer(): ReactElement {
  return (
    <div className={styles.layout__footer}>
      {/* Credits */}
      <span>
        Inspired by{" "}
        <a
          href="https://twitter.com/MarkBeylin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mark
        </a>
        . Developed by{" "}
        <a
          href="https://twitter.com/_anishagnihotri"
          target="_blank"
          rel="noopener noreferrer"
        >
          Anish
        </a>
        .
      </span>
    </div>
  );
}
