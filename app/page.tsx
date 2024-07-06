'use client'

import { Chat } from '@/components/Chat/Chat'
import { Chatbar } from '@/components/Chatbar/Chatbar'
import { Navbar } from '@/components/Mobile/Navbar'
import { ChatBody, Conversation, Message } from '@/types/chat'
import { KeyValuePair } from '@/types/data'
import { ErrorMessage } from '@/types/error'
// import { LatestExportFormat, SupportedExportFormats } from '@/types/export'
import { Folder, FolderType } from '@/types/folder'
import {
  OpenAIModel
  // OpenAIModelID,
  // OpenAIModels,
  // fallbackModelID
} from '@/types/openai'
import { Plugin, PluginKey } from '@/types/plugin'
import { Prompt } from '@/types/prompt'
import { getEndpoint } from '@/utils/app/api'
import {
  cleanConversationHistory,
  cleanSelectedConversation
} from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const'
import {
  saveConversation,
  saveConversations,
  updateConversation
} from '@/utils/app/conversation'
import { saveFolders } from '@/utils/app/folders'
import { exportData, importData } from '@/utils/app/importExport'
import { savePrompts } from '@/utils/app/prompts'
// import { ChevronLeft, ChevronRight } from '@tabler/icons-react';
import { IoIosArrowForward, IoIosArrowBack } from 'react-icons/io'
// import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
// import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { env } from 'process'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
// import { Wallet } from '@/lib/wallets/near-wallet'
// import { NetworkId, HelloNearContract } from '@/config'
import { WalletSelectorContextProvider } from '@/components/contexts/WalletSelectorContext'
import { useInputJSONStore, useTransferTokenStore } from '@/lib/store/store'
import { FC } from 'react'
import main from '@/utils/aiIndex'
import 'dotenv/config'

// export type OpenAIModelID = string;
interface HomeProps {
  modelId: string
}
// GPT_3_5
// const Home: FC<HomeProps> = ({
//   modelId
// }: HomeProps) => {

const Home: FC = ({}) => {
  const { t } = useTranslation('chat')

  // STATE ----------------------------------------------

  const [apiKey, setApiKey] = useState<string>('')
  const [pluginKeys, setPluginKeys] = useState<PluginKey[]>([])
  const [messageLoading, setMessageLoading] = useState<boolean>(false)
  const [lightMode, setLightMode] = useState<'dark' | 'light'>('dark')
  const [messageIsStreaming, setMessageIsStreaming] = useState<boolean>(false)
  const [session, setSession] = useState(0);
  const [modelError, setModelError] = useState<ErrorMessage | null>(null)

  const [models, setModels] = useState<OpenAIModel[]>([])

  const [folders, setFolders] = useState<Folder[]>([])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation>()
  const [currentMessage, setCurrentMessage] = useState<Message>()

  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  // const [showPromptbar, setShowPromptbar] = useState<boolean>(true)
  const { setInputJSON, setTransferObject, setSwapObject, setStakeObject } =
    useInputJSONStore()
  const {
    setSuccess,
    setError,
    setConfirmTransfer,
    setLoading,
    setCancelled,
    setMessageCount
  } = useTransferTokenStore()
  const modelId: string = 'GPT_3_5'

  // REFS ----------------------------------------------

  const stopConversationRef = useRef<boolean>(false)
  const serverSideApiKeyIsSet = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY

  // FETCH RESPONSE ----------------------------------------------

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(
  //         'https://validators.narwallets.com/metrics'
  //       )
  //       if (!response.ok) {
  //         throw new Error('Network response was not ok')
  //       }
  //       // console.log('response', response)
  //       // const jsonData = await response.json();
  //       // setData(jsonData);
  //       const reader = response?.body?.getReader()
  //       const stream = new ReadableStream({
  //         start(controller) {
  //           const process = async () => {
  //             try {
  //               const { done, value } = await reader?.read()
  //               if (done) {
  //                 controller.close()
  //                 return
  //               }
  //               controller.enqueue(value)
  //               await process()
  //             } catch (error) {
  //               controller.error(error)
  //             }
  //           }
  //           process()
  //         }
  //       })
  //       // console.log('stream', stream)

  //       const text = await new Response(stream).text()
  //       // console.log('text', text)

  //       const parseData = (text: string) => {
  //         const pattern =
  //           /metapool_(st_near_price|near_usd_price|st_near_30_day_apy|st_aur_30_day_apy|st_aur_price|eth_usd_price)\s([0-9.]+)/g
  //         const matches = text.matchAll(pattern)
  //         const parsedData = {}

  //         for (const match of matches) {
  //           const key = match[1]
  //           const value = parseFloat(match[2]).toFixed(2)
  //           parsedData[key] = value
  //         }

  //         console.log('parsedData', parsedData)

  //         return parsedData
  //       }

  //       parseData(text)
  //       // const jsonData = JSON.parse(text)
  //       // console.log('jsonData', jsonData)
  //     } catch (error) {
  //       setError(error)
  //     }
  //   }

  //   fetchData()
  // }, [])

  function stringToReadableStream(text: string) {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    let offset = 0;

    return new ReadableStream({
        pull(controller) {
            const chunkSize = 1024;
            if (offset < encodedText.length) {
                const chunk = encodedText.slice(offset, offset + chunkSize);
                controller.enqueue(chunk);
                offset += chunkSize;
            } else {
                controller.close();
            }
        }
    });
}


  const handleSend = async (
    message: Message,
    deleteCount = 0,
    plugin: Plugin | null = null
  ) => {
    //reset transfer statement
    setSuccess(false)
    setError(false)
    setConfirmTransfer(false)
    setCancelled(false)
    setLoading(false)

    // useEffect(() => {
    //   const fetchData = async () => {
    //     const response = await fetch('https://validators.narwallets.com/metrics')
    //     // const data = await response.json()
    //     console.log('fetchData', response)
    //     return response
    //   }
    // }, [])
    // useEffect(() => {
    //   console.log('log')
    //   const fetchData = async () => {
    //     try {
    //       const response = await fetch(
    //         'https://validators.narwallets.com/metrics'
    //       )
    //       if (!response.ok) {
    //         throw new Error('Network response was not ok')
    //       }
    //       console.log('response', response)
    //       // const jsonData = await response.json();
    //       // setData(jsonData);
    //     } catch (error) {
    //       setError(error)
    //     }
    //   }

    //   fetchData()
    // }, [])

    if (selectedConversation) {
      let updatedConversation: Conversation

      if (deleteCount) {
        const updatedMessages = [...selectedConversation.messages]
        for (let i = 0; i < deleteCount; i++) {
          updatedMessages.pop()
        }

        updatedConversation = {
          ...selectedConversation,
          messages: [...updatedMessages, message]
        }
      } else {
        updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, message]
        }
      }

      setSelectedConversation(updatedConversation)
      setMessageLoading(true)
      setMessageIsStreaming(true)

      const chatBody: ChatBody = {
        model: updatedConversation.model,
        messages: updatedConversation.messages,
        key: apiKey,
        prompt: updatedConversation.prompt
      }

      const endpoint = getEndpoint(plugin)
      let body

      if (!plugin) {
        body = JSON.stringify(chatBody)
      } else {
        body = JSON.stringify({
          ...chatBody
          // googleAPIKey: pluginKeys
          //   .find(key => key.pluginId === 'google-search')
          //   ?.requiredKeys.find(key => key.key === 'GOOGLE_API_KEY')?.value,
          // googleCSEId: pluginKeys
          //   .find(key => key.pluginId === 'google-search')
          //   ?.requiredKeys.find(key => key.key === 'GOOGLE_CSE_ID')?.value
        })
      }

      const controller = new AbortController()

      const execute = async(inputObj: any)  => {
        const inputJson = JSON.stringify(inputObj);
        console.log('INPUT:', inputJson);
    
        const { method, path, queries, secret, headers, body } = inputObj;
    
        // Replace this with your actual secret key directly for the client-side
        const openaiApiKey = 'sk-qVBlJkO3e99t81623PsB0zHookSQJxU360gDMooLenN01gv2'
        console.log('openaiApiKey',openaiApiKey)
    
        let result = '';
    
        try {
            const response = await fetch('https://api.red-pill.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    messages: [{ role: "user", content: queries.chatQuery[0] }],
                    model: queries.openAiModel[0],
                }),
            });
    
            if (!response.ok) {
                throw new Error('Error fetching chat completion');
            }
    
            const responseData = await response.json();
            result = responseData.choices[0].message.content;
        } catch (error) {
            console.error('Error fetching chat completion:', error);
            result = error.message;
        }
    
        return result;
    }

    console.log('message', message)
    
    
    const response = await execute({
        method: 'GET',
        path: '/ipfs/QmVHbLYhhYA5z6yKpQr4JWr3D54EhbSsh7e7BFAAyrkkMf',
        queries: {
            chatQuery: [message.content],
            openAiModel: ["gpt-4o"]
        },
        secret: { openaiApiKey: process.env.OPENAI_API_KEY },
        headers: {},
    });

      // const response = await fetch('api/message', {
      //   method: 'GET',
      //   body: JSON.stringify({
      //     messages: updatedConversation.messages,
      //     prompt: updatedConversation.prompt,
      //     address:
      //       '9b5adfd2530b9c2657b088cfc8755e3c25a6cef7fb9b44c659d12b2bd30a3f62' //test only
      //   }),
      //   signal: controller.signal
      // })

      console.log('response', response)

      // return response

      if (!response) {
        setMessageLoading(false)
        setMessageIsStreaming(false)
        toast.error(response)
        return
      }

      const data = response

      if (!data) {
        setMessageLoading(false)
        setMessageIsStreaming(false)
        return
      }

      if (!plugin) {
        if (updatedConversation.messages.length === 1) {
          const { content } = message
          const customName =
            content.length > 30 ? content.substring(0, 30) + '...' : content

          updatedConversation = {
            ...updatedConversation,
            name: customName
          }
        }

        setMessageLoading(false)

        const stream = stringToReadableStream(data);

        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let done = false
        let isFirst = true
        let text = ''

        while (!done) {
          if (stopConversationRef.current === true) {
            controller.abort()
            done = true
            break
          }
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunkValue = decoder.decode(value)

          // console.log('chunkValue', chunkValue)

          if (chunkValue.includes('{')) {
            if (chunkValue.length > 0) {
              console.log('chunkValue', chunkValue)
              const unescapedString = chunkValue.replace(/\\/g, '')

              console.log('unescapedString', unescapedString)
              // Parse the string into an object
              const jsonObject = JSON.parse(unescapedString)
              console.log('jsonObject', jsonObject)
              if (jsonObject.functionType == 'transfer')
                setTransferObject(jsonObject)
              if (jsonObject.functionType == 'swap') setSwapObject(jsonObject)
              if (jsonObject.functionType == 'stake') setStakeObject(jsonObject)
            }
            setInputJSON(chunkValue)
          }
          text += chunkValue

          if (isFirst) {
            isFirst = false
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: chunkValue }
            ]

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages
            }

            setSelectedConversation(updatedConversation)
          } else {
            const updatedMessages: Message[] = updatedConversation.messages.map(
              (message, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  return {
                    ...message,
                    content: text
                  }
                }

                return message
              }
            )

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages
            }

            setSelectedConversation(updatedConversation)
          }
        }

        saveConversation(updatedConversation)

        setMessageCount(updatedConversation.messages.length - 1)

        const updatedConversations: Conversation[] = conversations.map(
          conversation => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation
            }

            return conversation
          }
        )

        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation)
        }

        setConversations(updatedConversations)
        saveConversations(updatedConversations)

        setMessageIsStreaming(false)
      } else {
        const { answer } = await response.json()

        const updatedMessages: Message[] = [
          ...updatedConversation.messages,
          { role: 'assistant', content: answer }
        ]

        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages
        }

        setSelectedConversation(updatedConversation)
        saveConversation(updatedConversation)

        const updatedConversations: Conversation[] = conversations.map(
          conversation => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation
            }

            return conversation
          }
        )

        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation)
        }

        setConversations(updatedConversations)
        saveConversations(updatedConversations)

        setMessageLoading(false)
        setMessageIsStreaming(false)
      }
    }
  }

  // FETCH MODELS ----------------------------------------------

  // const fetchModels = async (key: string) => {
  //   const error = {
  //     title: t('Error fetching models.'),
  //     code: null,
  //     messageLines: [
  //       t(
  //         'Make sure your OpenAI API key is set in the bottom left of the sidebar.'
  //       ),
  //       t('If you completed this step, OpenAI may be experiencing issues.')
  //     ]
  //   } as ErrorMessage

  //   // const response = await modelHandler(key)
  //   const response = await fetch('/api/models', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       key
  //     })
  //   })

  //   if (!response.ok) {
  //     try {
  //       const data = await response.json()
  //       Object.assign(error, {
  //         code: data.error?.code,
  //         messageLines: [data.error?.message]
  //       })
  //     } catch (e) {}
  //     setModelError(error)
  //     return
  //   }

  //   const data = await response.json()

  //   if (!data) {
  //     setModelError(error)
  //     return
  //   }

  //   setModels(data)
  //   setModelError(null)
  // }

  // BASIC HANDLERS --------------------------------------------

  const handleLightMode = (mode: 'dark' | 'light') => {
    setLightMode('light')
    localStorage.setItem('theme', mode)
  }

  // const handleApiKeyChange = (apiKey: string) => {
  //   setApiKey(apiKey);
  //   localStorage.setItem('apiKey', apiKey);
  // };

  // const handlePluginKeyChange = (pluginKey: PluginKey) => {
  //   if (pluginKeys.some(key => key.pluginId === pluginKey.pluginId)) {
  //     const updatedPluginKeys = pluginKeys.map(key => {
  //       if (key.pluginId === pluginKey.pluginId) {
  //         return pluginKey
  //       }

  //       return key
  //     })

  //     setPluginKeys(updatedPluginKeys)

  //     localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys))
  //   } else {
  //     setPluginKeys([...pluginKeys, pluginKey])

  //     localStorage.setItem(
  //       'pluginKeys',
  //       JSON.stringify([...pluginKeys, pluginKey])
  //     )
  //   }
  // }

  // const handleClearPluginKey = (pluginKey: PluginKey) => {
  //   const updatedPluginKeys = pluginKeys.filter(
  //     key => key.pluginId !== pluginKey.pluginId
  //   )

  //   if (updatedPluginKeys.length === 0) {
  //     setPluginKeys([])
  //     localStorage.removeItem('pluginKeys')
  //     return
  //   }

  //   setPluginKeys(updatedPluginKeys)

  //   localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys))
  // }

  const handleToggleChatbar = () => {
    setShowSidebar(!showSidebar)
    localStorage.setItem('showChatbar', JSON.stringify(!showSidebar))
  }

  // const handleTogglePromptbar = () => {
  //   setShowPromptbar(!showPromptbar)
  //   localStorage.setItem('showPromptbar', JSON.stringify(!showPromptbar))
  // }

  // const handleExportData = () => {
  //   exportData()
  // }

  // const handleImportConversations = (data: SupportedExportFormats) => {
  //   const { history, folders, prompts }: LatestExportFormat = importData(data)

  //   setConversations(history)
  //   setSelectedConversation(history[history.length - 1])
  //   setFolders(folders)
  //   setPrompts(prompts)
  // }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    saveConversation(conversation)
  }

  // FOLDER OPERATIONS  --------------------------------------------

  // const handleCreateFolder = (name: string, type: FolderType) => {
  //   const newFolder: Folder = {
  //     id: uuidv4(),
  //     name,
  //     type
  //   }

  //   const updatedFolders = [...folders, newFolder]

  //   setFolders(updatedFolders)
  //   saveFolders(updatedFolders)
  // }

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId)
    setFolders(updatedFolders)
    saveFolders(updatedFolders)

    const updatedConversations: Conversation[] = conversations.map(c => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null
        }
      }

      return c
    })
    setConversations(updatedConversations)
    saveConversations(updatedConversations)

    const updatedPrompts: Prompt[] = prompts.map(p => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null
        }
      }

      return p
    })
    setPrompts(updatedPrompts)
    savePrompts(updatedPrompts)
  }

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          name
        }
      }

      return f
    })

    setFolders(updatedFolders)
    saveFolders(updatedFolders)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    const newConversation: Conversation = {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: lastConversation?.model || {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null
    }

    const updatedConversations = [...conversations, newConversation]

    setSelectedConversation(newConversation)
    setConversations(updatedConversations)

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    setMessageLoading(false)
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter(
      c => c.id !== conversation.id
    )
    setConversations(updatedConversations)
    saveConversations(updatedConversations)

    if (updatedConversations.length > 0) {
      setSelectedConversation(
        updatedConversations[updatedConversations.length - 1]
      )
      saveConversation(updatedConversations[updatedConversations.length - 1])
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: {
          id: 'gpt-4',
          name: 'GPT-4',
          maxLength: 24000,
          tokenLimit: 8000
        },
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: null
      })
      localStorage.removeItem('selectedConversation')
    }
  }

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value
    }

    const { single, all } = updateConversation(
      updatedConversation,
      conversations
    )

    setSelectedConversation(single)
    setConversations(all)
  }

  const handleClearConversations = () => {
    setConversations([])
    localStorage.removeItem('conversationHistory')

    setSelectedConversation({
      id: uuidv4(),
      name: 'New conversation',
      messages: [],
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      folderId: null
    })
    localStorage.removeItem('selectedConversation')

    const updatedFolders = folders.filter(f => f.type !== 'chat')
    setFolders(updatedFolders)
    saveFolders(updatedFolders)
  }

  const handleEditMessage = (message: Message, messageIndex: number) => {
    if (selectedConversation) {
      const updatedMessages = selectedConversation.messages
        .map((m, i) => {
          if (i < messageIndex) {
            return m
          }
        })
        .filter(m => m) as Message[]

      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages
      }

      const { single, all } = updateConversation(
        updatedConversation,
        conversations
      )

      setSelectedConversation(single)
      setConversations(all)

      setCurrentMessage(message)
    }
  }

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (currentMessage) {
      handleSend(currentMessage)
      setCurrentMessage(undefined)
    }
  }, [currentMessage])

  useEffect(() => {
    if (typeof window !== undefined && window.innerWidth < 640) {
      setShowSidebar(false)
    }
  }, [selectedConversation])

  // useEffect(() => {
  //   if (apiKey) {
  //     fetchModels(apiKey)
  //   }
  // }, [apiKey])

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme) {
      setLightMode(theme as 'dark' | 'light')
    }

    const apiKey = localStorage.getItem('apiKey')

    if (serverSideApiKeyIsSet) {
      // fetchModels('')
      setApiKey('')
      localStorage.removeItem('apiKey')
    } else if (apiKey) {
      setApiKey(apiKey)
      // fetchModels(apiKey)
    }

    if (typeof window !== undefined && window.innerWidth < 640) {
      setShowSidebar(false)
    }

    const showChatbar = localStorage.getItem('showChatbar')
    if (showChatbar) {
      setShowSidebar(showChatbar === 'true')
    }

    const folders = localStorage.getItem('folders')
    if (folders) {
      setFolders(JSON.parse(folders))
    }

    const prompts = localStorage.getItem('prompts')
    if (prompts) {
      setPrompts(JSON.parse(prompts))
    }

    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory)
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory
      )
      setConversations(cleanedConversationHistory)
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation
      )
      setSelectedConversation(cleanedSelectedConversation)
    } else {
      setSelectedConversation({
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        model: {
          id: 'gpt-4',
          name: 'GPT-4',
          maxLength: 24000,
          tokenLimit: 8000
        },
        prompt: DEFAULT_SYSTEM_PROMPT,
        folderId: null
      })
    }
  }, [serverSideApiKeyIsSet])

  

  return (
    <>
      <Head>
        <title>ZETA AI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <WalletSelectorContextProvider> */}
      {
        selectedConversation && session == 0 && (
          <div
          className={`flex h-screen w-screen flex-col text-sm text-black dark:text-white ${lightMode}`}
        >
           <div className="flex h-full w-full pt-[48px] sm:pt-0 justify-center items-center">
            <div className='w-[30rem] h-60 border-black border-2 rounded-xl'>
            <div className="grid w-full items-center gap-1.5 p-2">
        <label htmlFor="email">Email</label>
        <input
          className="w-full border-2 border-black"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          id="email"
          type="email"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 p-2">
        <label htmlFor="password">Password</label>
        <input
          className="w-full border-2 border-black"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          id="password"
          type="password"
        />
      </div>
      <div className='flex justify-center items-center mt-5'>
      <button className='w-1/2 border-2 border-black rounded-lg flex justify-center items-center' onClick={() => setSession(1)}>
Login
</button>
      </div>
     
            </div>
          </div>
        </div>
        )
      }

      {selectedConversation && session == 1 && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            {showSidebar ? (
              <div>
                <Chatbar
                  loading={messageIsStreaming}
                  conversations={conversations}
                  // lightMode={lightMode}
                  selectedConversation={selectedConversation}
                  apiKey={apiKey}
                  // pluginKeys={pluginKeys}
                  folders={folders.filter(folder => folder.type === 'chat')}
                  // onToggleLightMode={handleLightMode}
                  // onCreateFolder={name => handleCreateFolder(name, 'chat')}
                  onDeleteFolder={handleDeleteFolder}
                  onUpdateFolder={handleUpdateFolder}
                  onNewConversation={handleNewConversation}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={handleDeleteConversation}
                  onUpdateConversation={handleUpdateConversation}
                  // onApiKeyChange={handleApiKeyChange}
                  onClearConversations={handleClearConversations}
                  // onExportConversations={handleExportData}
                  // onImportConversations={handleImportConversations}
                  // onPluginKeyChange={handlePluginKeyChange}
                  // onClearPluginKey={handleClearPluginKey}
                />

                {/* <button
                    className="fixed top-5 left-[270px] z-50 h-7 w-7  sm:top-0.5 sm:left-[270px] sm:h-8 sm:w-8 sm:text-neutral-700"
                    onClick={handleToggleChatbar}
                  >
                    <IoIosArrowBack />
                  </button> */}
                <button
                  className="fixed bottom-[50%] left-[270px] text-black z-50 h-7 w-7 hover:text-gray-400"
                  onClick={handleToggleChatbar}
                  title="Toggle ChatBar"
                >
                  <IoIosArrowBack className="w-[24px] h-[24px]" />
                </button>
                {/* <div
                    onClick={handleToggleChatbar}
                    className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
                  ></div> */}
              </div>
            ) : (
              <button
                className="fixed bottom-[50%] left-4 z-50 h-7 w-7 text-black hover:text-gray-400"
                onClick={handleToggleChatbar}
                title="Toggle ChatBar"
              >
                <IoIosArrowForward className="w-[24px] h-[24px]" />
              </button>
            )}

            <div className="flex flex-1">
              <Chat
                conversation={selectedConversation}
                messageIsStreaming={messageIsStreaming}
                apiKey={apiKey}
                serverSideApiKeyIsSet={serverSideApiKeyIsSet}
                modelId={modelId}
                modelError={modelError}
                models={models}
                loading={messageLoading}
                prompts={prompts}
                onSend={handleSend}
                onUpdateConversation={handleUpdateConversation}
                onEditMessage={handleEditMessage}
                stopConversationRef={stopConversationRef}
              />
            </div>
          </div>
        </main>
      )}
      {/* </WalletSelectorContextProvider> */}
    </>
  )
}
export default Home
