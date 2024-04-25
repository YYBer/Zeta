// not yet implement the storage deposit
import { KeyPair, keyStores, Near, Contract, connect, utils } from "near-api-js";
import { TransferAction, WalletSelector } from '@near-wallet-selector/core';

// export interface NEP141_Contract extends Contract {
//     ft_balance_of: (args: { account_id: string }) => Promise<string>;
//     ft_transfer: (args: { receiver_id: string; amount: string; memo?: string }, gas: string, attachedDeposit: string) => Promise<void>;
// }

export interface Payload {
    userId: string;
    receiverId: string;
    amount: string;
    symbol: string;
}

export const TOKEN_LIST: { [key: string]: string } = {
    NEAR: 'NEAR',
    PTC: 'ft3.0xpj.testnet',
}

// export async function getBalance(contract: NEP141_Contract, payload: Payload): Promise<void> {
//     try {
//         const balance = await contract.ft_balance_of({ account_id: payload.userId });
//         console.log(`Balance of ${payload.symbol} in ${payload.userId}: ${balance}`);
//     } catch (error) {
//         console.error(`Failed to fetch balance of ${payload.symbol} for ${payload.userId}:`, error);
//     }
// }

// export async function transferToken(contract: NEP141_Contract, payload: Payload): Promise<void> {
//     try {
//         await contract.ft_transfer({
//             receiver_id: payload.receiverId,
//             amount: payload.amount.toString(),
//         },
//         "300000000000000", // gas
//         "1", // attached deposit in yoctoNEAR (optional)
//         );
//         console.log(`Successfully transferred ${payload.amount.toString()} ${payload.symbol} to ${payload.receiverId}`);
//     } catch (error) {
//         console.error(`Failed to transfer ${payload.amount.toString()} ${payload.symbol} to ${payload.receiverId}:`, error);
//     }
// }

// export async function init(contractId: string, walletSelector: WalletSelector): Promise<NEP141_Contract> {
//     const wallet = await walletSelector.wallet();
//     const accounts = await wallet.getAccounts();
//     if (!accounts.length) {
//         throw new Error('No accounts found. Please connect to a NEAR wallet.');
//     }
//     const account = accounts[0];

//     // Here's the contract init part
//     const config = {
//         // using wallet selector doesn't need KeyStore.
//         networkId: 'testnet',
//         nodeUrl: 'https://rpc.testnet.near.org',
//         walletUrl: 'https://wallet.testnet.near.org',
//         helperUrl: 'https://helper.testnet.near.org',
//         explorerUrl: 'https://explorer.testnet.near.org',
//     };

//     const near: Near = await connect(config);
//     return new Contract(
//         await near.account(account.accountId),
//         contractId, // token contract id
//         {
//             viewMethods: ["ft_balance_of"],
//             changeMethods: ["mint", "storage_deposit", "ft_transfer"],
//             //useLocalViewExecution: false,
//         }
//     ) as NEP141_Contract;
// }

export async function TransferNear(walletSelector: WalletSelector, payload: Payload): Promise<void> {
    const wallet = await walletSelector.wallet();

    // Create the transfer action
    const transferAction: TransferAction = {
        type: "Transfer",
        params: {
            deposit: (BigInt(payload.amount) * BigInt('1000000000000000000000000')).toString(), // Amount in yoctoNEAR
        },
    };

    try {
        // Use the wallet to sign and send the transaction with the transfer action
        const result = await wallet.signAndSendTransaction({
            receiverId: payload.receiverId,
            actions: [transferAction],
        });
        
        console.log(`Successfully transferred ${payload.amount.toString()} NEAR to ${payload.receiverId}`);
    } catch (error) {
        console.error(`Failed to transfer ${payload.amount.toString()} NEAR to ${payload.receiverId}:`, error);
    }
}