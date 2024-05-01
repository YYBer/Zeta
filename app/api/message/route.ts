import { ChatOpenAI } from 'langchain/chat_models/openai'
import { CallbackManager } from 'langchain/callbacks'
import { BufferMemory, ChatMessageHistory } from 'langchain/memory'
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage
} from 'langchain/schema'
import { NextResponse } from 'next/server'
import { ConversationChain } from 'langchain/chains'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate
} from 'langchain/prompts'
import { Message } from '@/types/chat'

export const runtime = 'edge'

function mapStoredMessagesToChatMessages(messages: Message[]): BaseMessage[] {
  return messages.map(message => {
    switch (message.role) {
      case 'user':
        return new HumanMessage(message.content.toString())
      case 'assistant':
        return new AIMessage(message.content.toString())
      // case 'system':
      // return new SystemMessage(message.content.toString())
      default:
        throw new Error('Role must be defined for generic messages')
    }
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const messages: Message[] = body.messages
  const prompt: string = body.prompt

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  let counter = 0
  let string = ''
  const chat = new ChatOpenAI({
    streaming: true,
    maxRetries: 1,
    callbackManager: CallbackManager.fromHandlers({
      handleLLMNewToken: async (token: string, runId, parentRunId) => {
        await writer.ready
        string += token
        counter++
        await writer.write(encoder.encode(`${token}`))
      },
      handleLLMEnd: async () => {
        await writer.ready
        await writer.close()
      },
      handleLLMError: async e => {
        await writer.ready
        console.log('handleLLMError Error: ', e)
        await writer.abort(e)
      }
    })
  })
  const lcChatMessageHistory = new ChatMessageHistory(
    mapStoredMessagesToChatMessages(messages)
  )
  const memory = new BufferMemory({
    chatHistory: lcChatMessageHistory,
    returnMessages: true,
    outputKey: 'output',
    inputKey: 'input',
    memoryKey: 'history'
  })

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate('You are a friendly assistant.'),
    new MessagesPlaceholder('history'),
    HumanMessagePromptTemplate.fromTemplate('{input}')
  ])

  const chain = new ConversationChain({
    memory: memory,
    llm: chat,
    prompt: chatPrompt
  })

  chain.call({
    input: prompt
  })

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream'
    }
  })
}
