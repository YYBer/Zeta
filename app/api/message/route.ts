import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { JsonOutputFunctionsParser } from '@langchain/core/output_parsers/openai_functions'
import { NextResponse } from 'next/server'
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages'
import { fetchCoinData } from './price'
//import { getBalance } from './balance'
import {
  SystemMessagePromptTemplate,
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  AIMessagePromptTemplate
} from '@langchain/core/prompts'
import { Message } from '@/types/chat'

export const runtime = 'edge'

function extractMessagesFromChatHistory(messages: Message[]): any[] {
  return messages.map(message => {
    switch (message.role) {
      case 'user':
        return new HumanMessage(message.content.replace(/[{}"]/g, ' '))
      case 'assistant':
        return new AIMessage(message.content.replace(/[{}"]/g, ' '))
      default:
        throw new Error('Role must be defined for generic messages')
    }
  })
}

function createStreamFromText(input: string): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      let index = 0
      const textArray = input.split(' ')
      const timer = setInterval(() => {
        if (index < textArray.length) {
          controller.enqueue(`${textArray[index]} `)
          index++
        } else {
          clearInterval(timer)
          controller.close()
        }
      }, 100)
    }
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const messages: Message[] = body.messages
  const address: string = body.address

  const inputText = messages[messages.length - 1].content
  console.log('text', inputText)
  console.log('address', address)
  //const checkBalance = getBalance(address, 'USDC')
  //console.log('getBalance', checkBalance)
  const tokenDictionary: { [key: string]: string } = {
    ETH: 'Ethereum',
    Ethereum: 'Ethereum',
    NEAR: 'NEAR',
    near: 'NEAR',
    eth: 'Ethereum',
    bitcoin: 'Bitcoin',
    Bitcoin: 'Bitcoin'
  }

  const fetchData = async () => {
    try {
      const response = await fetch('https://validators.narwallets.com/metrics')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      // console.log('response', response)
      // const jsonData = await response.json();
      // setData(jsonData);
      const reader = response?.body?.getReader()
      const stream = new ReadableStream({
        start(controller) {
          const process = async () => {
            try {
              const result = (await reader?.read()) ?? { done: true } // Provide a default value
              const { done, value } = result
              if (done) {
                controller.close()
                return
              }
              controller.enqueue(value)
              await process()
            } catch (error) {
              controller.error(error)
            }
          }
          process()
        }
      })
      // console.log('stream', stream)

      const text = await new Response(stream).text()
      // console.log('text', text)

      const parseData = (text: string) => {
        const pattern =
          /metapool_(st_near_price|near_usd_price|st_near_30_day_apy|st_aur_30_day_apy|st_aur_price|eth_usd_price)\s([0-9.]+)/g
        const matches = Array.from(text.matchAll(pattern))
        const parsedData: { [key: string]: string } = {} // Define type explicitly

        for (const match of matches) {
          const key = match[1]
          const value = parseFloat(match[2]).toFixed(2)
          parsedData[key] = value
        }

        console.log('parsedData', parsedData)

        return parsedData
      }

      parseData(text)
      // const jsonData = JSON.parse(text)
      // console.log('jsonData', jsonData)
    } catch (error) {
      console.log(error)
    }
  }

  const parsedData = fetchData()

  const transferSchema = z.object({
    functionType: z
      .string()
      .describe("The function type : transfer, can only be 'transfer'"),
    token: z.string().describe('The token symbol to be transferred'),
    amount: z
      .number()
      .positive()
      .nullable()
      .describe('The amount to be transferred'),
    recipient: z.string().describe('The receiver')
  })

  const swapSchema = z.object({
    functionType: z
      .string()
      .describe("The function type : swap, can only be 'swap'"),
    tokenIn: z
      .string()
      .describe(
        'The token symbol you want to swap, or use to sell for another token'
      ),
    tokenOut: z
      .string()
      .describe('The token symbol you want to receive or you want to buy'),
    amountIn: z
      .number()
      .positive()
      .describe(
        'The amount of tokens you want to use to swap for token you want'
      ),
    //amountOut: z.number().positive().nullable().describe("The amount of tokens you want to receive after the swap"),
    slippageTolerance: z
      .number()
      .nullable()
      .describe(
        'The acceptable slippage tolerance for the swap, should be between 0.0001 and 0.01'
      ),
    fee: z
      .number()
      .nullable()
      .describe('The fee amount for the swap, fixed at 100')
  })
  const stakeSchema = z.object({
    functionType: z
      .string()
      .describe("The function type : stake, can only be 'stake'"),
    token: z.string().describe('The token symbol to be staked'),
    amount: z
      .number()
      .positive()
      .nullable()
      .describe('The amount you want to stake')
  })
  const unStakeSchema = z.object({
    functionType: z
      .string()
      .describe("The function type : unstake, can only be 'unstake'"),
    token: z.string().describe('The token symbol to unstake'),
    amount: z
      .number()
      .positive()
      .nullable()
      .describe('The amount you want to unstake')
  })

  const checkSchema = z.object({
    token: z
      .string()
      .describe('The token you want to check balance or current price')
  })

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const chat = new ChatOpenAI({
    model: 'gpt-3.5-turbo-0125',
    streaming: true,
    //maxRetries: 1,
    temperature: 0
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

  const MessageHistory = extractMessagesFromChatHistory(messages.slice(-5, -1))

  const functionCallingModel = chat.bind({
    functions: [
      {
        name: 'transfer',
        description: 'Transfer tokens or NEAR to another wallet',
        parameters: zodToJsonSchema(transferSchema)
      },
      {
        name: 'swap',
        description: 'Swap one token to another token',
        parameters: zodToJsonSchema(swapSchema)
      },
      {
        name: 'check',
        description: 'Check token price or balance',
        parameters: zodToJsonSchema(checkSchema)
      },
      {
        name: 'stake',
        description: 'stake the token and the amounts',
        parameters: zodToJsonSchema(stakeSchema)
      },
      {
        name: 'unstake',
        description: 'unstake the token and the amounts',
        parameters: zodToJsonSchema(unStakeSchema)
      }
    ]
  })
  const instruction = `You are a crypto wallet assistant, and also an intent resolver. 
  Please analyze my intention from my current inputText, if there is a function that can fulfill my intention, invoke it.
  Here are some important examples :

  #Human : I want to swap 1 ETH to NEAR 
  #AI : Call swap function

  #Human : I want to transfer 0.01 USDC to Allen
  #AI : Call transfer function

  #Human : I want to transfer some NEAR to Allen
  #AI : Please provide the amount of NEAR you want to swap.

  #Human : I want to transfer USDC to Allen
  #AI : Ask Human to provide the amount of USDC

  Below is history conversation. 
  If current input text cannot call a function or only contain a token symbol or an address or amounts. Please check past history to see what user wants. 
  Please focus on what the user currently wants and do not extract data from the dictionary of successful transactions and history before this successful transactions. Just don't extract any information from json format data.
  And if there have other information to invoke the function. invoke it. If the parameters required to invoke the function are incomplete, ask user to provide the missing information. Please confirm that these parameters have indeed been show in the conversation. Do not make any assumptions.
  `

  const chatpromptContents = []

  chatpromptContents.push(
    SystemMessagePromptTemplate.fromTemplate(`${instruction}`)
  )

  for (let i = 0; i < Math.min(MessageHistory.length, 4); i++) {
    chatpromptContents.push(MessageHistory[i].content)
  }
  chatpromptContents.push(
    HumanMessagePromptTemplate.fromTemplate('{inputText}')
  )

  const Chatprompt = ChatPromptTemplate.fromMessages(chatpromptContents)

  const chain = Chatprompt.pipe(functionCallingModel)

  const response = await chain.invoke({
    inputText: inputText
  })

  console.log('output', response.content)

  if (response.response_metadata.finish_reason === 'stop') {
    // text output
    const stream = createStreamFromText(String(response.content))

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked'
      }
    })
  }
  if (response.response_metadata.finish_reason === 'function_call') {
    const parser = new JsonOutputFunctionsParser()
    const transferDetail = await parser.invoke(response)

    if (Object.keys(transferDetail).length === 1) {
      // for check function
      const ticker: string = transferDetail.token
      try {
        const data = await fetchCoinData(tokenDictionary[ticker])
        const tokenName = Object.keys(data)[0]
        const tokenPrice = data[tokenName].usd
        const replyMessage: string = `The current price of ${tokenName} is ${tokenPrice} USD.`
        const stream = createStreamFromText(replyMessage)

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Transfer-Encoding': 'chunked'
          }
        })
      } catch (error) {
        console.error(error)
      }
    }

    if (transferDetail['functionType'] === 'swap') {
      // for check function
      const tokenIn: string = transferDetail.tokenIn
      const tokenOut: string = transferDetail.tokenOut
      let tokenName, tokenPrice

      try {
        if (tokenIn === 'USDC' || tokenIn === 'USDT') {
          transferDetail.tokenInPrice = 1
        } else {
          const inData = await fetchCoinData(tokenDictionary[tokenIn])
          tokenName = Object.keys(inData)[0]
          const tokenInPrice = inData[tokenName].usd
          transferDetail.tokenInPrice = tokenInPrice
        }

        if (tokenOut === 'USDC' || tokenOut === 'USDT') {
          transferDetail.tokenOutPrice = 1
        } else {
          const OutData = await fetchCoinData(tokenDictionary[tokenOut])
          tokenName = Object.keys(OutData)[0]
          const tokenOutPrice = OutData[tokenName].usd
          transferDetail.tokenOutPrice = tokenOutPrice
        }

        const replyMessage: string = `The current price of ${tokenName} is ${tokenPrice} USD.`
        const stream = createStreamFromText(replyMessage)
      } catch (error) {
        console.error(error)
      }
    }

    if (transferDetail['functionType'] === 'stake') {
      // for check function
      const token: string = transferDetail.token

      try {
        if (token === 'USDC' || token === 'USDT') {
          transferDetail.tokenPrice = 1
        } else {
          const inData = await fetchCoinData(tokenDictionary[token])
          const tokenName = Object.keys(inData)[0]
          const tokenInPrice = inData[tokenName].usd
          transferDetail.tokenPrice = tokenInPrice
          transferDetail.tokenAPY = '8.92'
        }
      } catch (error) {
        console.error(error)
      }
    }

    // if (transferDetail.amountIn === null && transferDetail.amountOut === null) {
    //   const replyMessage: string = `Could you please specify the amounts you'd like to swap from ${transferDetail.tokenIn} to ${transferDetail.tokenOut}?`;
    //   const stream = createStreamFromText(replyMessage);

    //     return new NextResponse(stream, {
    //       headers: {
    //         'Content-Type': 'text/event-stream',
    //         'Transfer-Encoding': 'chunked'
    //       }
    //     })
    //   }

    return new NextResponse(JSON.stringify(transferDetail), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
