import { Message } from '@/types/chat'
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconUser,
  IconRobot
} from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import { FC, memo, useEffect, useRef, useState } from 'react'
// import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CodeBlock } from '@/components/Markdown/CodeBlock'
import { MemoizedReactMarkdown } from '@/components/Markdown/MemoizedReactMarkdown'
import Image from 'next/image'
import { useInputJSONStore } from '@/lib/store/store'
import { IoWalletSharp } from 'react-icons/io5'
import { PiArrowBendUpRight } from 'react-icons/pi'
import { PiNoteFill } from 'react-icons/pi'
import { TransferToken } from '@/components/Wallet/TransferTokenClient'
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext'
import { useWalletInfoStore, useTransferTokenStore } from '@/lib/store/store'
import { FaCheck } from 'react-icons/fa'
import { FaCheckCircle } from 'react-icons/fa'
import moment from 'moment'
import { PiArrowSquareOutBold } from 'react-icons/pi'
import { FaRegTimesCircle } from 'react-icons/fa'
import { SiNear } from 'react-icons/si'
import { FaArrowCircleDown } from 'react-icons/fa'
import { getBalance } from '@/components/Wallet/getBalanceClient'
import { PerformSwap } from '@/components/Wallet/SwapClient'
import {
  MockTransferPayload,
  MockSwapPayload,
  MockStakePayload,
  MockUnstakePayload
} from '@/components/Wallet/constant'
import { IoIosArrowDown } from 'react-icons/io'
import { IoIosArrowBack } from 'react-icons/io'
import { IoIosArrowRoundDown } from 'react-icons/io'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { GrShare } from 'react-icons/gr'
import { IoWarningOutline } from 'react-icons/io5'
import { PiWarningCircleLight } from 'react-icons/pi'
import { PiChecksBold } from 'react-icons/pi'
import { PiSpinnerGapBold } from 'react-icons/pi'
import Link from 'next/link'
import { PiSwap } from 'react-icons/pi'
import { RiArrowGoForwardFill } from 'react-icons/ri'
import { StakeNEAR } from '@/components/Wallet/StakeNearClient'
import { UnstakeNEAR } from '@/components/Wallet/UnstakeNearClient'

interface Props {
  message: Message
  messageIndex: number
  onEditMessage: (message: Message, messageIndex: number) => void
}

// async function importMathjax() {
//   const rehypeMathjax = await import("rehype-mathjax");
//   // Use the imported module (`rehypeMathjax`) here
// }

// importMathjax();

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, onEditMessage }) => {
    const { t } = useTranslation('chat')
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [messageContent, setMessageContent] = useState(message.content)
    const [messagedCopied, setMessageCopied] = useState(false)
    const { transferObject, swapObject, stakeObject, unStakeObject } =
      useInputJSONStore()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isWalletConnected, setIsWalletConnected] = useState(true)
    const [showTransfer, setShowTransfer] = useState(false)
    const { walletInfo } = useWalletInfoStore()
    const {
      success,
      error,
      setSuccess,
      setError,
      cancelled,
      confirmTransfer,
      messageCount
    } = useTransferTokenStore()
    const [time, setTime] = useState<String>()
    const { accounts } = useWalletSelector()
    const [balance, setBalance] = useState('')
    const [accountId, setAccountId] = useState('')
    const [tokenSymbol, setTokenSymbol] = useState('')
    const [functionTypes, setFunctionTypes] = useState({
      swap: false,
      transfer: false,
      stake: false,
      unstake: false
    })
    const [showSwap, setShowSwap] = useState(false) // New state to control swap widget visibility
    const [shouldRenderDiv, setShouldRenderDiv] = useState(true)
    const [showDropdown, setShowDropdown] = useState(false)
    const [payloads, setPayloads] = useState({})

    const toggleEditing = () => {
      setIsEditing(!isEditing)
    }

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setMessageContent(event.target.value)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }

    const handleEditMessage = () => {
      if (message.content != messageContent) {
        onEditMessage({ ...message, content: messageContent }, messageIndex)
      }
      setIsEditing(false)
    }

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault()
        handleEditMessage()
      }
    }

    const copyOnClick = () => {
      if (!navigator.clipboard) return

      navigator.clipboard.writeText(message.content).then(() => {
        setMessageCopied(true)
        setTimeout(() => {
          setMessageCopied(false)
        }, 2000)
      })
    }

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [isEditing])

    const handleTransferClick = () => {
      if (isWalletConnected) {
        setShowTransfer(true)
      } else {
        alert('Please connect your wallet first!')
      }
    }

    // useEffect(() => {
    //   console.log(inputJSON)
    //     if(inputJSON.length > 0){
    //     // Remove backslashes to unescape the string
    //     const unescapedString = inputJSON.replace(/\\/g, '');

    //     // Parse the string into an object
    //     const jsonObject = JSON.parse(unescapedString);
    //     // console.log('jsonObject', jsonObject)
    //     if(jsonObject.functionType == 'transfer') setTransferObject(jsonObject)
    //     if(jsonObject.functionType == 'swap') setSwapObject(jsonObject)
    //     }
    // }, [inputJSON])

    useEffect(() => {
      const nowTime = moment().format('YYYY-MM-DD H:mm:ss')
      setTime(String(nowTime))
    }, [success])

    useEffect(() => {
      if (accountId !== '' && tokenSymbol !== '') {
        getBalance(accountId, tokenSymbol)
          .then(setBalance)
          .catch(e => {
            setError(`Failed to fetch balance: ${e.message}`)
            console.error(e)
          })
      }
    }, [accountId, tokenSymbol]) // 依赖项包括 accountId 和 tokenSymbol

    const handleSwapClick = () => {
      // New function to handle Swap button click
      if (isWalletConnected) {
        setShowSwap(true) // Show the swap widget if the wallet is connected
      } else {
        alert('Please connect your wallet first!')
      }
    }

    useEffect(() => {
      try {
        if (message.role === 'assistant' && message.content.includes('swap')) {
          setFunctionTypes(prevState => ({
            ...prevState,
            transfer: false,
            swap: true,
            stake: false,
            unstake: false
          }))
        } else if (
          message.role === 'assistant' &&
          message.content.includes('transfer')
        ) {
          setFunctionTypes(prevState => ({
            ...prevState,
            transfer: true,
            swap: false,
            stake: false,
            unstake: false
          }))
        } else if (
          message.role === 'assistant' &&
          message.content.includes('unstake')
        ) {
          setFunctionTypes(prevState => ({
            ...prevState,
            transfer: false,
            swap: false,
            stake: false,
            unstake: true
          }))
        } else if (
          message.role === 'assistant' &&
          message.content.includes('stake')
        ) {
          setFunctionTypes(prevState => ({
            ...prevState,
            transfer: false,
            swap: false,
            stake: true,
            unstake: false
          }))
        }
      } catch (error) {
        console.error('Invalid JSON string', error)
      }
    }, [message.content && messageIndex == messageCount])

    useEffect(() => {
      setShouldRenderDiv(!success && !error && !cancelled)
    }, [success, error, cancelled])

    // console.log('content', message?.content, message.content.includes('{'))
    // console.log('swapObject', swapObject)

    // useEffect(() => {
    //   let payload = {
    //     tokenIn: swapObject?.tokenIn?.toUpperCase(),
    //     tokenOut: swapObject?.tokenOut?.toUpperCase(),
    //     amountIn: swapObject?.amountIn?.toString(),
    //     slippageTolerance: 0.01
    //   }
    //   setPayloads(payload)
    // }, [functionTypes && functionTypes.swap])

    return (
      <div
        className="group px-4 bg-white text-gray-800"
        style={{ overflowWrap: 'anywhere' }}
      >
        <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="min-w-[40px] flex justify-start items-start text-left font-bold">
            {message.role === 'assistant' ? (
              <Image
                className="float-right"
                src="/brand-logo.svg"
                alt="brand-logo"
                width={30}
                height={30}
              />
            ) : (
              <IconUser size={30} />
            )}
          </div>

          <div className="prose mt-[-2px] w-full">
            {message.role === 'assistant' ? (
              <p className="text-lg font-semibold mb-2">Sender</p>
            ) : (
              <p className="text-lg font-semibold mb-2">User</p>
            )}
            {message.role === 'user' ? (
              <div className="flex w-full">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <label htmlFor="messageTextarea">Message Content:</label>
                    <textarea
                      id="messageTextarea"
                      ref={textareaRef}
                      className="w-full resize-none whitespace-pre-wrap border-none "
                      value={messageContent}
                      onChange={handleInputChange}
                      onKeyDown={handlePressEnter}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={() => setIsTyping(false)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden'
                      }}
                    />

                    <div className="mt-10 flex justify-center space-x-4">
                      <button
                        className="h-[40px] rounded-md bg-[#38BDF8] px-4 py-1 text-sm font-medium text-white enabled:hover:bg-[#0EA5E9] disabled:opacity-50"
                        onClick={handleEditMessage}
                        disabled={messageContent.trim().length <= 0}
                      >
                        {t('Save & Submit')}
                      </button>
                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(message.content)
                          setIsEditing(false)
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}

                {((typeof window !== undefined && window.innerWidth < 640) ||
                  !isEditing) && (
                  <button
                    className={`absolute translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300 ${
                      window.innerWidth < 640
                        ? 'right-3 bottom-1'
                        : 'right-0 top-[26px]'
                    }
                    `}
                    onClick={toggleEditing}
                    title="toggleEdit"
                  >
                    <IconEdit size={20} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`absolute ${
                    window.innerWidth < 640
                      ? 'right-3 bottom-1'
                      : 'right-0 top-[26px] m-0'
                  }`}
                >
                  {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500 dark:text-green-400"
                    />
                  ) : (
                    <button
                      className="translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={copyOnClick}
                      title="copy"
                    >
                      <IconCopy size={20} />
                    </button>
                  )}
                </div>

                {!message.content.includes('{') ? (
                  <MemoizedReactMarkdown
                    className="prose"
                    remarkPlugins={[remarkGfm, remarkMath]}
                    // rehypePlugins={[rehypeMathjax]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')

                        return !inline && match ? (
                          <CodeBlock
                            key={Math.random()}
                            language={match[1]}
                            value={String(children).replace(/\n$/, '')}
                            {...props}
                          />
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      },
                      table({ children }) {
                        return (
                          <table className="border-collapse border border-black py-1 px-3 dark:border-white">
                            {children}
                          </table>
                        )
                      },
                      th({ children }) {
                        return (
                          <th className="break-words border border-black bg-gray-500 py-1 px-3 text-white dark:border-white">
                            {children}
                          </th>
                        )
                      },
                      td({ children }) {
                        return (
                          <td className="break-words border border-black py-1 px-3 dark:border-white">
                            {children}
                          </td>
                        )
                      }
                    }}
                  >
                    {message.content}
                  </MemoizedReactMarkdown>
                ) : (
                  <div>No problem</div>
                )}

                {messageIndex == messageCount && functionTypes.transfer && (
                  <>
                    {shouldRenderDiv && (
                      <div className="flex flex-col border-2 border-[#38BDF8] rounded-xl p-4">
                        <div className="flex flex-row-reverse items-center gap-2">
                          <div>TRANSFER</div>
                          <RiArrowGoForwardFill />{' '}
                        </div>
                        <h3 className="my-2">Transfer Summary</h3>
                        <div className="flex flex-col border border-[#D1D5DB] p-4">
                          <div className="flex w-full flex-col ">
                            <div className="font-bold">From</div>
                            {/* <div className="text-xl">Stella</div> */}
                            <div className="flex gap-2 items-center text-[#9CA8B4]">
                              <IoWalletSharp />
                              {accounts[0]?.accountId?.slice(0, 6) +
                                '...' +
                                accounts[0]?.accountId?.slice(-6)}
                            </div>
                          </div>
                          <IoIosArrowRoundDown className="size-10 text-[#38BDF8]" />
                          <div className="flex w-full flex-col ">
                            <div className="font-bold">To</div>
                            {/* <div className="text-xl">Stella</div> */}
                            <div className="flex gap-2 items-center text-[#9CA8B4]">
                              <IoWalletSharp />
                              {transferObject?.recipient?.slice(0, 6) +
                                '...' +
                                transferObject?.recipient?.slice(-6)}
                            </div>
                          </div>
                          <div className="flex justify-center mb-3 mt-2">
                            <div className="border w-full"></div>
                          </div>
                          <div className="flex w-full flex-col gap-2">
                            <div className="text-base font-bold">Amount</div>
                            <div className="flex items-center gap-2">
                              <SiNear className="size-5" />
                              <p className="p-0 m-0 text-2xl font-bold">{`${transferObject?.amount} ${transferObject?.token}`}</p>
                            </div>
                          </div>
                          <div className="flex flex-col justify-end mt-4">
                            <div className="flex items-center gap-2 text-base font-bold">
                              Note
                            </div>
                            <div>-</div>
                          </div>
                          <div className="flex justify-center mb-3 mt-2">
                            <div className="border w-full"></div>
                          </div>
                          <div className="flex justify-between text-[#9CA8B4]">
                            <div>Network Fee</div>
                            <div>0.899316 NEAR</div>
                          </div>
                        </div>
                        <div className="flex flex-row-reverse gap-2 text-[#0EA5E9] items-center font-bold">
                          <PiChecksBold />
                          Checked
                        </div>
                        <TransferToken payload={MockTransferPayload} />
                      </div>
                    )}
                    {success && (
                      <div className="flex flex-col border-2 w-full border-[#10B981] items-center rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#10B981]">
                          <IoIosCheckmarkCircleOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Transaction Successful
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex flex-col border border-[#D1D5DB] w-[90%] p-4 mt-6">
                          <div className="flex items-center gap-2">
                            <div className="text-xl font-bold">
                              {transferObject.recipient.slice(0, 6) +
                                '...' +
                                transferObject.recipient.slice(-6)}
                            </div>
                            <div>receive</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/cryptoIcon/${transferObject.token.toLowerCase()}.svg`}
                              alt="Icon"
                              width={30}
                              height={30}
                              className="my-4"
                            />
                            <p className="p-0 m-0 text-2xl font-bold">
                              {transferObject.amount} {transferObject.token}
                            </p>
                          </div>
                          <div>
                            Lorem ipsum dolor sit, amet consectetur adipisicing
                            elit. Doloribus iusto nulla quae minus distinctio
                            temporibus quidem impedit voluptatem harum sapiente
                            pariatur veniam architecto, consequatur nemo magni,
                            ratione facere voluptatibus voluptatum?
                          </div>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>

                        <div className="flex justify-center w-full">
                          {accounts && (
                            <Link
                              href={`https://nearblocks.io/address/${accounts[0]?.accountId}`}
                              className="border border-[#D1D5DB] text-[#9CA8B4] w-[90%] flex gap-2 items-center justify-center py-1"
                            >
                              View Transaction Detail
                              <GrShare className="size-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-col border-2 w-full border-[#F43F5E] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#F43F5E]">
                          <IoWarningOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Transaction failed
                          </p>
                          <p className="text-[#9CA8B4] m-0">
                            2024-04-24 7:09:23
                          </p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                    {cancelled && (
                      <div className="flex flex-col border-2 w-full border-[#52749F] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#52749F]">
                          <PiWarningCircleLight className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Cancel Transaction
                          </p>
                          <p className="text-[#9CA8B4] m-0">
                            2024-04-24 7:09:23
                          </p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {messageIndex == messageCount && functionTypes.swap && (
                  <>
                    {shouldRenderDiv && (
                      <>
                        <div className="flex flex-col w-full mx-auto my-5 border-2 border-[#38BDF8] px-4 py-6 rounded-xl">
                          <div className="flex flex-row-reverse items-center gap-2">
                            <div>SWAP</div>
                            <PiSwap className="size-4" />{' '}
                          </div>
                          <h3 className="mt-0">Swap Summary</h3>
                          <div className="flex flex-col border border-[#E5E7F0] p-4 rounded-lg">
                            <div className="flex justify-between">
                              <p className="m-0">You Pay</p>
                              <p className="flex items-center gap-2 m-0">
                                <span className="text-[#8799A6]">Balance</span>
                                <span className="font-semibold">0</span>
                              </p>
                            </div>

                            <div className="flex w-full items-center justify-between mt-2 h-20">
                              <div>
                                <p className="p-0 m-0 text-3xl">
                                  {swapObject?.amountIn}
                                </p>
                                <p className="p-0 m-0 text-[#8799A6]">
                                  ${' '}
                                  {Number(swapObject?.amountIn) *
                                    Number(swapObject?.tokenInPrice)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-2xl">
                                <Image
                                  src={`/cryptoIcon/${swapObject?.tokenIn?.toLowerCase()}.svg`}
                                  alt="Icon"
                                  width={30}
                                  height={30}
                                  className="my-4"
                                />
                                <span className="font-semibold">
                                  {swapObject?.tokenIn
                                    ? swapObject?.tokenIn
                                    : 'USDT'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex h-10 w-full items-center justify-center">
                            <IoIosArrowRoundDown className="size-8 text-[#38BDF8]" />
                          </div>
                          <div className="flex flex-col border border-[#E5E7F0] p-4 rounded-lg">
                            <div className="flex justify-between">
                              <p className="m-0">You Get</p>
                              <p className="flex items-center gap-2 m-0">
                                <span className="text-[#8799A6]">Balance</span>{' '}
                                <span className="font-semibold">0</span>{' '}
                              </p>
                            </div>

                            <div className="flex w-full items-center justify-between mt-2 h-20">
                              <div>
                                <p className="p-0 m-0 text-3xl">
                                  {(Number(swapObject?.amountIn) *
                                    Number(swapObject?.tokenInPrice)) /
                                    Number(swapObject?.tokenOutPrice)}
                                </p>
                                <p className="p-0 m-0 text-[#8799A6]">
                                  ${' '}
                                  {Number(swapObject?.amountIn) *
                                    Number(swapObject?.tokenInPrice)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-2xl">
                                <Image
                                  src={`/cryptoIcon/${swapObject.tokenOut.toLowerCase()}.svg`}
                                  alt="Icon"
                                  width={30}
                                  height={30}
                                  className="my-4"
                                />
                                <span className="font-semibold">
                                  {swapObject?.tokenOut
                                    ? swapObject?.tokenOut
                                    : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <PerformSwap
                            payload={MockSwapPayload}
                            // payload={{
                            //   tokenIn: swapObject?.tokenIn.toUpperCase(),
                            //   tokenOut: swapObject?.tokenOut.toUpperCase(),
                            //   amountIn: String(swapObject?.amountIn),
                            //   slippageTolerance: 0.01
                            // }}
                          />
                          <div className="flex justify-between my-2">
                            <p className="m-0 font-bold">
                              {`1 ${swapObject.tokenIn} ≈ ${swapObject.tokenInPrice} USDT`}
                            </p>
                            <div
                              className="flex justify-between items-center gap-2 cursor-pointer"
                              onClick={() => setShowDropdown(!showDropdown)}
                            >
                              <p className="m-0">Detail</p>
                              <IoIosArrowDown
                                className={showDropdown ? 'rotate-180' : ''}
                              />
                            </div>
                          </div>
                          {showDropdown && (
                            <div className="flex justify-between items-center gap-2 text-[#9CA8B4]">
                              <div className="flex flex-col">
                                <p className="m-0">Price Impact</p>
                                <p className="m-0">Minimum Receive</p>
                              </div>
                              <div className="flex flex-col font-bold text-black">
                                <div className="flex justify-between items-center gap-1">
                                  <IoIosArrowBack />
                                  <p className="m-0">0.01 %</p>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <p className="m-0">
                                    {swapObject?.amountOut}{' '}
                                    {swapObject?.tokenOut}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {success && (
                      <div className="flex flex-col border-2 w-full border-[#10B981] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#10B981]">
                          <IoIosCheckmarkCircleOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Swap Successful
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 h-10 mt-4">
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/cryptoIcon/${swapObject?.tokenIn?.toLowerCase()}.svg`}
                              alt="Icon"
                              width={30}
                              height={30}
                              className="my-4"
                            />
                            <p className="p-0 m-0 text-2xl">
                              {swapObject?.amountIn} {swapObject?.tokenIn}
                            </p>
                          </div>
                          <IoIosArrowRoundDown className="size-8 text-[#38BDF8] -rotate-90" />
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/cryptoIcon/${swapObject?.tokenOut?.toLowerCase()}.svg`}
                              alt="Icon"
                              width={30}
                              height={30}
                              className="my-4"
                            />
                            <p className="p-0 m-0 text-2xl">
                              {(
                                (Number(swapObject?.amountIn) *
                                  Number(swapObject?.tokenInPrice)) /
                                Number(swapObject?.tokenOutPrice)
                              ).toFixed(6)}{' '}
                              ${swapObject?.tokenOut}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>

                        <div className="flex justify-center">
                          <button className="border border-[#D1D5DB] text-[#9CA8B4] w-10/12 flex gap-2 items-center justify-center">
                            View Transaction Detail
                            <GrShare className="size-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-col border-2 w-full border-[#F43F5E] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#F43F5E]">
                          <IoWarningOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Swap failed
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                    {cancelled && (
                      <div className="flex flex-col border-2 w-full border-[#52749F] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#52749F]">
                          <PiWarningCircleLight className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Cancel Swap
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {messageIndex == messageCount && functionTypes.stake && (
                  <>
                    {shouldRenderDiv && (
                      <div className="flex flex-col border-2 border-[#38BDF8] rounded-xl p-4">
                        <div className="flex flex-row-reverse items-center gap-2">
                          <div>STAKE</div>
                          <PiSwap className="size-4" />{' '}
                        </div>
                        <h3 className="my-2">Stake Summary</h3>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center border border-[#E5E7F0] rounded-lg px-2">
                            <div className="flex items-center gap-2 text-2xl">
                              <Image
                                src={`/cryptoIcon/${stakeObject?.token?.toLowerCase()}.svg`}
                                alt="Icon"
                                width={30}
                                height={30}
                                className="my-4"
                              />
                              <span className="font-semibold">
                                {stakeObject?.token ? stakeObject?.token : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="p-0 m-0 text-[#38BDF8] font-bold">
                                APR{' '}
                                {stakeObject?.tokenAPY
                                  ? stakeObject?.tokenAPY
                                  : '0'}
                              </p>
                              <IoIosArrowDown />
                            </div>
                          </div>
                          <div className="flex flex-col gap-4">
                            <div className="mt-4 font-bold">Amont to Stake</div>
                            <div className="border-2 bg-[#F5FAFF] border-black rounded-3xl px-6">
                              <div className="flex w-full items-center justify-between mt-2 h-20">
                                <div>
                                  <p className="p-0 m-0 text-3xl">
                                    {stakeObject?.amount}
                                  </p>
                                  <p className="p-0 m-0 text-[#8799A6]">
                                    ${' '}
                                    {Number(stakeObject?.amount) *
                                      Number(stakeObject?.tokenPrice)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex gap-2">
                                    <div className="text-[#8799A6]">
                                      Balance
                                    </div>
                                    <span className="font-bold">
                                      {stakeObject?.amount}
                                    </span>
                                  </div>
                                  <button className="rounded-lg bg-[#E6E6E6] px-2">
                                    Max
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-start gap-2 pt-4 pb-2">
                            <div className="flex flex-col justify-start items-start">
                              <p className="m-0 text-black font-bold">
                                You&apos;ll Get
                              </p>
                              <p className="m-0"></p>
                            </div>
                            <div className="flex flex-col items-end font-bold text-black">
                              <div className="flex justify-between items-center gap-1">
                                <div className="flex items-center justify-end gap-2 ">
                                  <Image
                                    src={`/cryptoIcon/${stakeObject?.token?.toLowerCase()}.svg`}
                                    alt="Icon"
                                    width={15}
                                    height={15}
                                    className="m-0"
                                  />
                                  <div className="font-semibold flex gap-2">
                                    <div>
                                      {stakeObject?.amount
                                        ? stakeObject?.amount
                                        : ''}
                                    </div>
                                    <div>
                                      {stakeObject?.token
                                        ? stakeObject?.token
                                        : 'NEAR'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <p className="m-0">1 NEAR ≈ 1.12 stNEAR</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center mb-3 mt-1">
                            <div className="border w-full"></div>
                          </div>
                          <div className="flex justify-between">
                            <div>Fee</div>
                            <div className="text-black">0.01 NEAR</div>
                          </div>
                        </div>
                        <StakeNEAR payload={MockStakePayload} />
                      </div>
                    )}
                    {success && (
                      <div className="flex flex-col border-2 w-full border-[#10B981] items-center rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#10B981]">
                          <IoIosCheckmarkCircleOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Stake Successful
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex flex-col border border-[#D1D5DB] w-[90%] p-4 mt-6">
                          {/* <div className="flex items-center gap-2">
                            <div className="text-xl font-bold">
                              {transferObject?.recipient?.slice(0, 6) +
                                '...' +
                                transferObject?.recipient?.slice(-6)}
                            </div>
                            <div>receive</div>
                          </div> */}
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/cryptoIcon/near.svg`}
                              alt="Icon"
                              width={30}
                              height={30}
                              className="my-4"
                            />
                            <p className="p-0 m-0 text-2xl font-bold">
                              {stakeObject?.amount} {stakeObject?.token}
                            </p>
                          </div>
                          <div>
                            Lorem ipsum dolor sit, amet consectetur adipisicing
                            elit. Doloribus iusto nulla quae minus distinctio
                            temporibus quidem impedit voluptatem harum sapiente
                            pariatur veniam architecto, consequatur nemo magni,
                            ratione facere voluptatibus voluptatum?
                          </div>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>

                        <div className="flex justify-center w-full">
                          {accounts && (
                            <Link
                              href={`https://nearblocks.io/address/${accounts[0]?.accountId}`}
                              className="border border-[#D1D5DB] text-[#9CA8B4] w-[90%] flex gap-2 items-center justify-center py-1"
                            >
                              View Transaction Detail
                              <GrShare className="size-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-col border-2 w-full border-[#F43F5E] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#F43F5E]">
                          <IoWarningOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Stake failed
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                    {cancelled && (
                      <div className="flex flex-col border-2 w-full border-[#52749F] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#52749F]">
                          <PiWarningCircleLight className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Cancel Stake
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {messageIndex == messageCount && functionTypes.unstake && (
                  <>
                    {shouldRenderDiv && (
                      <div className="flex flex-col border-2 border-[#38BDF8] rounded-xl p-4">
                        <div className="flex flex-row-reverse items-center gap-2">
                          <div>Unstake</div>
                          <PiSwap className="size-4" />{' '}
                        </div>
                        <h3 className="my-2">Unstake Summary</h3>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center border border-[#E5E7F0] rounded-lg px-2">
                            <div className="flex items-center gap-2 text-2xl">
                              <Image
                                src={`/cryptoIcon/near.svg`}
                                alt="Icon"
                                width={30}
                                height={30}
                                className="my-4"
                              />
                              <span className="font-semibold">
                                {stakeObject?.token
                                  ? stakeObject?.token
                                  : 'NEAR'}
                              </span>
                            </div>
                            {/* <div className="flex items-center gap-2">
                              <p className="p-0 m-0 text-[#38BDF8] font-bold">
                                APR 8.88%
                              </p>
                              <IoIosArrowDown />
                            </div> */}
                          </div>
                          <div className="flex flex-col gap-4">
                            <div className="mt-4 font-bold">
                              Amont to Unstake
                            </div>
                            <div className="border-2 bg-[#F5FAFF] border-black rounded-3xl px-6">
                              <div className="flex w-full items-center justify-between mt-2 h-20">
                                <div>
                                  <p className="p-0 m-0 text-3xl">
                                    {stakeObject?.amount
                                      ? stakeObject?.amount
                                      : 'All'}
                                  </p>
                                  {/* <p className="p-0 m-0 text-[#8799A6]">
                                    $ {stakeObject?.amount}
                                  </p> */}
                                </div>
                                {/* <div className="flex flex-col items-end gap-1">
                                  <div className="flex gap-2">
                                    <div className="text-[#8799A6]">
                                      Balance
                                    </div>
                                    <span className="font-bold">
                                      {stakeObject?.amount}
                                    </span>
                                  </div>
                                  <button className="rounded-lg bg-[#E6E6E6] px-2">
                                    Max
                                  </button>
                                </div> */}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-start gap-2 pt-4 pb-2">
                            {/* <div className="flex flex-col justify-start items-start">
                              <p className="m-0 text-black font-bold">
                                You'll Get
                              </p>
                              <p className="m-0"></p>
                            </div> */}
                            {/* <div className="flex flex-col items-end font-bold text-black">
                              <div className="flex justify-between items-center gap-1">
                                <div className="flex items-center justify-end gap-2 ">
                                  <Image
                                    src={`/cryptoIcon/${stakeObject?.token?.toLowerCase()}.svg`}
                                    alt="Icon"
                                    width={15}
                                    height={15}
                                    className="m-0"
                                  />
                                  <div className="font-semibold flex gap-2">
                                    <div>
                                      {stakeObject?.amount
                                        ? stakeObject?.amount
                                        : 'NEAR'}
                                    </div>
                                    <div>
                                      {stakeObject?.token
                                        ? stakeObject?.token
                                        : 'NEAR'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <p className="m-0">1 NEAR ≈ 1.12 stNEAR</p>
                              </div>
                            </div> */}
                          </div>
                          <div className="flex justify-center mb-3 mt-1">
                            <div className="border w-full"></div>
                          </div>
                          <div className="flex justify-between">
                            <div>Fee</div>
                            <div className="text-black">0.01 NEAR</div>
                          </div>
                        </div>
                        <UnstakeNEAR payload={MockUnstakePayload} />
                      </div>
                    )}
                    {success && (
                      <div className="flex flex-col border-2 w-full border-[#10B981] items-center rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#10B981]">
                          <IoIosCheckmarkCircleOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Unstake Successful
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex flex-col border border-[#D1D5DB] w-[90%] p-4 mt-6">
                          {/* <div className="flex items-center gap-2">
                            <div className="text-xl font-bold">
                              {transferObject?.recipient?.slice(0, 6) +
                                '...' +
                                transferObject?.recipient?.slice(-6)}
                            </div>
                            <div>receive</div>
                          </div> */}
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/cryptoIcon/near.svg`}
                              alt="Icon"
                              width={30}
                              height={30}
                              className="my-4"
                            />
                            <p className="p-0 m-0 text-2xl font-bold">
                              {/* {stakeObject?.amount} {stakeObject?.token} */}
                              All
                            </p>
                          </div>
                          <div>
                            Lorem ipsum dolor sit, amet consectetur adipisicing
                            elit. Doloribus iusto nulla quae minus distinctio
                            temporibus quidem impedit voluptatem harum sapiente
                            pariatur veniam architecto, consequatur nemo magni,
                            ratione facere voluptatibus voluptatum?
                          </div>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>

                        <div className="flex justify-center w-full">
                          {accounts && (
                            <Link
                              href={`https://nearblocks.io/address/${accounts[0]?.accountId}`}
                              className="border border-[#D1D5DB] text-[#9CA8B4] w-[90%] flex gap-2 items-center justify-center py-1"
                            >
                              View Transaction Detail
                              <GrShare className="size-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="flex flex-col border-2 w-full border-[#F43F5E] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#F43F5E]">
                          <IoWarningOutline className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Unstake failed
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                    {cancelled && (
                      <div className="flex flex-col border-2 w-full border-[#52749F] rounded-xl py-8">
                        <div className="flex flex-col items-center text-[#52749F]">
                          <PiWarningCircleLight className="size-10" />
                          <p className="font-extrabold m-0 text-xl">
                            Cancel Unstake
                          </p>
                          <p className="text-[#9CA8B4] m-0">{time}</p>
                        </div>
                        <div className="flex justify-center mb-3 mt-2">
                          <div className="border w-10/12"></div>
                        </div>
                        <div className="flex justify-center items-center">
                          <p className="m-0 w-10/12">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Voluptatum, labore nulla quia tempore incidunt
                            voluptas facilis itaque, possimus dignissimos est
                            impedit blanditiis perferendis expedita porro alias.
                            Ut saepe pariatur odit.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
)
ChatMessage.displayName = 'ChatMessage'
