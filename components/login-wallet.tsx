import { useWalletSelector } from './contexts/WalletSelectorContext'

export default function LoginWallet() {
  const { modal } = useWalletSelector()

  const onLoginWallet = () => {
    modal.show()
  }
  return (
    <div className="h-10 w-full justify-center  text-white px-4 shadow-none rounded-3xl border-none transition-colors hover:bg-red-500/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10">
      <button
        onClick={onLoginWallet}
        className="w-full bg-sky-500 py-2 rounded-2xl px-8 "
      >
        Login
      </button>
    </div>
  )
}
