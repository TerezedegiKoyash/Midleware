import ccxt from 'ccxt';

export default async function handler(req, res) {
  const {
    query: { pair },
  } = req;

  if (!pair || typeof pair !== 'string' || !pair.includes('_')) {
    return res.status(400).send('Invalid pair format. Use SYMBOL_BASE format, e.g., BTC_USDT');
  }

  const [symbol, base] = pair.toUpperCase().split('_');
  const market = `${symbol}/${base}`;

  const exchanges = [
    new ccxt.binance(),
    new ccxt.kucoin(),
    new ccxt.okx(),
    new ccxt.bybit()
  ];

  const promises = exchanges.map(async (exchange) => {
    try {
      const ticker = await exchange.fetchTicker(market);
      return ticker.last;
    } catch (err) {
      return null;
    }
  });

  try {
    const results = await Promise.all(promises);
    const price = results.find(p => p !== null);

    if (price) {
      return res.status(200).send(String(price));
    } else {
      return res.status(500).send('Price not available on any exchange');
    }
  } catch (error) {
    console.error(`[FATAL] ${market}:`, error.message);
    return res.status(500).send('Internal error');
  }
}
