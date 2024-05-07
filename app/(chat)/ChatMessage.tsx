import { Message } from '@/types/chat';
import { IconCheck, IconCopy, IconEdit, IconUser, IconRobot } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC, memo, useEffect, useRef, useState } from 'react';
import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { CodeBlock } from '@/components/Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '@/components/Markdown/MemoizedReactMarkdown';
import Image from 'next/image'
import { useInputJSONStore } from '@/lib/store/store'
import { IoWalletSharp } from "react-icons/io5";
import { PiArrowBendUpRight } from "react-icons/pi";
import { PiNoteFill } from "react-icons/pi";
import { TransferToken, Payload } from '@/components/Wallet/TransferTokenClient';
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext';
import { useWalletInfoStore, useTransferTokenStore } from '@/lib/store/store'
import { FaCheck } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import moment from 'moment';
import { PiArrowSquareOutBold } from "react-icons/pi";
import { FaRegTimesCircle } from "react-icons/fa";
import { SiNear } from "react-icons/si";
import { FaArrowCircleDown } from "react-icons/fa";

interface Props {
  message: Message;
  messageIndex: number;
  onEditMessage: (message: Message, messageIndex: number) => void;
}



const MockPayload: Payload = {
  userId: '9b5adfd2530b9c2657b088cfc8755e3c25a6cef7fb9b44c659d12b2bd30a3f62',
  receiverId: 'c7413c9c61fd11557efbfae8a063daebfa5774432aca543833d05bcd7050d9e6',
  amount: '0.01',
  symbol: 'USDC'
};
 

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, onEditMessage }) => {
    const { t } = useTranslation('chat');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [messageContent, setMessageContent] = useState(message.content);
    const [messagedCopied, setMessageCopied] = useState(false);
    const { inputJSON } = useInputJSONStore()
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [showTransfer, setShowTransfer] = useState(true);
    const [transferObject , setTransferObject] = useState()
    const { walletInfo } = useWalletInfoStore() 
    const { success, error, setSuccess, setError, confirmTransfer, messageCount } = useTransferTokenStore()
    const [time, setTime] = useState<String>()
    const { accounts } = useWalletSelector();

    const toggleEditing = () => {
      setIsEditing(!isEditing);
    };

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    const handleEditMessage = () => {
      if (message.content != messageContent) {
        onEditMessage({ ...message, content: messageContent }, messageIndex);
      }
      setIsEditing(false);
    };

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault();
        handleEditMessage();
      }
    };

    const copyOnClick = () => {
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(message.content).then(() => {
        setMessageCopied(true);
        setTimeout(() => {
          setMessageCopied(false);
        }, 2000);
      });
    };

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditing]);


    const handleTransferClick = () => {
      if (isWalletConnected) {
        setShowTransfer(true);
      } else {
        alert("Please connect your wallet first!");
      }
    };

    useEffect(() => {
        if(inputJSON.length > 0){
        // Remove backslashes to unescape the string
        const unescapedString = inputJSON.replace(/\\/g, '');
    
        // Parse the string into an object
        const jsonObject = JSON.parse(unescapedString);
        setTransferObject(jsonObject)
        }
    }, [inputJSON])

    useEffect(() => {
      const nowTime = moment().format('YYYY-MM-DD H:mm:ss');
      setTime(String(nowTime))
    }, [success])
    
    return (
      <div
        className='group px-4 bg-white text-gray-800'
        style={{ overflowWrap: 'anywhere' }}
      >
        <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
          <div className="min-w-[40px] flex justify-start items-start text-left font-bold">
            {message.role === 'assistant' ? <Image
                  className="float-right"
                  src='/brand-logo.svg'
                  alt='brand-logo'
                  width={30}
                  height={30}
                /> : <IconUser size={30}/>}
          </div>

          <div className="prose mt-[-2px] w-full">
          {message.role === 'assistant' ? <p className='text-lg font-semibold mb-2'>Sender</p> : <p className='text-lg font-semibold mb-2'>User</p>}           
           {message.role === 'user' ? (
              <div className="flex w-full">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      ref={textareaRef} 
                      className="w-full resize-none whitespace-pre-wrap border-none dark:bg-[#343541]"
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
                        overflow: 'hidden',
                      }}
                    />

                    <div className="mt-10 flex justify-center space-x-4">
                      <button
                        className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                        onClick={handleEditMessage}
                        disabled={messageContent.trim().length <= 0}
                      >
                        {t('Save & Submit')}
                      </button>
                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(message.content);
                          setIsEditing(false);
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

                {(window.innerWidth < 640 || !isEditing) && (
                  <button
                    className={`absolute translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300 ${
                      window.innerWidth < 640
                        ? 'right-3 bottom-1'
                        : 'right-0 top-[26px]'
                    }
                    `}
                    onClick={toggleEditing}
                    title='toggleEdit'
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

                <MemoizedReactMarkdown
                  className="prose"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeMathjax]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');

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
                      );
                    },
                    table({ children }) {
                      return (
                        <table className="border-collapse border border-black py-1 px-3 dark:border-white">
                          {children}
                        </table>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="break-words border border-black bg-gray-500 py-1 px-3 text-white dark:border-white">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="break-words border border-black py-1 px-3 dark:border-white">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </MemoizedReactMarkdown> 

                {messageIndex == messageCount && message.content.includes("{") ? (
                  <div className='flex flex-col bg-[#E5E7EB] rounded-xl justify-center items-center'>
                    <div className="flex w-10/12 mx-auto">
                      <Image
                        src='/chartFlowLine.svg'
                        alt='chartFlowLine'
                        width={15}
                        height={10}
                        className="mr-5"
                        // className="w-2 h-10"
                      />
                      <div className="flex w-full flex-col ">
                      <div className='flex flex-col gap-2 mt-8'>
                        <div>Transfer from:</div>
                        <div className='flex flex-col justify-end'>
                          <div className='flex items-center gap-2 text-base'><IoWalletSharp /> Wallet</div>
                          <div className='text-lg font-bold'>{walletInfo}</div>
                        </div>
                        <div className='flex flex-col justify-end'>
                          <div className='flex items-center gap-2 text-base'><PiArrowBendUpRight /> Transfer amount</div>
                          <div className='text-lg font-bold text-[#10B981]'>{`${transferObject?.amount} ${transferObject?.token}`}</div>
                        </div>
                        <div className='flex flex-col justify-end'>
                          <div className='flex items-center gap-2 text-base'><PiNoteFill /> Transfer note</div>
                          <div>-</div>
                        </div>
                      </div>
                    </div>
                    </div>

                    <div className="flex w-10/12 mx-auto">
                      <div>
                      <Image
                        src='/chartFlowLine.svg'
                        alt='chartFlowLine'
                        width={10}
                        height={5}
                        className="mr-5"
                        // className="w-2 h-10"
                      />
                      </div>
                      
                      <div className="flex w-full flex-col mt-8">
                      <div className='flex flex-col gap-2'>
                        <div>Transfer To:</div>
                        <div className='flex flex-col justify-end'>
                          <div className='flex items-center gap-2 text-base'><IoWalletSharp /> Wallet</div>
                          <div className='text-lg font-bold'>{transferObject?.recipient}</div>
                        </div>
                        {
                          confirmTransfer && (
                            <div className='flex gap-2 text-[#0EA5E9] items-center'>
                              <FaCheck className='w-5'/>
                            <div className='text-lg font-bold'>Checked</div>
                        </div>
                          )
                        }
                        
                      </div>
                    </div>
                    </div>
                    {
                      success &&  <div className="flex w-10/12 mx-auto mb-5">
                      
                      <div className="flex w-full flex-col">
                        <div className='flex flex-col gap-2'>
                          <div className='flex items-center gap-2 text-[#10B981] h-8'>
                            <div><FaCheckCircle className='w-6 h-6'/></div>
                            <p className='text-xl flex'>Successful</p>
                          </div>
                          
                        <div className='flex gap-2'><div className='w-6 h-6'/>{time}</div>
                        <div className='flex gap-2'><div className='w-6 h-6'/><a target="_blank" className='flex items-center gap-2 h-8' href={`https://nearblocks.io/address/${accounts[0].accountId}`}><p className='underline'>Transfer information</p><PiArrowSquareOutBold className='w-4 h-4'/></a></div>
                        
                      </div>
                    </div>
                    </div>
                    }
                    
                    {
                      error &&  <div className="flex w-10/12 mx-auto mb-5">
                      
                      <div className="flex w-full flex-col">
                        <div className='flex flex-col gap-2'>
                          <div className='flex items-center gap-2 text-[#F43F5E] h-8'>
                            <div><FaRegTimesCircle className='w-6 h-6'/></div>
                            <p className='text-xl flex'>Error</p>
                          </div>
                          <div className='flex gap-2'><div className='w-6 h-6'/>{time}</div>
                      </div>
                    </div>
                    </div>
                    }

                    {
                      (!success && !error) && (
                      <div className='flex flex-col mb-4 w-10/12 border-2 bg-[#F0F9FF] px-4 rounded-xl'>
                        <button className='flex justify-start my-2' onClick={handleTransferClick} disabled={!isWalletConnected} >
                          Please confirm the action.
                          <div></div>
                        </button>
                        {showTransfer && <TransferToken payload={MockPayload} />}
                      </div>
                      )
                    }

                    <div className='flex flex-col w-[80%] mx-auto my-5'>
                      <div className='flex flex-col'>
                        <span>You pay</span>
                        <div className='flex w-full justify-between mt-2'>
                          <input type="text" className='bg-transparent w-3/4 h-10 text-5xl outline-none' placeholder='0'/>
                          <div className='flex items-center gap-2 text-2xl'><SiNear /><span className='font-semibold'>NEAR</span></div>
                        </div>
                        <div className='flex flex-row-reverse'>Balance: 0.1</div>
                      </div>
                      <div className='relative h-4 w-full'>
                          <FaArrowCircleDown className='absolute left-1/2 top-1/2 w-5 h-5 -translate-x-2.5'/>
                      </div>
                      <div className='flex flex-col mt-4'>
                        <span>You receive</span>
                        <div className='flex w-full justify-between mt-2'>
                          <input type="text" className='bg-transparent w-3/4 h-10 text-5xl outline-none' placeholder='0'/>
                          <div className='flex items-center gap-2 text-2xl'><SiNear /><span className='font-semibold'>USDC</span></div>
                        </div>
                        <div className='flex flex-row-reverse'>Balance: 0.1</div>
                      </div>
                    </div>
                    
                  </div>
                 
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);
ChatMessage.displayName = 'ChatMessage';
