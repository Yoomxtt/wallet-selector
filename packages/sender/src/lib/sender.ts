import isMobile from "is-mobile";
import {
  WalletModule,
  WalletBehaviourFactory,
  InjectedWallet,
  Action,
  Transaction,
  FunctionCallAction,
  Optional,
  waitFor,
} from "@near-wallet-selector/core";

import { InjectedSender } from "./injected-sender";

declare global {
  interface Window {
    near: InjectedSender | undefined;
  }
}

export interface SenderParams {
  iconUrl?: string;
}

const Sender: WalletBehaviourFactory<InjectedWallet> = ({
  options,
  metadata,
  emitter,
  logger,
}) => {
  let _wallet: InjectedSender | null = null;

  const isInstalled = async () => {
    try {
      return await waitFor(() => !!window.near?.isSender);
    } catch (e) {
      logger.log("Sender:isInstalled:error", e);

      return false;
    }
  };

  // TODO: Remove event listeners.
  const disconnect = async () => {
    if (!_wallet) {
      return;
    }

    _wallet.signOut();

    _wallet = null;

    emitter.emit("disconnected", null);
  };

  const getAccounts = () => {
    if (!_wallet) {
      return [];
    }

    const accountId = _wallet.getAccountId();

    if (!accountId) {
      return [];
    }

    return [{ accountId }];
  };

  const setupWallet = async (): Promise<InjectedSender> => {
    if (_wallet) {
      return _wallet;
    }

    const installed = await isInstalled();

    if (!installed) {
      throw new Error(`${metadata.name} not installed`);
    }

    _wallet = window.near!;

    try {
      // Add extra wait to ensure Sender's sign in status is read from the
      // browser extension background env.
      await waitFor(() => !!_wallet?.isSignedIn(), { timeout: 300 });
    } catch (e) {
      logger.log("Sender:init: haven't signed in yet", e);
    }

    _wallet.on("accountChanged", async (newAccountId) => {
      logger.log("Sender:onAccountChange", newAccountId);

      await disconnect();
    });

    _wallet.on("rpcChanged", (response) => {
      if (options.network.networkId !== response.rpc.networkId) {
        emitter.emit("networkChanged", null);
      }
    });

    return _wallet;
  };

  const getWallet = (): InjectedSender => {
    if (!_wallet) {
      throw new Error(`${metadata.name} not connected`);
    }

    return _wallet;
  };

  const isValidActions = (
    actions: Array<Action>
  ): actions is Array<FunctionCallAction> => {
    return actions.every((x) => x.type === "FunctionCall");
  };

  const transformActions = (actions: Array<Action>) => {
    const validActions = isValidActions(actions);

    if (!validActions) {
      throw new Error(
        `Only 'FunctionCall' actions types are supported by ${metadata.name}`
      );
    }

    return actions.map((x) => x.params);
  };

  const transformTransactions = (
    transactions: Array<Optional<Transaction, "signerId">>
  ) => {
    return transactions.map((transaction) => {
      return {
        receiverId: transaction.receiverId,
        actions: transformActions(transaction.actions),
      };
    });
  };

  return {
    getDownloadUrl() {
      return "https://chrome.google.com/webstore/detail/sender-wallet/epapihdplajcdnnkdeiahlgigofloibg";
    },

    isAvailable() {
      return !isMobile();
    },

    async connect() {
      const installed = await isInstalled();

      if (!installed) {
        return emitter.emit("uninstalled", null);
      }

      const wallet = await setupWallet();
      const accounts = getAccounts();

      // TODO: Sender returns no accounts when locked.
      //  We should wait until they've fixed this on their end.
      if (accounts.length) {
        return emitter.emit("connected", { accounts });
      }

      const { accessKey, error } = await wallet.requestSignIn({
        contractId: options.contractId,
        methodNames: options.methodNames,
      });

      if (!accessKey || error) {
        await disconnect();

        throw new Error(
          (typeof error === "string" ? error : error.type) ||
            "Failed to connect"
        );
      }

      emitter.emit("connected", { accounts: getAccounts() });
    },

    disconnect,

    getAccounts,

    async signAndSendTransaction({
      signerId,
      receiverId = options.contractId,
      actions,
    }) {
      logger.log("Sender:signAndSendTransaction", {
        signerId,
        receiverId,
        actions,
      });

      const wallet = getWallet();

      return wallet
        .signAndSendTransaction({
          receiverId,
          actions: transformActions(actions),
        })
        .then((res) => {
          if (res.error) {
            throw new Error(res.error);
          }

          // Shouldn't happen but avoids inconsistent responses.
          if (!res.response?.length) {
            throw new Error("Invalid response");
          }

          return res.response[0];
        });
    },

    async signAndSendTransactions({ transactions }) {
      logger.log("Sender:signAndSendTransactions", { transactions });

      const wallet = getWallet();

      return wallet
        .requestSignTransactions({
          transactions: transformTransactions(transactions),
        })
        .then((res) => {
          if (res.error) {
            throw new Error(res.error);
          }

          // Shouldn't happen but avoids inconsistent responses.
          if (!res.response?.length) {
            throw new Error("Invalid response");
          }

          return res.response;
        });
    },
  };
};

export function setupSender({
  iconUrl = "./assets/sender-icon.png",
}: SenderParams = {}): WalletModule<InjectedWallet> {
  return {
    id: "sender",
    type: "injected",
    name: "Sender",
    description: null,
    iconUrl,
    wallet: Sender,
  };
}
