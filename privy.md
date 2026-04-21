> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard.

<Tip>
  Deploying your app across multiple domains or environments? Learn how to use [app
  clients](/basics/get-started/dashboard/app-clients) to customize Privy's behavior for different
  environments.
</Tip>

## Initializing Privy

In your project, **import the `PrivyProvider` component and wrap your app with it**.
The `PrivyProvider` must wrap *any* component or page that will use the Privy React SDK, and it is generally recommended to render it as close to the root of your application as possible.

<Tip>
  If you're new to React and using contexts, check out
  [these](https://react.dev/learn/thinking-in-react)
  [resources](https://react.dev/learn/passing-data-deeply-with-context)!
</Tip>

<Tabs>
  <Tab title="Ethereum">
    <CodeGroup>
      ```tsx NextJS theme={"system"}
      'use client';

      import {PrivyProvider} from '@privy-io/react-auth';

      export default function Providers({children}: {children: React.ReactNode}) {
        return (
          <PrivyProvider
            appId="your-privy-app-id"
            clientId="your-app-client-id"
            config={{
              // Create embedded wallets for users who don't have a wallet
              embeddedWallets: {
                ethereum: {
                  createOnLogin: 'users-without-wallets'
                }
              }
            }}
          >
            {children}
          </PrivyProvider>
        );
      }
      ```

      ```tsx Create React App theme={"system"}
      import React from 'react';
      import ReactDOM from 'react-dom/client';

      import './index.css';

      import {PrivyProvider} from '@privy-io/react-auth';

      import App from './App';

      const root = ReactDOM.createRoot(document.getElementById('root'));

      root.render(
        <React.StrictMode>
          <PrivyProvider
            appId="your-privy-app-id"
            clientId="your-app-client-id"
            config={{
              // Create embedded wallets for users who don't have a wallet
              embeddedWallets: {
                ethereum: {
                  createOnLogin: 'users-without-wallets'
                }
              }
            }}
          >
            <App />
          </PrivyProvider>
        </React.StrictMode>
      );
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Solana">
    <CodeGroup>
      ```tsx NextJS theme={"system"}
      'use client';

      import {PrivyProvider} from '@privy-io/react-auth';

      export default function Providers({children}: {children: React.ReactNode}) {
        return (
          <PrivyProvider
            appId="your-privy-app-id"
            clientId="your-app-client-id"
            config={{
              // Create embedded wallets for users who don't have a wallet
              embeddedWallets: {
                solana: {
                  createOnLogin: 'users-without-wallets'
                }
              }
            }}
          >
            {children}
          </PrivyProvider>
        );
      }
      ```

      ```tsx Create React App theme={"system"}
      import React from 'react';
      import ReactDOM from 'react-dom/client';

      import './index.css';

      import {PrivyProvider} from '@privy-io/react-auth';

      import App from './App';

      const root = ReactDOM.createRoot(document.getElementById('root'));

      root.render(
        <React.StrictMode>
          <PrivyProvider
            appId="your-privy-app-id"
            clientId="your-app-client-id"
            config={{
              // Create embedded wallets for users who don't have a wallet
              embeddedWallets: {
                solana: {
                  createOnLogin: 'users-without-wallets'
                }
              }
            }}
          >
            <App />
          </PrivyProvider>
        </React.StrictMode>
      );
      ```
    </CodeGroup>

    <Info>
      {' '}

      To use external Solana wallets, you must pass `toSolanaWalletConnectors()` to the
      `externalWallets` prop in your `PrivyProvider` config. Learn more
      [here](/wallets/connectors/setup/configuring-external-connector-chains).
    </Info>
  </Tab>
</Tabs>

## Configuration

The `PrivyProvider` component accepts the following props:

<ParamField path="appId" type="string" required>
  Your Privy App ID. You can find this in the Privy Dashboard.
</ParamField>

<ParamField path="clientId" type="string">
  (Optional) A client ID to be used for this app client. Learn more about app clients
  [here](/basics/get-started/dashboard/app-clients).
</ParamField>

<ParamField path="config" type="Object">
  Configuration options for the Privy SDK.
</ParamField>

<Info>
  For more information on the `config` object, look under **React > Advanced** for guides like
  [customizing appearance](/basics/react/advanced/configuring-appearance) for our UI components and
  [configuring networks](/basics/react/advanced/configuring-evm-networks).
</Info>

## Waiting for Privy to be ready

When the `PrivyProvider` is first rendered on your page, the Privy SDK will initialize some state about the current user. This might include checking if the user has a wallet connected, refreshing expired auth tokens, fetching up-to-date user data, and more.

**It's important to wait until the `PrivyProvider` has finished initializing *before* you consume Privy's state and interfaces**, to ensure that the state you consume is accurate and not stale.

To determine whether the Privy SDK has fully initialized on your page, **check the `ready` Boolean returned by the `usePrivy` hook.** When `ready` is true, Privy has completed initialization, and your app can consume Privy's state and interfaces.

```tsx theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

function YourComponent() {
  const {ready} = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  // Now it's safe to use other Privy hooks and state
  return <div>Privy is ready!</div>;
}
```

<Info>
  **Using wallets?** Use the [ready](/wallets/wallets/get-a-wallet/get-connected-wallet) indicator
  from the `useWallets` hook to wait for wallets to complete loading.
</Info>

<CardGroup cols={2}>
  <Card title="Quickstart Guide" icon="rocket" href="/basics/react/quickstart">
    Learn how to log users in and transact with embedded wallets
  </Card>

  <Card title="NextJS starter repo" icon="code" href="https://github.com/privy-io/examples/tree/main/privy-next-starter">
    Check out the NextJS app starter repo for a complete example integration
  </Card>

  <Card title="React starter repo" icon="code" href="https://github.com/privy-io/examples/tree/main/privy-react-starter">
    Check out the React app starter repo for a complete example integration
  </Card>

  <Card title="Whitelabel starter repo" icon="code" href="https://github.com/privy-io/examples/tree/main/privy-react-whitelabel-starter">
    Check out the whitelabel starter for a complete whitelabel example integration
  </Card>
</CardGroup>


> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your React app

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/react/setup) guide.

## 1. Enable a user to log in via email

<Tip>
  This quickstart guide will demonstrate how to authenticate a user with a one time password as an
  example, but Privy supports many authentication methods. Explore our [Authentication
  docs](/authentication/overview) to learn about other methods such as socials, passkeys, and
  external wallets to authenticate users in your app.
</Tip>

**To authenticate a user via their email address, use the React SDK's `useLoginWithEmail` hook.**

```tsx theme={"system"}
import {useLoginWithEmail} from '@privy-io/react-auth';
...
const {sendCode, loginWithCode} = useLoginWithEmail();
```

Ensure that this hook is mounted in a component that is wrapped by the [PrivyProvider](/basics/react/setup#initializing-privy).
You can use the returned methods **`sendCode`** and **`loginWithCode`** to authenticate your user per the instructions below.

### Send an OTP

Send a one-time passcode (OTP) to the user's **email** by passing their email address to the **`sendCode`** method returned from `useLoginWithEmail`:

```tsx theme={"system"}
import {useState} from 'react';
import {useLoginWithEmail} from '@privy-io/react-auth';

export default function LoginWithEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const {sendCode, loginWithCode} = useLoginWithEmail();

  return (
    <div>
      <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
      <button onClick={() => sendCode({email})}>Send Code</button>
      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
      <button onClick={() => loginWithCode({code})}>Login</button>
    </div>
  );
}
```

## 2. Create an embedded wallet for the user

Your app can configure Privy to [**automatically** create wallets](/basics/react/advanced/automatic-wallet-creation) for your users as part of their **login** flow. The embedded wallet will be generated and linked to the user object upon authentication.

Alternatively your app can [**manually** create wallets](/wallets/wallets/create/create-a-wallet) for users when required.

<Info>Privy can provision wallets for your users on both **Ethereum** and **Solana**.</Info>

## 3. Send a transaction with the embedded wallet

<Tabs>
  <Tab title="EVM">
    With the users' embedded wallet, your application can now prompt the user to sign and send transactions.

    ```tsx theme={"system"}
    import {useSendTransaction} from '@privy-io/react-auth';
    export default function SendTransactionButton() {
      const {sendTransaction} = useSendTransaction();
      const onSendTransaction = async () => {
        sendTransaction({
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: 100000
        });
      };

      return <button onClick={onSendTransaction}>Send Transaction</button>;
    }
    ```

    <Tip>
      [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions with
      the embedded wallet. Privy enables you to take many actions on the embedded wallet, including
      [sign a message](/wallets/using-wallets/ethereum/sign-a-message), [sign typed
      data](/wallets/using-wallets/ethereum/sign-typed-data), and [sign a
      transaction](/wallets/using-wallets/ethereum/sign-a-transaction).
    </Tip>
  </Tab>

  <Tab title="Solana">
    With the users' embedded wallet, your application can now prompt the user to sign and send transactions.

    ```tsx theme={"system"}
    import {useSendTransaction} from '@privy-io/react-auth/solana';
    import {Connection, Transaction, VersionedTransaction, SystemProgram, LAMPORTS_PER_SOL} from '@solana/web3.js';

    export default function SendTransactionButton() {
      const {sendTransaction} = useSendTransaction();
      const connection = new Connection('https://api.mainnet-beta.solana.com');

      // Create a new transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey('RECIPIENT_ADDRESS_HERE'),
          lamports: 0.1 * LAMPORTS_PER_SOL
        })
      );

      const onSendTransaction = async () => {
        sendTransaction({
          transaction,
          connection
        });
      }

      return <button onClick={onSendTransaction}>Send Transaction</button>;

    }
    ```

    <Tip>
      [Learn more](/wallets/using-wallets/solana/send-a-transaction) about sending transactions with
      the embedded wallet. Privy enables you to take many actions on the embedded wallet, including [send a transaction](/wallets/using-wallets/solana/send-a-transaction), [sign a message](/wallets/using-wallets/solana/sign-a-message), and [sign a
      transaction](/wallets/using-wallets/solana/sign-a-transaction).
    </Tip>
  </Tab>
</Tabs>

Congratulations, you have successfully been able to integrate Privy authentication and wallet into your React application!
