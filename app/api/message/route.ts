//import { CallbackManager } from '@langchain/core/callbacks/base'
import { BufferMemory, ChatMessageHistory } from 'langchain/memory'
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { JsonOutputFunctionsParser } from "@langchain/core/output_parsers/openai_functions";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage
} from 'langchain/schema'
import { NextResponse } from 'next/server'
import { ConversationChain } from 'langchain/chains'
import {
  SystemMessagePromptTemplate,
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  AIMessagePromptTemplate
} from "@langchain/core/prompts";
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

function extractContentFromDictionary(dictionary: any): string[] {
  const contentArray: string[] = [];
  const messageArray = dictionary.messages.slice(-5, -1)

  for (let i = 0; i < messageArray.length; i++){
    const messages = messageArray[i].content.replace(/[{}"]/g, ' ')
    if (i % 2 == 0) {
      contentArray.push(`${messages}`)
    } else {
      contentArray.push(`${messages}`)
    } 
  }
  return contentArray;
}

export async function POST(req: Request) {
  const body = await req.json()
  const messages: Message[] = body.messages
  const bodyprompt: string = body.prompt

  
  const inputText = messages[messages.length - 1].content;
  console.log("text", inputText)
  

  const transferSchema = z.object({
    token: z.string().describe("The token symbol to be transferred"),
    amount: z.number().positive().describe("The amount to be transferred"),
    recipient: z.string().describe("The recipient's wallet id"),
  });

  const swapSchema = z.object({
    tokenIn: z.string().describe("The token symbol you want to be swapped"),
    tokenOut: z.string().describe("The token symbol you want to receive"),
    amount: z.number().positive().describe("The token amount to be swapped"),
  });

  const checkSchema  = z.object({
    token: z.string().describe("The token you want to check balance or current price")
  });
  

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  
  const chat = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125",
    streaming: true,
    //maxRetries: 1,
    temperature: 0,
    // callbackManager: CallbackManager.fromHandlers({
    //   handleLLMNewToken: async (token: string, runId, parentRunId) => {
    //     await writer.ready
    //     string += token
    //     counter++
    //     await writer.write(encoder.encode(`${token}`))
    //   },
    //   handleLLMEnd: async () => {
    //     await writer.ready
    //     await writer.close()
    //   },
    //   handleLLMError: async e => {
    //     await writer.ready
    //     console.log('handleLLMError Error: ', e)
    //     await writer.abort(e)
    //   }
    // })
  })
  const lcChatMessageHistory = new ChatMessageHistory(
    mapStoredMessagesToChatMessages(messages)
  )
  
  const array = extractContentFromDictionary(lcChatMessageHistory)
  console.log(array)
  console.log(typeof array[3])

  const functionCallingModel = chat.bind({
    functions: [
      {
        name: "transfer",
        description: "Transfer tokens or NEAR to another wallet",
        parameters: zodToJsonSchema(transferSchema),
      },
      {
        name: "swap",
        description: "Swap tokens",
        parameters: zodToJsonSchema(swapSchema),
      },
      {
        name: "check",
        description: "Check token price or balance",
        parameters: zodToJsonSchema(checkSchema),
      }
    ],
  });
  const instruction =
  `You are a crypto wallet assistant, and also an intent resolver. 
  Please analyze my intention from my current inputText, if there is a function that can fulfill my intention, invoke it.
  Here are some important examples :

  #HumanInput : I want to swap 1 ETH to NEAR 
  #AI : Call swap function

  #HumanInput : I want to transfer 10 NEAR to Allen
  #AI : Call transfer function

  #HumanInput : I want to transfer some NEAR to Allen
  #AI : Ask Human to provide the amount of NEAR

  #HumanInput : I want to transfer USDC to Allen
  #AI : Ask Human to provide the amount of USDC

  Below is history conversation. If current input text cannot call a function or only contain a token symbol or an address or amounts. 
  Please check past history to see what user wants. Please focus on what the user currently wants and do not extract data from the dictionary of successful transactions and history before this successful transactions, for example: 'tokenIn: ETH, tokenOut: USDC, amount: 1'
  And if there have other information to invoke the function. invoke it. If the parameters required to invoke the function are incomplete, ask user to provide the missing information. Please confirm that these parameters have indeed been show in the conversation. Do not make any assumptions.
  `;
  

  const Chatprompt = ChatPromptTemplate.fromMessages([
   
      SystemMessagePromptTemplate.fromTemplate(
        `${instruction}`
      ),
      HumanMessagePromptTemplate.fromTemplate(`${array[0]}`),
      AIMessagePromptTemplate.fromTemplate(`${array[1]}`),
      HumanMessagePromptTemplate.fromTemplate(`${array[2]}`),
      AIMessagePromptTemplate.fromTemplate(`${array[3]}`),
      HumanMessagePromptTemplate.fromTemplate("{inputText}"),
    ]);

  const chain = Chatprompt.pipe(functionCallingModel);
  

  const response = await chain.invoke({
    inputText: inputText,
  });
  
  
  //const output_str :string = response.content

  if (response.response_metadata.finish_reason === "stop") {
    // text output
    console.log("aaaa")
   
    const stream = new ReadableStream({
      start(controller) {
        
        let index = 0;
        const textArray = response.content.split(' ');
        const timer = setInterval(() => {
          if (index < textArray.length) {
            controller.enqueue(`${textArray[index]} `);
            index++;
          } else {
            
            clearInterval(timer);
            controller.close();
          }
        }, 100);
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked'
      }
    })
  }
  if (response.response_metadata.finish_reason === "function_call") {
    const parser = new JsonOutputFunctionsParser();
    const transferDetail = await parser.invoke(response)

    return new NextResponse(JSON.stringify(transferDetail), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
