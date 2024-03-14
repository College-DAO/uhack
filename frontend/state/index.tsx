import { eth } from "@state/eth"; // Eth state provider
import { loan } from "@state/loan"; // Loan functions state provider
import type { ReactElement } from "react"; // Types

export default function StateProvider({
  children,
}: {
  children: ReactElement[];
}): ReactElement {
  return (
    <eth.Provider>
      <loan.Provider>{children}</loan.Provider>
    </eth.Provider>
  );
}
