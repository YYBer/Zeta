<div align="center">
  <a href="https://github.com/Phala-Network/ai-agent-template-redpill">
    <h1>AI Agent Contract Template with RedPill</h1>
    <img height="320" src="./public/AI-Agent-Contract.jpg" />
    <br />
  </a>
  <a href="https://platform.openai.com/docs/api-reference">
    <img height="32" src="public/powered-by-openai-badge-filled-on-light.svg" />
    <br />
  </a>
  <p align="center">
    Host your AI Agent Contract on Phala's decentralized serverless cloud.
    <br />
    <a href="https://github.com/Phala-Network/ai-agent-template-redpill"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="QmQu9AmBL13tyGpxgg5ASt96WQ669p63rnJRWiAo9st8ns/0?key=c0c0105ba56276cd&chatQuery=When%20did%20humans%20land%20on%20the%20moon">View Demo</a>
    ·
    <a href="https://github.com/Phala-Network/ai-agent-template-redpill/issues">Report Bug</a>
    ·
    <a href="https://discord.gg/DXGGJajW">Discord</a>
  </p>

  <h3>Architecure Overview</h3>
  <img height="320" src="./public/ai-agent-architecture.jpg" />
</div>

## 🤖 What Is This?!

<div align="center">
  <img height="240" src="https://www.jlwranglerforums.com/forum/attachments/zoolander-gif.325299/">
</div>

The RedPill AI Agent template is a **MINIMAL** template to build an AI Agent that can be hosted on Phala Network's decentralized hosting protocol. Unlike Vercel or other FaaS, it allows you to publish your AI Agent compiled code to IPFS and hosts it on a fully decentralized FaaS cloud with the following benefits:

- 💨 Ship Fast: Build and ship with familiar toolchain in minutes
- ⛑️ Secure: Execution guarded by rock solid TEE / Intel SGX
- 🔒 Private: Host API keys and user privacy at ease
- 💎 Unstoppable: Powered by IPFS and Phala's 35k+ decentralized TEE workers

[//]: # (<img width="320" src="https://media1.tenor.com/m/NBtFH5F9QTgAAAAd/what-is-my-purpose-butter.gif" />)

## Getting Started
### Prepare
Install dependencies
```shell
npm install
```

### Testing Locally
Create `.env` file and add your RedPill API Key
```shell
cp .env.local .env
```
Get an OpenAI API Key from Redpill
> Go to https://red-pill.ai/dashboard and claim your OpenAI API Key by swapping some ETH for wGPT at https://app.uniswap.org/explore/tokens/base/0x74F62Bc1961028C22b8080961c6534f4eDD49D6C
>
> Video: https://youtu.be/ZoJwbLNhbWE

In `.env` file replace `YOUR_OPENAI_KEY` with your API Key
```text
OPENAI_API_KEY="YOUR_OPENAI_KEY"
```

Build your Agent
```shell
npm run build
```

Test your Agent locally
```shell
npm run test
```

Expected Test Results
```shell
INPUT: {"method":"GET","path":"/ipfs/QmVHbLYhhYA5z6yKpQr4JWr3D54EhbSsh7e7BFAAyrkkMf","queries":{"chatQuery":["Who are you?"]},"secret":{"openaiApiKey":"YOUR_OPENAI_KEY"},"headers":{}}
GET RESULT: {
  status: 200,
  body: '\n' +
    '    <!DOCTYPE html>\n' +
    '    <html lang="en">\n' +
    '        <head>\n' +
    '            <meta charset="utf-8" />\n' +
    '            <title>TestUI</title>\n' +
    '        </head>\n' +
    '        <body>\n' +
    '            <div align="center">\n' +
    '                <p>I am an AI-powered digital assistant here to help answer your questions and assist you with various tasks. How can I assist you today?</p>\n' +
    '            </div>\n' +
    '        </body>\n' +
    '    </html>',
  headers: {
    'Content-Type': 'text/html; charset=UTF-8',
    'Access-Control-Allow-Origin': '*'
  }
}


INPUT: {"method":"POST","path":"/ipfs/QmVHbLYhhYA5z6yKpQr4JWr3D54EhbSsh7e7BFAAyrkkMf","queries":{"chatQuery":["When did humans land on the moon?"]},"secret":{"openaiApiKey":"YOUR_OPENAI_KEY"},"headers":{},"body":"{\"untrustedData\":{\"fid\":2,\"url\":\"https://fcpolls.com/polls/1\",\"messageHash\":\"0xd2b1ddc6c88e865a33cb1a565e0058d757042974\",\"timestamp\":1706243218,\"network\":1,\"buttonIndex\":2,\"castId\":{\"fid\":226,\"hash\":\"0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9\"}},\"trustedData\":{\"messageBytes\":\"d2b1ddc6c88e865a33cb1a565e0058d757042974...\"}}"}
POST RESULT: {
  status: 200,
  body: 'Not Implemented',
  headers: {
    'Content-Type': 'text/html; charset=UTF-8',
    'Access-Control-Allow-Origin': '*'
  }
}

To test in the SideVM playground go to https://phat.phala.network/contracts/view/0xf0a398600f02ea9b47a86c59aed61387e450e2a99cb8b921cd1d46f734e45409

Connect you polkadot.js account and select 'run_js' with the parameters:
- engine: SidevmQuickJSWithPolyfill
- js_code: Source code text of dist/index.ts
- args: {"method":"GET","path":"/ipfs/QmVHbLYhhYA5z6yKpQr4JWr3D54EhbSsh7e7BFAAyrkkMf","queries":{"chatQuery":["Who are you?"],"openAiModel":["gpt-4o"]},"secret":{"openaiApiKey":"OPENAI_API_KEY"},"headers":{}}
Watch video here for to see the visual steps of testing in Sidevm playground: https://www.youtube.com/watch?v=fNqNeLfFFME

Make sure to replace queries and secret with your values compatible with your AI Agent Contract.
```

### Publish Your AI Agent

Upload your compiled AI Agent code to IPFS.
```shell
npm run publish-agent
```

Upon a successful upload, the command should show the URL to access your AI Agent.
```shell
✓ Compiled successfully.
  1.91 KB  dist/index.js
Running command: npx thirdweb upload dist/index.js
This may require you to log into thirdweb and will take some time to publish to IPFS...

    $$\     $$\       $$\                 $$\                         $$\       
    $$ |    $$ |      \__|                $$ |                        $$ |      
  $$$$$$\   $$$$$$$\  $$\  $$$$$$\   $$$$$$$ |$$\  $$\  $$\  $$$$$$\  $$$$$$$\  
  \_$$  _|  $$  __$$\ $$ |$$  __$$\ $$  __$$ |$$ | $$ | $$ |$$  __$$\ $$  __$$\ 
    $$ |    $$ |  $$ |$$ |$$ |  \__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
    $$ |$$\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
    \$$$$  |$$ |  $$ |$$ |$$ |      \$$$$$$$ |\$$$$$\$$$$  |\$$$$$$$\ $$$$$$$  |
     \____/ \__|  \__|\__|\__|       \_______| \_____\____/  \_______|\_______/ 

 💎 thirdweb v0.14.12 💎

- Uploading file to IPFS. This may take a while depending on file sizes.

✔ Successfully uploaded file to IPFS.
✔ Files stored at the following IPFS URI: ipfs://QmcpWsiZq8RP7C823HdXT9EAhg9XUtuZ7FA6a1mHkNbRVQ
✔ Open this link to view your upload: https://bafybeigxe4cxpg2nz4ueoiu6edkyttvj3gjkvoht4szl7kktjxftkzcxj4.ipfs.cf-ipfs.com/

AI Agent Contract deployed at: https://agents.phala.network/ipfs/QmcpWsiZq8RP7C823HdXT9EAhg9XUtuZ7FA6a1mHkNbRVQ

Make sure to add your secrets to ensure your AI-Agent works properly. Use syntax:


curl https://agents.phala.network/vaults -H 'Content-Type: application/json' -d '{"cid": "QmcpWsiZq8RP7C823HdXT9EAhg9XUtuZ7FA6a1mHkNbRVQ", "data": {"openaiApiKey": "OPENAI_API_KEY"}}'
```

<details>
<summary>New to thirdweb?</summary>
We use <a href="https://thirdweb.com/dashboard/infrastructure/storage">thirdweb Storage</a> to host IPFS contents. If you are new to thirdweb, the command will guide you to create your account or login to your existing account from the browser. (You may need to forward port 8976 if you are accessing a remote console via SSH.)
</details>

<details>
<summary>Did thirdweb fail to publish?</summary>
If thirdweb takes too long to install or fails to publish, use the following command:

```shell
curl -F file=@./dist/index.js https://agents.phala.network/ipfs 
```
</details>

### Access the Published AI Agent

Once published, your AI Agent is available at the URL: `https://agents.phala.network/ipfs/<your-cid>`. You can get it from the "Publish to IPFS" step.

You can test it with `curl`.

```bash
curl https://agents.phala.network/ipfs/<your-cid>
```

### Add Secrets

By default, all the compiled JS code is visible for anyone to view if they look at IPFS CID. This makes private info like API keys, signer keys, etc. vulnerable to be stolen. To protect devs from leaking keys, we have added a field called `secret` in the `Request` object. It allows you to store secrets in a vault for your AI Agent to access.

<details>
<summary><b>How to Add Secrets</b></summary>

The steps to add a `secret` is simple. We will add the [OpenAI](https://platform.openai.com/docs/quickstart?context=node) API Key in this example by creating a secret JSON object with the `openaiApiKey`:

```json
{"openaiApiKey": "<OPENAI_API_KEY>"}
```

Then in your frame code, you will be able to access the secret key via `req.secret` object:

```js
async function GET(req: Request): Promise<Response> {
    const apiKey = req.secret?.openaiApiKey
}
```

> **Note**: Before continuing, make sure to publish your compiled AI Agent JS code, so you can add secrets to the CID.

**Open terminal**
Use `curl` to `POST` your secrets to `https://agents.phala.network/vaults`. Replace `IPFS_CID` with the CID to the compile JS code in IPFS, and replace `<OPENAI_API_KEY>` with your OpenAI API key. Note that you can name the secret field name something other than `openaiApiKey`, but you will need to access the key in your `index.ts` file with the syntax `req.secret?.<your-secret-field-name> as string`

The command will look like this:
```shell
curl https://agents.phala.network/vaults -H 'Content-Type: application/json' -d '{"cid": "IPFS_CID", "data": {"openaiApiKey": "<OPENAI_API_KEY>"}}'
# Output:
# {"token":"e85ae53d2ba4ca8d","key":"e781ef31210e0362","succeed":true}
```

The API returns a `token` and a `key`. The `key` is the id of your secret. It can be used to specify which secret you are going to pass to your frame. The `token` can be used by the developer to access the raw secret. You should never leak the `token`.

To verify the secret, run the following command where `key` and `token` are replaced with the values from adding your `secret` to the vault.
```shell
curl https://agents.phala.network/vaults/<key>/<token>
```

Expected output:
```shell
{"data":{"openaiApiKey":"<OPENAI_API_KEY>"},"succeed":true}
```

If you are using secrets, make sure that your URL is set in the following syntax where `cid` is the IPFS CID of your compiled JS file and `key` is the `key` from adding secrets to your vault.
```text
https://agents.phala.network/ipfs/<cid>?key=<key>
```

Example:
https://agents.phala.network/ipfs/Qma2WjqWqW8wYG2tEQ9YFUgyVrMDA9VzvkkdeFny7Smn3R/0?key=686df81d326fa5f2&chatQuery=When%20did%20humans%20land%20on%20the%20moon

</details>

### Access Queries
To help create custom logic, we have an array variable named `queries` that can be accessed in the `Request` class. To access the `queries` array variable `chatQuery` value at index `0`, the syntax will look as follows:
```typescript
const query = req.queries.chatQuery[0] as string;
```
The example at https://agents.phala.network/ipfs/Qma2WjqWqW8wYG2tEQ9YFUgyVrMDA9VzvkkdeFny7Smn3R/0?key=686df81d326fa5f2&chatQuery=When%20did%20humans%20land%20on%20the%20moon will have a value of `When did humans land on the moon`. `queries` can have any field name, so `chatQuery` is just an example of a field name and not a mandatory name, but remember to update your `index.ts` file logic to use your expected field name.


## FAQ

<details>
<summary><b>What packages can I use in the AI Agent server?</b></summary>
<ul>
  <li>Most of the npm packages are supported: viem, onchainkit, ….</li>
  <li>Some packages with some advanced features are not supported:</li>
  <ul>
    <li>Large code size. Compiled bundle should be less than 500kb.</li>
    <li>Large memory usage, like image generation</li>
    <li>Web Assembly</li>
    <li>Browser only features: local storage, service workers, etc</li>
  </ul>
</ul>
</details>

<details>
<summary><b>What’s the spec of the Javascript runtime?</b></summary>
<ul>
  <li>The code runs inside a tailored <a href="https://bellard.org/quickjs/">QuickJS engine</a></li>
  <li>Available features: ES2023, async, fetch, setTimeout, setInterval, bigint</li>
  <li>Resource limits</li>
  <ul>
    <li>Max execution time ~30s</li>
    <li>Max memory usage: 16 mb</li>
    <li>Max code size: 500 kb</li>
    <li>Limited CPU burst: CPU time between async calls is limited. e.g. Too complex for-loop may hit the burst limit.</li>
  </ul>
</ul>
</details>

<details>
<summary><b>Why is the serverless platform secure?</b></summary>
<ul>
  <li>Your AI Agent code on is fully secure, private, and permissionless. Nobody can manipulate your program, steal any data from it, or censor it.</li>
  <li>Security: The code is executed in the decentralized TEE network running on Phala Network. It runs code inside a secure blackbox (called enclave) created by the CPU. It generates cryptographic proofs verifiable on Phala blockchain. It proves that the hosted code is exactly the one you deployed.</li>
  <li>Privacy: You can safely put secrets like API keys or user privacy on Phala Network. The code runs inside TEE hardware blackboxs. The memory of the program is fully encrypted by the TEE. It blocks any unauthorized access to your data.</li>
  <li>Learn more at <a href="https://phala.network">Phala Network Homepage</a></li>
</details>

<details>
<summary><b>What's TEE / Intel SGX?</b></summary>
<ul>
  <li><a href="https://collective.flashbots.net/t/tee-sgx-wiki/2019">TEE/SGX wiki</a></li>
  <li><a href="https://collective.flashbots.net/t/debunking-tee-fud-a-brief-defense-of-the-use-of-tees-in-crypto/2931">Debunking TEE FUD: A Brief Defense of The Use of TEEs in Crypto</a></li>
</details>
