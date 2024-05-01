import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessagePromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { JsonOutputFunctionsParser } from "@langchain/core/output_parsers/openai_functions";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config({ path: __dirname + "/.env" });

export async function analyzeTransferPrompt(inputText: string, tokens: any): Promise<string | object | undefined>  {
  const transferSchema = z.object({
    token: z.string().describe("The token symbol to be transferred"),
    amount: z.number().positive().describe("The amount to be transferred"),
    recipient: z.string().describe("The recipient's wallet id"),
  });

  const llm = new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 });

  const functionCallingModel = llm.bind({
    functions: [
      {
        name: "transfer",
        description: "Transfer tokens or NEAR to another wallet",
        parameters: zodToJsonSchema(transferSchema),
      },
    ],
  });

  const prompt = new ChatPromptTemplate({
    promptMessages: [
      SystemMessagePromptTemplate.fromTemplate(
        `You are a crypto wallet assistant, and also an intent resolver. Please analyze my intention and if there is a function that can fulfill my intention, invoke it. If the parameters required to invoke the function are incomplete, ask me to provide the missing information. Please do not make assumptions.`
      ),
      HumanMessagePromptTemplate.fromTemplate("{inputText}"),
    ],
    inputVariables: ["inputText"],
  });

  const chain = prompt.pipe(functionCallingModel);

  const response = await chain.invoke({
    inputText: inputText,
  });

  if (response.response_metadata.finish_reason === "stop") {
    return response.content;
  }

  if (response.response_metadata.finish_reason === "function_call") {
    const parser = new JsonOutputFunctionsParser();
    const transferDetail = await parser.invoke(response);

    if (!(transferDetail.token in tokens)) {
        return `You don't have ${transferDetail.token} in your wallet !`;
    } else if (transferDetail.amount > tokens[transferDetail.token]) {
        return "You don't have enough token to transfer";
    }

    return transferDetail;
}
}

// Example usage:
var tokens: any = { "NEAR": 2, "ETH": 5, "USDT": 5 };
analyzeTransferPrompt("I want to transfer 3 NEAR to alankingdom.testnet", tokens).then(result => {
  console.log(result);
});
