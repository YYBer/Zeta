import { useEffect, useState } from 'react';
import { useWalletSelector } from '@/components/WalletSelectorContext';
import "@near-wallet-selector/modal-ui/styles.css";
import Image from 'next/image'
import { IoIosSettings } from 'react-icons/io'


interface LoginWalletProps {
  onWalletConnect: () => void;
}

export default function LoginWallet({ onWalletConnect }: LoginWalletProps) {
  const { modal, accounts, selector } = useWalletSelector();
  const [label, setLabel] = useState('Loading...');

  useEffect(() => {
    if (accounts.length > 0) {
      onWalletConnect();  // 确保只有在账户数组变化且长度大于0时调用
      let userName = accounts[0].accountId.split(".")[0];
      setLabel(userName);
    }
  }, [accounts, onWalletConnect]); // 依赖项包括 accounts 和 onWalletConnect

  const onLoginWallet = async () => {
    await modal.show();
  };

  const onLogoutWallet = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  // useEffect(() => {
  //   if (!wallet) return;

  //   if (signedAccountId) {
  //     setAction(() => wallet.signOut);
  //     let userName = signedAccountId.split(".")[0];
  //     setLabel(userName);
  //   } else {
  //     setAction(() => wallet.signIn);
  //     setLabel('Login');
  //   } 
  // }, [signedAccountId, wallet, setAction, setLabel]);

  return (
    <div className="h-10 w-full justify-center text-white px-4 shadow-none rounded-3xl border-none transition-colors dark:bg-zinc-900">
      {accounts.length > 0 ? (
        <div className="flex justify-between items-center h-10 px-4">
        <div className="flex items-center gap-2 text-white  ">
          <Image src={'/user.png'} alt="user" width={36} height={36} />
          <p className='text-base'>{label}</p>
        </div>
        <button onClick={onLogoutWallet} title="Logout Wallet"> 
          <IoIosSettings className='w-[24px] h-[24px]'/> 
        </button>
        
      </div>
        // <div className="flex justify-between items-center">
        //   <div className="flex items-center gap-2 text-white">
        //     {accounts[0].accountId}
        //   </div>
        //   <button onClick={onLogoutWallet} className="bg-red-500 py-2 px-4 rounded">
        //     Logout
        //   </button>
        // </div>
      ) : (
        <div className='navbar-nav pt-1 flex items-center justify-center'>
          <button className="btn btn-secondary bg-white w-52 text-black rounded-3xl h-10" onClick={onLoginWallet} > Sign In </button>
        </div>
      )}
    </div>
  );
}
