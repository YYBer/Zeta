import fetch from 'node-fetch';

export async function fetchCoinData(ticker: string): Promise<any> {
    const currency: string = "usd";
    const url: string = `https://api.coingecko.com/api/v3/simple/price?ids=${ticker}&vs_currencies=${currency}`;
    const apiKey: string | undefined = process.env.COINGEKO_API;

    if (!apiKey) {
        throw new Error('COINGEKO_API environment variable not found.');
    }

    const headers: HeadersInit = {
        'accept': 'application/json',
        'x-cg-demo-api-key': apiKey
    };

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Error fetching coin data: ${error}`);
    }
}
