// implemented transferNear, transferToken, depositStorageForReceiver, getBalance, getReceiverStorageBalance, and getDecimals
// unregister should be implemented in the future
import { Contract } from "near-api-js";
import { FunctionCallAction, TransferAction, WalletSelector } from '@near-wallet-selector/core';

export interface NEP141_Contract extends Contract {
    ft_balance_of: (args: { account_id: string }) => Promise<string>;
    storage_balance_of: (args: { account_id: string }) => Promise<{
        total: string;
        available: string;
    }>;
    ft_metadata: () => Promise<{
      spec: string;
      name: string;
      symbol: string;
      icon: string;
      reference: null | string;
      reference_hash: null | string;
      decimals: number;
    }>;
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

// Can add our own NEP-141 token here
export const TOKEN_LIST: { [key: string]: string } = {
    // NEAR: 'NEAR',
    // PTC: 'ft9.0xpj.testnet',
}

// call: To let user deposit storage for receiver
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
            // This should covered the storage cost in most usecases
        },
    };

    try {
        await wallet.signAndSendTransaction({
            receiverId: contractId, // The smart contract that handles the NEP-141 token
            actions: [storage_deposit]
        });

        console.log(`Successfully deposited storage fee for account ${payload.receiverId} at contract ${contractId}`);
    } catch (error) {
        console.error(`Failed to deposit storage fee for account ${payload.receiverId} at contract ${contractId}:`, error);
    }
}

// (done integrating) call: To transfer NEP-141 token from user to receiver
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

// view: To get the balance of NEP-141 token for user
export async function getBalance(contract: NEP141_Contract, payload: Payload): Promise<string> {
    try {
        const balanceOfUser = await contract.ft_balance_of({ account_id: payload.userId });
        // const balanceOfReceiver = await contract.ft_balance_of({ account_id: payload.receiverId });
        console.log(`Balance of ${payload.symbol} in ${payload.userId}: ${balanceOfUser}`);
        // console.log(`Balance of ${payload.symbol} in ${payload.receiverId}: ${balanceOfReceiver}`);
        return balanceOfUser;
    } catch (error) {
        console.error(`Failed to fetch balance of ${payload.symbol} for ${payload.userId}}:`, error);
        throw error;
    }
}

// view：To get the storage balance of receiver, total = 0 means receiver has not registered to the contract, then we need to call depositStorageForReceiver
export async function getReceiverStorageBalance(contract: NEP141_Contract, payload: Payload): Promise<{total: string, available: string}> {
    try {
        const balance = await contract.storage_balance_of({ account_id: payload.receiverId });
        console.log(`Storage balance of ${payload.receiverId}: ${balance}`);
        const total = balance.total;
        const available = balance.available;
        return {total,available};
    } catch (error) {
        console.error(`Failed to fetch storage balance for ${payload.receiverId}:`, error);
        throw error;
    }
}

// view: To get decimals of the token by callin ft_metadata, example returm: 6 (for USDC)
export async function getDecimals(contract: NEP141_Contract, payload: Payload): Promise<number> {
    try{
        const metadata = await contract.ft_metadata();
        console.log(`Decimals: ${metadata.decimals}`);
        return metadata.decimals;
    } catch (error) {
        console.error(`Failed to fetch metadatas:`, error);
        throw error;
    }
}

//  (done integrating) call
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
// (done) 1. Transfer Near: Simply call TransferNear and it should be able to transfer NEAR to Bob. Can call initContract then getBalance to check the user balance.
// (half-done)2. Transfer Token: This one is way more trickier. So NEAR has a mechanism called storage managenet. Long story short, 
//    when Alice wants to transfer a NEP-141 token to Bob, she needs to make sure Bob has enough storage staked, or in other words, has registered to the token contract before.
//    So, the function calling workflow should be like this: 
//
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
