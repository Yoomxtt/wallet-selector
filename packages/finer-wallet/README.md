# @near-wallet-selector/finer-wallet

This is the [FiNER Wallet](https://finerwallet.io/) package for NEAR Wallet Selector.
#### ⚠️ FiNER Wallet has been marked as deprecated. ⚠️
## Installation and Usage

The easiest way to use this package is to install it from the NPM registry:

```bash
# Using Yarn
yarn add @near-wallet-selector/finer-wallet

# Using NPM.
npm install @near-wallet-selector/finer-wallet
```

Then use it in your dApp:

```ts
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupFinerWallet } from "@near-wallet-selector/finer-wallet";

// FiNER Wallet for Wallet Selector can be setup without any params or it can take few optional params, see options below.
const nearWallet = setupFinerWallet({
  walletUrl: "finer://wallet.testnet.near.org",
  iconUrl: "https://<Wallet Icon URL Here>" // optional
});

const selector = await setupWalletSelector({
  network: "testnet",
  modules: [nearWallet],
});
```

## Options

- `walletUrl` (`string?`): Wallet URL used to redirect when signing transactions. This parameter is required when using custom network configuration.
- `iconUrl`: (`string?`): Image URL for the icon shown in the modal. This can also be a relative path or base64 encoded image. Defaults to `./assets/finer-wallet-icon.png`.
- `deprecated`: (`boolean?`): Deprecated is optional. Default is `false`.

## Assets

Assets such as icons can be found in the `/assets` directory of the package. Below is an example using Webpack:

```ts
import { setupFinerWallet } from "@near-wallet-selector/finer-wallet";
import finerWalletIconUrl from "@near-wallet-selector/finer-wallet/assets/finer-wallet-icon.png";

const wallet = setupFinerWallet({
  iconUrl: finerWalletIconUrl
});
```

## License

This repository is distributed under the terms of both the MIT license and the Apache License (Version 2.0).
