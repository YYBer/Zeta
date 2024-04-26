// implemented transferNear, transferToken, depositStorageForReceiver, getBalance, and getReceiverStorageBalance
// unregister should be implemented in the future
import { KeyPair, keyStores, Near, Contract, connect, WalletConnection, utils, Account } from "near-api-js";
import { FunctionCallAction, TransferAction, WalletSelector } from '@near-wallet-selector/core';

export interface NEP141_Contract extends Contract {
    // ft_transfer: (args: { receiver_id: string; amount: string; memo?: string }, gas: string, attachedDeposit: string) => Promise<void>;
    ft_balance_of: (args: { account_id: string }) => Promise<string>;
    // storage_deposit: (args: { account_id: string }) => Promise<void>;
    storage_balance_of: (args: { account_id: string }) => Promise<string>;
}

export interface Payload {
    userId: string;
    receiverId: string;
    amount: string;
    symbol: string;
    // added:
    //memo: string | null;
}
const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';
const STORAGE_DEPOSIT_AMOUNT = '1250000000000000000000';

// Can add your own NEP-141 token here
export const TOKEN_LIST: { [key: string]: string } = {
    NEAR: 'NEAR',
    PTC: 'ft9.0xpj.testnet',
}

export async function depositStorageForReceiver(walletSelector: WalletSelector, payload: Payload): Promise<void> {
    const wallet = await walletSelector.wallet();
    const args = {
        account_id: payload.receiverId,
    };
    const contractId = TOKEN_LIST[payload.symbol]

    const storage_deposit: FunctionCallAction = {
        type: "FunctionCall",
        params: {
            methodName: "storage_deposit",
            args: args,
            gas: THIRTY_TGAS,
            deposit: STORAGE_DEPOSIT_AMOUNT
            // STORAGE_DEPOSIT_AMOUNT is 1250000000000000000000;
            // This should covered the storage cost only for ft9.0xpj.testnet
            // maybe should be revised for other contracts later on
        },
    };

    try {
        // Use the wallet to sign and send the transaction with the function call action
        await wallet.signAndSendTransaction({
            receiverId: contractId, // The smart contract that handles the NEP-141 token
            actions: [storage_deposit]
        });

        console.log(`Successfully deposited storage fee for account ${payload.receiverId} at contract ${contractId}`);
    } catch (error) {
        console.error(`Failed to deposit storage fee for account ${payload.receiverId} at contract ${contractId}:`, error);
    }
}

export async function transferToken(walletSelector: WalletSelector, payload: Payload): Promise<void> {
    const wallet = await walletSelector.wallet();
    const args = {
        receiver_id: payload.receiverId,
        amount: payload.amount.toString(),
        // memo: payload.memo
    }
    const contractId = TOKEN_LIST[payload.symbol]

    // Create the transfer action
    const transfer: FunctionCallAction = {
        type: "FunctionCall",
        params: {
          methodName: "ft_transfer",
          args: args,
          gas: THIRTY_TGAS,
          deposit: "1" // Sender account is required to attach exactly 1 yoctoNEAR to the function call
        }
    };

    try {
        // Use the wallet to sign and send the transaction with the transfer action
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [transfer],
        });
        
        console.log(`Successfully transferred ${payload.amount.toString()} NEAR to ${payload.receiverId}`);
    } catch (error) {
        console.error(`Failed to transfer ${payload.amount.toString()} NEAR to ${payload.receiverId}:`, error);
    }
}

export async function initContract(payload: Payload): Promise<NEP141_Contract> {
    // Here's the contract init part
    const config = {
        //KeyStore not necessary for this use case
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
    };
    const nearConnection = await connect(config);
    const account = await nearConnection.account("0xpj.testnet");
    const contractId = TOKEN_LIST[payload.symbol];

    return new Contract(
        account,
        contractId,
        {
            viewMethods: ["ft_balance_of", "storage_balance_of"],
            changeMethods: [],
        }
    ) as NEP141_Contract;
}

export async function getBalance(contract: NEP141_Contract, payload: Payload): Promise<void> {
    try {
        const balanceOfUser = await contract.ft_balance_of({ account_id: payload.userId });
        const balanceOfReceiver = await contract.ft_balance_of({ account_id: payload.receiverId });
        console.log(`Balance of ${payload.symbol} in ${payload.userId}: ${balanceOfUser}`);
        console.log(`Balance of ${payload.symbol} in ${payload.receiverId}: ${balanceOfReceiver}`);
    } catch (error) {
        console.error(`Failed to fetch balance of ${payload.symbol} for ${payload.userId} or ${payload.receiverId}:`, error);
    }
}

export async function getReceiverStorageBalance(contract: NEP141_Contract, payload: Payload): Promise<void> {
    try {
        const balance = await contract.storage_balance_of({ account_id: payload.receiverId });
        console.log(`Storage balance of ${payload.receiverId}: ${balance}`);
    } catch (error) {
        console.error(`Failed to fetch storage balance for ${payload.receiverId}:`, error);
    }
}

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

// I think there should be at least 2 scenarios for transfer:
// Let's assume our user is Alice and receiver is Bob
// 1. Transfer Near: Simply call TransferNear and it should be able to transfer NEAR to Bob. Can call initContract then getBalance to check the user balance.
// 2. Transfer Token: This one is way more trickier. So NEAR has a mechanism called storage managenet. Long story short, 
//    when Alice wants to transfer a NEP-141 token to Bob, she needs to make sure Bob has enough storage staked, or in other words, has registered to the token contract before.
//    So, the function calling workflow should be like this: 
//
//    initContract(Payload)
//    getReceiverStorageBalance(Payload)
//    if(Bob's storage balance is insufficient){
//        depositStorageForReceiver(Payload)
//        transferToken(Payload)
//    } else {
//        transferToken(Payload)
//    }

//    in this case, getReceiverStorageBalance should return two values: total and available.
//    If these two value are both 0 for Bob, Alice needs to deposit the storage for Bob.
//    
//    for more details about storage staking management: https://nomicon.io/Standards/StorageManagement
