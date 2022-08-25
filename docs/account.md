# Account

Create new wallets with user-given seed phrase or an auto-generated seed phrase.
The seedphrases are stored in plaintext within vscode. `DO NOT USE YOUR ACTUAL WALLET SEED PHRASE WITH THIS EXTENSION`.

Once an account has been created, you can

1. Request funds from faucet (if it has been set up)
2. Copy address (derived from prefix from the current chain config settings)
3. Copy mnemonic
4. Delete the account from vscode - the address and funds on-chain still persists. You can always reimport it again.
5. Open in Block Explorer (if it has been set up) 


![feature Account](/./images/account.gif)

If the RPC endpoint in the chain config is not reachable, the account balance cannot be fetched and is shown as `NaN`. Ensure the endpoint is reachable and run `cosmy-wasmy.refreshAccount` to fetch the account balances