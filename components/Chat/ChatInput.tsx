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

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [initState, setInitState] = useState(true)

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

    setInitState(false)

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
    <div className='h-full flex justify-center items-start'>


   { initState ? (
      <div className="w-full border-transparent  pt-6 md:pt-2">
        
        <div className='flex gap-2 justify-center flex-col items-center'>
          <h1 className='text-6xl text-[#141C2A]'>Sender OS</h1>
          <p className='text-xl text-[#9CA8B4]'>How can I help you today</p>
        </div>
        
        <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">

          {!messageIsStreaming && !conversationIsEmpty && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4  md:mb-0 md:mt-2"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

          <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md bg-white sm:mx-4">
          
        <div className="relative gradientBorder flex grow px-4 flex-col overflow-x-auto sm:rounded-2xl sm:border">
          <div className='flex items-end'>
            <textarea
                ref={textareaRef}
                className="min-h-[60px] w-full resize-none pr-4 py-[1.3rem] focus-within:outline-none sm:text-sm bg-transparent text-black"
                style={{
                  resize: 'none',
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
                  <Button onClick={handleSend} size="icon">
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
      <div className="absolute bottom-0 left-0 w-full border-transparent  pt-6 md:pt-2">
        <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
          {messageIsStreaming && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4  md:mb-0 md:mt-2"
              onClick={handleStopConversation}
            >
              <IconPlayerStop size={16} /> {t('Stop Generating')}
            </button>
          )}
  
          {!messageIsStreaming && !conversationIsEmpty && (
            <button
              className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4  md:mb-0 md:mt-2"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}
  
          <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border border-black/10 sm:mx-4">
            {/* <button
              className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={() => setShowPluginSelect(!showPluginSelect)}
              onKeyDown={(e) => {}}
            >
              {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
            </button> */}
  
            {/* {showPluginSelect && (
              <div className="absolute left-0 bottom-14 bg-white dark:bg-[#343541]">
                <PluginSelect
                  plugin={plugin}
                  onPluginChange={(plugin: Plugin) => {
                    setPlugin(plugin);
                    setShowPluginSelect(false);
  
                    if (textareaRef && textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                />
              </div>
            )} */}
  
        <div className="relative flex max-h-60 max-w-full gradientBorder p-4 grow flex-col overflow-x-auto sm:rounded-2xl sm:border">
          <div className='flex items-end'>
            <textarea
                ref={textareaRef}
                className="min-h-[60px] w-full px-2 bg-transparent text-black resize-none pr-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                style={{
                  resize: 'none',
                  bottom: `${textareaRef?.current?.scrollHeight}px`,
                  maxHeight: '400px',
                  overflow: `${
                    textareaRef.current && textareaRef.current.scrollHeight > 400
                      ? 'auto'
                      : 'hidden'
                  }`,
                }}
                // placeholder={
                //   t('Type a message or type "/" to select a prompt...') || ''
                // }
                value={content}
                rows={1}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              {/* <div className="absolute right-0 bottom-[13px] sm:right-4"> */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSend} size="icon">
                    <Image
                      src="/sendMSG.png"
                      alt="sendMSG"
                      width={40}
                      height={40}
                    />
                    <span className="sr-only">Send message</span>
                  </Button>
                  {/* <button
                  className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
                  onClick={handleSend}
                >
                  {messageIsStreaming ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
                  ) : (
                    <IconSend size={18} />
                  )}
                </button> */}
                </TooltipTrigger>
                <TooltipContent>How can I help you?</TooltipContent>
              </Tooltip>
            {/* </div> */}
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
  
            {/* <textarea
              ref={textareaRef}
              className="min-h-[60px] w-full resize-none pr-4 py-[1.3rem] bg-gray-200 focus-within:outline-none sm:text-sm"
              style={{
                resize: 'none',
                bottom: `${textareaRef?.current?.scrollHeight}px`,
                maxHeight: '400px',
                overflow: `${
                  textareaRef.current && textareaRef.current.scrollHeight > 400
                    ? 'auto'
                    : 'hidden'
                }`,
              }}
              placeholder={
                t('Type a message or type "/" to select a prompt...') || ''
              }
              value={content}
              rows={1}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
  
            <button
              className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
              ) : (
                <IconSend size={18} />
              )}
            </button> */}
  
            {/* {showPromptList && filteredPrompts.length > 0 && (
              <div className="absolute bottom-12 w-full">
                <PromptList
                  activePromptIndex={activePromptIndex}
                  prompts={filteredPrompts}
                  onSelect={handleInitModal}
                  onMouseOver={setActivePromptIndex}
                  promptListRef={promptListRef}
                />
              </div>
            )}
  
            {isModalVisible && (
              <VariableModal
                prompt={prompts[activePromptIndex]}
                variables={variables}
                onSubmit={handleSubmit}
                onClose={() => setIsModalVisible(false)}
              />
            )} */}
          </div>
        </div>
      </div>
    )}
    </div>
  )
};
