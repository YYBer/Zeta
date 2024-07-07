import { Message } from '@/types/chat'
import { OpenAIModel } from '@/types/openai'
import { Plugin } from '@/types/plugin'
import { Prompt } from '@/types/prompt'
import {
  // IconBolt,
  // IconBrandGoogle,
  IconPlayerStop,
  IconRepeat
  // IconSend,
} from '@tabler/icons-react'
import { useTranslation } from 'next-i18next'
import {
  FC,
  // KeyboardEvent,
  MutableRefObject,
  // useCallback,
  // useEffect,
  // useRef,
  useState
} from 'react'
// import { PluginSelect } from '../../components/Chat/PluginSelect';
// import { PromptList } from './PromptList';
// import { VariableModal } from './VariableModal';
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
// import ReactQuill, { Quill } from 'react-quill';
// import dynamic from "next/dynamic";
// import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
// import contents from '../../fakeContent.json'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'
import Text from '@tiptap/extension-text'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import { useTransferTokenStore } from '@/lib/store/store'
interface Props {
  messageIsStreaming: boolean
  model: OpenAIModel
  conversationIsEmpty: boolean
  prompts: Prompt[]
  onSend: (message: Message, plugin: Plugin | null) => void
  onRegenerate: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export const ChatInput: FC<Props> = ({
  messageIsStreaming,
  model,
  conversationIsEmpty,
  prompts,
  onSend,
  onRegenerate,
  stopConversationRef,
  textareaRef
}) => {
  const { t } = useTranslation('chat')

  // const [content, setContent] = useState<string>();
  // const [isTyping, setIsTyping] = useState<boolean>(false);
  // const [showPromptList, setShowPromptList] = useState(false);
  // const [activePromptIndex, setActivePromptIndex] = useState(0);
  // const [promptInputValue, setPromptInputValue] = useState('');
  // const [variables, setVariables] = useState<string[]>([]);
  // const [isModalVisible, setIsModalVisible] = useState(false);
  // const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const {
    setSuccess,
    setError,
    setCancelled,
    setConfirmTransfer,
    setConfirmStake,
    setConfirmSwap,
    setConfirmUnstake
  } = useTransferTokenStore()
  // const [value, setValue] = useState('i am the most handsome man');
  // const [html, setHtml] = useState();

  // const quill = new Quill('#editor', {
  //   formats: ['italic'],
  // });

  // const Delta = Quill.import('delta');
  // quill.setContents(
  //   new Delta()
  //     .insert('Only ')
  //     .insert('italic', { italic: true })
  //     .insert(' is allowed. ')
  //     .insert('Bold', { bold: true })
  //     .insert(' is not.')
  // );

  // console.log('contents', contents)

  // const ReactQuill = dynamic(import("react-quill"), {
  //   ssr: false,
  //   loading: () => <p>Loading ...</p>,
  // });

  // Reference to the Quill editor instance
  // const quillRef = useRef(null);

  // // Function to handle changes in the editor content
  // const handleChanges = (content, delta, source, editor) => {
  //   // setValue(content);
  // };

  const exampleMessages = [
    {
      heading: 'Transfer',
      message: `<p>Please transfer <span style="color: #0040ff; font-weight: bold;">0.01</span> <span style="color: #0040ff; font-weight: bold;">USDC</span> to <span style="color: #0040ff; font-weight: bold;">b32d7e4ea30cdeb78a6b9aa754892877ae64c54ec75e812c04cf134e7ad73241</span></p>`
    },
    {
      heading: 'Stake Near',
      message: `<p> I want to stake <span style="color: #0040ff"> 1.5 </span> <span style="color: #0040ff">NEAR</span></p>`
    },
    {
      heading: 'Exchange ETH',
      message: `<p> I would like to swap <span style="color: #0040ff">0.01 </span><span style="color: #0040ff">USDC </span>to <span style="color: #0040ff">ETH</span>`
    },
    {
      heading: 'Unstake Near',
      message: `<p> I want to unstake all my <span style="color: #0040ff">NEAR</span></p>`
    },
    {
      heading: 'NEAR price',
      message: `What is <span style="color: #0040ff">NEAR</span> price now`
    }
  ]

  const editor = useEditor({
    extensions: [Document, Paragraph, Text, TextStyle, Color],
    content: ``
  }) as Editor

  // const promptListRef = useRef<HTMLUListElement | null>(null);

  // const filteredPrompts = prompts.filter((prompt) =>
  //   prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  // );

  // const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const value = e.target.value;
  //   const maxLength = model.maxLength;

  //   if (value.length > maxLength) {
  //     alert(
  //       t(
  //         `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
  //         { maxLength, valueLength: value.length },
  //       ),
  //     );
  //     return;
  //   }

  //   setContent(value);
  //   updatePromptListVisibility(value);
  // };

  const handleSend = () => {
    const content = editor.getText()

    setSuccess(false)
    setError(false)
    setCancelled(false)
    setConfirmTransfer(false)
    setConfirmSwap(false)
    setConfirmStake(false)
    setConfirmUnstake(false)

    if (messageIsStreaming) {
      return
    }

    if (!content) {
      alert(t('Please enter a message'))
      return
    }

    onSend({ role: 'user', content }, plugin)
    editor.commands.setContent('')
    // setContent('');
    setPlugin(null)

    if (
      typeof window !== 'undefined' &&
      window.innerWidth < 640 &&
      textareaRef &&
      textareaRef.current
    ) {
      textareaRef.current.blur()
    }
  }

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  // const isMobile = () => {
  //   const userAgent =
  //     typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
  //   const mobileRegex =
  //     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  //   return mobileRegex.test(userAgent);
  // };

  // const handleInitModal = () => {
  //   const selectedPrompt = filteredPrompts[activePromptIndex];
  //   if (selectedPrompt) {
  //     setContent((prevContent) => {
  //       const newContent = prevContent?.replace(
  //         /\/\w*$/,
  //         selectedPrompt.content,
  //       );
  //       return newContent;
  //     });
  //     handlePromptSelect(selectedPrompt);
  //   }
  //   setShowPromptList(false);
  // };

  // const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  //   if (showPromptList) {
  //     if (e.key === 'ArrowDown') {
  //       e.preventDefault();
  //       setActivePromptIndex((prevIndex) =>
  //         prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
  //       );
  //     } else if (e.key === 'ArrowUp') {
  //       e.preventDefault();
  //       setActivePromptIndex((prevIndex) =>
  //         prevIndex > 0 ? prevIndex - 1 : prevIndex,
  //       );
  //     } else if (e.key === 'Tab') {
  //       e.preventDefault();
  //       setActivePromptIndex((prevIndex) =>
  //         prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
  //       );
  //     } else if (e.key === 'Enter') {
  //       e.preventDefault();
  //       handleInitModal();
  //     } else if (e.key === 'Escape') {
  //       e.preventDefault();
  //       setShowPromptList(false);
  //     } else {
  //       setActivePromptIndex(0);
  //     }
  //   } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSend();
  //   } else if (e.key === '/' && e.metaKey) {
  //     e.preventDefault();
  //     setShowPluginSelect(!showPluginSelect);
  //   }
  // };

  // const parseVariables = (content: string) => {
  //   const regex = /{{(.*?)}}/g;
  //   const foundVariables = [];
  //   let match;

  //   while ((match = regex.exec(content)) !== null) {
  //     foundVariables.push(match[1]);
  //   }

  //   return foundVariables;
  // };

  // const updatePromptListVisibility = useCallback((text: string) => {
  //   const match = text.match(/\/\w*$/);

  //   if (match) {
  //     setShowPromptList(true);
  //     setPromptInputValue(match[0].slice(1));
  //   } else {
  //     setShowPromptList(false);
  //     setPromptInputValue('');
  //   }
  // }, []);

  // const handlePromptSelect = (prompt: Prompt) => {
  //   const parsedVariables = parseVariables(prompt.content);
  //   setVariables(parsedVariables);

  //   if (parsedVariables.length > 0) {
  //     setIsModalVisible(true);
  //   } else {
  //     setContent((prevContent) => {
  //       const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
  //       return updatedContent;
  //     });
  //     updatePromptListVisibility(prompt.content);
  //   }
  // };

  // const handleSubmit = (updatedVariables: string[]) => {
  //   const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
  //     const index = variables.indexOf(variable);
  //     return updatedVariables[index];
  //   });

  //   setContent(newContent);

  //   if (textareaRef && textareaRef.current) {
  //     textareaRef.current.focus();
  //   }
  // };

  // useEffect(() => {
  //   if (promptListRef.current) {
  //     promptListRef.current.scrollTop = activePromptIndex * 30;
  //   }
  // }, [activePromptIndex]);

  // useEffect(() => {
  //   if (textareaRef && textareaRef.current) {
  //     textareaRef.current.style.height = 'inherit';
  //     textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
  //     textareaRef.current.style.overflow = `${
  //       textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
  //     }`;
  //   }
  // }, [content]);

  // useEffect(() => {
  //   const handleOutsideClick = (e: MouseEvent) => {
  //     if (
  //       promptListRef.current &&
  //       !promptListRef.current.contains(e.target as Node)
  //     ) {
  //       setShowPromptList(false);
  //     }
  //   };

  //   window.addEventListener('click', handleOutsideClick);

  //   return () => {
  //     window.removeEventListener('click', handleOutsideClick);
  //   };
  // }, []);

  // Function to set new content in the editor
  const handleSetContents = (buttonContent: string) => {
    const newContent = buttonContent
    editor.commands.setContent(newContent)
  }

  const handleSetAndSendContents = (content: string) => {
    handleSetContents(content)
    handleSend()
  }

  return (
    <div
      className={`${conversationIsEmpty ? 'h-full flex justify-center items-start ' : ''}`}
    >
      {conversationIsEmpty ? (
        <div className="w-full border-transparent  pt-6 md:pt-2">
          <div className="flex gap-2 justify-center flex-col items-center">
            <h1 className="font-raleway font-medium text-6xl text-[#141C2A]">
              Zeta <span className="font-raleway font-light">AI</span>{' '}
            </h1>
            <p className=" text-xl text-[#9CA8B4]">How can I help you today</p>
          </div>

          {/* <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
            <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md bg-white sm:mx-4">
              <div className="relative flex max-h-60 max-w-full mx-2 lg:mx-0 gradientBorder p-4 grow flex-col overflow-x-auto border-transparent overflow-y-auto">
                <div className="flex items-end mt-4">
                  <EditorContent
                    className="min-h-[40px] py-4 w-full resize-none pr-4 focus-within:outline-none sm:text-sm bg-transparent text-black overflow-y-auto"
                    editor={editor}
                    style={{
                      resize: 'none',
                      bottom: `${textareaRef?.current?.scrollHeight}px`,
                      maxHeight: '400px',
                      overflow: `${
                        textareaRef.current &&
                        textareaRef.current.scrollHeight > 400
                          ? 'auto'
                          : 'hidden'
                      }`
                    }}
                  />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSend} size="icon" className="mb-2">
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

                <div
                  className="w-full bg-black"
                  style={{ height: '1px' }}
                ></div>
                <div className="flex justify-start max-w-full py-4 overflow-x-auto gap-3">
                  <div className="flex gap-1 items-center">
                    <Image
                      src={'/intent.png'}
                      alt="intent"
                      width={24}
                      height={24}
                    />
                  </div>
                  {exampleMessages.map((example, index) => (
                    <div
                      key={example.heading}
                      className={`h-8 flex items-center gap-2 px-4 py-1 text-black rounded-2xl bg-[#E6E6E6] cursor-pointers`}
                      onClick={() => {
                        handleSetContents(example.message)
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
          </div> */}

<div className='w-full h-full flex justify-center items-center gap-5 mt-10'>
            <div className='w-60 h-20 border border-black text-black flex justify-center items-center cursor-pointer' onClick={() => {
                        handleSetAndSendContents('Stock')
                      }}>
Stock
            </div>
            <div className='w-60 h-20 border border-black text-black flex justify-center items-center cursor-pointer' onClick={() => {
                        handleSetAndSendContents('DeFi')
                      }}>
DeFi
            </div>
            <div className='w-60 h-20 border border-black text-black flex justify-center items-center cursor-pointer' onClick={() => {
                        handleSetAndSendContents('RWA')
                      }}>
RWA
            </div>
            <div className='w-60 h-20 border border-black text-black flex justify-center items-center cursor-pointer' onClick={() => {
                        handleSetAndSendContents('Buy 1 Near token')
                      }}>
Buy
            </div>
          </div>

        </div>
      ) : (
        <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 md:pt-2">
          <div className="stretch mt-4 flex flex-row gap-3 last:mb-2  md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
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
                <button
                  className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-90  md:mb-0 md:mt-2"
                  onClick={onRegenerate}
                >
                  <IconRepeat size={16} /> {t('Regenerate response')}
                </button>
              </>
            )}

            <div className="relative flex w-full flex-grow flex-col mx-auto">
              <div className="relative flex max-h-60 max-w-full mx-2 lg:mx-0 gradientBorder p-4 grow flex-col overflow-x-auto border-transparent overflow-y-auto">
                <div className="flex items-end mt-4">
                  {/* <textarea
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
                /> */}

                  <EditorContent
                    className="min-h-[40px] py-4 w-full resize-none pr-4 focus-within:outline-none sm:text-sm bg-transparent text-black"
                    editor={editor}
                    style={{
                      resize: 'none',
                      // bottom: '0px',
                      bottom: `${textareaRef?.current?.scrollHeight}px`,
                      maxHeight: '400px',
                      overflow: `${
                        textareaRef.current &&
                        textareaRef.current.scrollHeight > 400
                          ? 'auto'
                          : 'hidden'
                      }`
                    }}
                    // onCompositionStart={() => setIsTyping(true)}
                    // onCompositionEnd={() => setIsTyping(false)}
                    // onChange={handleChange}
                    // onKeyDown={handleKeyDown}
                  />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSend} size="icon" className="mb-2">
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

                <div
                  className="w-full bg-black"
                  style={{ height: '1px' }}
                ></div>
                {/* <div className="flex justify-start max-w-full py-4 overflow-x-auto gap-3">
                  <div className="flex gap-1 items-center">
                    <Image
                      src={'/intent.png'}
                      alt="intent"
                      width={24}
                      height={24}
                    />
                  </div>
                  {exampleMessages.map((example, index) => (
                    <div
                      key={example.heading}
                      className={`h-8 flex items-center gap-2 px-4 py-1 text-black rounded-2xl bg-[#E6E6E6] cursor-pointers`}
                      onClick={() => {
                        handleSetContents(example.message)
                      }}
                    >
                      <div className="text-md font-semibold text-nowrap cursor-pointer">
                        {example.heading}
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
