import { WalletModule } from "../wallets/Wallet";

export type BuiltInWalletId = "near-wallet" | "sender-wallet" | "ledger-wallet";
export type NetworkId = "mainnet" | "betanet" | "testnet";
export type Theme = "dark" | "light" | "auto";

export interface Options {
  wallets: Array<WalletModule>;
  networkId: NetworkId;
  contract: {
    contractId: string;
    methodNames?: Array<string>;
  };
  ui?: {
    theme?: Theme;
    description?: string;
  };
}
