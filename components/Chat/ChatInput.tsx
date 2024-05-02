import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import {
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import {
  FC,
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PluginSelect } from '../../components/Chat/PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { TransferToken, Payload } from '@/components/Wallet/trasferTokenClient';

interface Props {
  messageIsStreaming: boolean;
  model: OpenAIModel;
  conversationIsEmpty: boolean;
  prompts: Prompt[];
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
}

const MockPayload: Payload = {
  userId: '9b5adfd2530b9c2657b088cfc8755e3c25a6cef7fb9b44c659d12b2bd30a3f62',
  receiverId: 'c7413c9c61fd11557efbfae8a063daebfa5774432aca543833d05bcd7050d9e6',
  amount: '0.01',
  symbol: 'NEAR'
};
 
export const ChatInput: FC<Props> = ({
  messageIsStreaming,
  model,
  conversationIsEmpty,
  prompts,
  onSend,
  onRegenerate,
  stopConversationRef,
  textareaRef,
}) => {
  const { t } = useTranslation('chat');

  console.log('conversationIsEmpty', conversationIsEmpty)

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  // const [initState, setInitState] = useState(false) 
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showTransfer, setShowTransfer] = useState(true);

  const exampleMessages = [
    {
      heading: 'Transfer',
      message: `What are the trending memecoins today?`
    },
    {
      heading: 'Check Balance',
      message: 'What is the price of $DOGE right now?'
    },
    {
      heading: 'Exchange ETH',
      message: `I would like to buy 42 $DOGE`
    },
    {
      heading: 'Create wallet',
      message: `What are some recent events about $DOGE?`
    },
    {
      heading: 'Buy NEAR',
      message: `I would like to buy 42 $DOGE`
    },
  ]

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = model.maxLength;

    if (value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    setContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming) {
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }

    // setInitState(false)

    onSend({ role: 'user', content }, plugin);
    setContent('');
    setPlugin(null);

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTransferClick = () => {
    if (isWalletConnected) {
      setShowTransfer(true);
    } else {
      alert("Please connect your wallet first!");
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }
  }, [content]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className={`${conversationIsEmpty ? 'h-full flex justify-center items-start ' : ''}`}>
    { conversationIsEmpty ? (
        <div className="w-full border-transparent  pt-6 md:pt-2">
          
          <div className='flex gap-2 justify-center flex-col items-center'>
            <h1 className='font-raleway font-medium text-6xl text-[#141C2A]'>Sender <span className='font-raleway font-light'>OS</span> </h1>
            <p className=' text-xl text-[#9CA8B4]'>How can I help you today</p>
          </div>
          
          <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">

            <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md bg-white sm:mx-4">
          
          <div className="relative gradientBorder flex grow px-4 flex-col overflow-x-auto sm:rounded-2xl sm:border">
            <div className='flex items-end mt-4'>
              <textarea
                  ref={textareaRef}
                  className="min-h-[40px] py-4 w-full resize-none pr-4 focus-within:outline-none sm:text-sm bg-transparent text-black"
                  style={{
                    resize: 'none',
                    // bottom: '0px',
                    bottom: `${textareaRef?.current?.scrollHeight}px`,
                    maxHeight: '400px',
                    overflow: `${
                      textareaRef.current && textareaRef.current.scrollHeight > 400
                        ? 'auto'
                        : 'hidden'
                    }`,
                  }}
                  value={content}
                  rows={1}
                  onCompositionStart={() => setIsTyping(true)}
                  onCompositionEnd={() => setIsTyping(false)}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSend} size="icon" className='mb-2'>
                      <Image
                        src="/send.svg"
                        alt="sendMSG"
                        width={40}
                        height={40}
                      />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>How can I help you?</TooltipContent>
                </Tooltip>
            </div>

              
            <div className="w-full bg-black" style={{ height: '1px' }}></div>
            <div className="flex justify-start max-w-full py-4 overflow-x-auto gap-3">
              <div className="flex gap-1 items-center">
                <Image src={'/intent.png'} alt="intent" width={24} height={24} />
              </div>
              {exampleMessages.map((example, index) => (
                <div
                  key={example.heading}
                  className={`h-8 flex items-center gap-2 px-4 py-1 text-black rounded-2xl bg-[#E6E6E6] cursor-pointers`}
                  onClick={() => {
                    setContent(example.message)
                  }}
                >
                  <div className="text-md font-semibold text-nowrap cursor-pointer">
                    {example.heading}
                  </div>
                </div>
              ))}
            </div>
          </div>
            </div>
          </div>
          
        </div>
      ) 
      : 
      (
        <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 md:pt-2">
          <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
            {messageIsStreaming && (
              <button
                className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-90  md:mb-0 md:mt-2"
                onClick={handleStopConversation}
              >
                <IconPlayerStop size={16} /> {t('Stop Generating')}
              </button>
            )}
    
            {!messageIsStreaming && !conversationIsEmpty && (
              <>
                {/* <button onClick={handleTransferClick} disabled={!isWalletConnected} >
                Transfer
                </button>
                {showTransfer && <TransferToken payload={MockPayload} />} */}
              <button
                className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-90  md:mb-0 md:mt-2"
                onClick={onRegenerate}
              >
                <IconRepeat size={16} /> {t('Regenerate response')}
              </button>
              </>
            )}
    
            <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border sm:mx-4">
            
          <div className="relative flex max-h-60 max-w-full gradientBorder p-4 grow flex-col overflow-x-auto sm:rounded-2xl sm:border">
          <div className='flex items-end mt-4'>
              <textarea
                  ref={textareaRef}
                  className="min-h-[40px] py-4 w-full resize-none pr-4 focus-within:outline-none sm:text-sm bg-transparent text-black"
                  style={{
                    resize: 'none',
                    // bottom: '0px',
                    bottom: `${textareaRef?.current?.scrollHeight}px`,
                    maxHeight: '400px',
                    overflow: `${
                      textareaRef.current && textareaRef.current.scrollHeight > 400
                        ? 'auto'
                        : 'hidden'
                    }`,
                  }}
                  value={content}
                  rows={1}
                  onCompositionStart={() => setIsTyping(true)}
                  onCompositionEnd={() => setIsTyping(false)}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSend} size="icon" className='mb-2'>
                      <Image
                        src="/send.svg"
                        alt="sendMSG"
                        width={40}
                        height={40}
                      />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>How can I help you?</TooltipContent>
                </Tooltip>
            </div>
      
            <div className="w-full bg-black" style={{ height: '1px' }}></div>
            <div className="flex justify-start max-w-full py-4 overflow-x-auto gap-3">
              <div className="flex gap-1 items-center">
                <Image src={'/intent.png'} alt="intent" width={24} height={24} />
              </div>
              {exampleMessages.map((example, index) => (
                <div
                  key={example.heading}
                  className={`h-8 flex items-center gap-2 px-4 py-1 text-black rounded-2xl bg-[#E6E6E6] cursor-pointers`}
                  onClick={() => {
                    setContent(example.message)
                  }}
                >
                  <div className="text-md font-semibold text-nowrap cursor-pointer">
                    {example.heading}
                  </div>
                </div>
              ))}
            </div>
          </div> 
            </div>
          </div>
        </div>
      )}
    </div>
  )
};
