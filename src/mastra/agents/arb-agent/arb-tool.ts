import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Types for orderbook data
interface OrderbookEntry {
  price: number;
  size: number;
}

interface Orderbook {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
}

interface ArbitrageOpportunity {
  platform1: string;
  platform2: string;
  market: string;
  buyPrice: number;
  buyPriceINR?: number;
  sellPrice: number;
  sellPriceINR?: number;
  profit: number;
  profitPercentage: number;
  buySize: number;
  sellSize: number;
  isProfitable: boolean;
}

// Mock data for demonstration - in real implementation, these would be API calls
const mockProboOrderbook: Orderbook = {
  bids: [
    { price: 38.0, size: 100 }, // INR
    { price: 37.5, size: 200 },
    { price: 37.0, size: 150 },
  ],
  asks: [
    { price: 38.5, size: 100 },
    { price: 39.0, size: 200 },
    { price: 39.5, size: 150 },
  ],
};

const mockPolymarketOrderbook: Orderbook = {
  bids: [
    { price: 0.48, size: 100 }, // USD
    { price: 0.47, size: 200 },
    { price: 0.46, size: 150 },
  ],
  asks: [
    { price: 0.49, size: 100 },
    { price: 0.50, size: 200 },
    { price: 0.51, size: 150 },
  ],
};

// Fetch INR to USD exchange rate
const getINRtoUSD = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=INR&symbols=USD');
    const data = await response.json();
    return data.rates.USD;
  } catch (error) {
    console.error('Error fetching INR to USD rate:', error);
    // Fallback to a default rate if API fails
    return 0.012;
  }
};

// Function to fetch orderbook from Probo (mock implementation)
const fetchProboOrderbook = async (marketId: string): Promise<Orderbook> => {
  // In real implementation, this would make an API call to Probo
  // Example API call:
  // const response = await fetch(`https://api.probo.com/v1/markets/${marketId}/orderbook`);
  // const data = await response.json();
  // return data.orderbook;
  
  console.log(`Fetching Probo orderbook for market: ${marketId}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockProboOrderbook;
};

// Function to fetch orderbook from Polymarket (mock implementation)
const fetchPolymarketOrderbook = async (marketId: string): Promise<Orderbook> => {
  // In real implementation, this would make an API call to Polymarket
  // Example API call:
  // const response = await fetch(`https://api.polymarket.com/v1/markets/${marketId}/orderbook`);
  // const data = await response.json();
  // return data.orderbook;
  
  console.log(`Fetching Polymarket orderbook for market: ${marketId}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPolymarketOrderbook;
};

// Function to calculate arbitrage opportunities
const calculateArbitrage = (
  proboOrderbookUSD: Orderbook,
  proboOrderbookINR: Orderbook,
  polymarketOrderbook: Orderbook,
  marketId: string,
  inrToUsd: number
): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = [];

  // Check if we can buy on Probo (INR->USD) and sell on Polymarket (USD)
  const proboBestAskUSD = proboOrderbookUSD.asks[0]; // Best ask (lowest sell price, USD)
  const proboBestAskINR = proboOrderbookINR.asks[0]; // INR
  const polymarketBestBid = polymarketOrderbook.bids[0]; // Best bid (highest buy price, USD)

  if (proboBestAskUSD && proboBestAskINR && polymarketBestBid) {
    const buyPrice = proboBestAskUSD.price; // USD
    const buyPriceINR = proboBestAskINR.price; // INR
    const sellPrice = polymarketBestBid.price; // USD
    const profit = sellPrice - buyPrice;
    const profitPercentage = (profit / buyPrice) * 100;
    const isProfitable = profit > 0;

    opportunities.push({
      platform1: "Probo (converted to USD)",
      platform2: "Polymarket (USD)",
      market: marketId,
      buyPrice,
      buyPriceINR,
      sellPrice,
      profit,
      profitPercentage,
      buySize: Math.min(proboBestAskUSD.size, polymarketBestBid.size),
      sellSize: Math.min(proboBestAskUSD.size, polymarketBestBid.size),
      isProfitable,
    });
  }

  // Check if we can buy on Polymarket (USD) and sell on Probo (USD, converted from INR)
  const polymarketBestAsk = polymarketOrderbook.asks[0]; // USD
  const proboBestBidUSD = proboOrderbookUSD.bids[0]; // USD
  const proboBestBidINR = proboOrderbookINR.bids[0]; // INR

  if (polymarketBestAsk && proboBestBidUSD && proboBestBidINR) {
    const buyPrice = polymarketBestAsk.price; // USD
    const sellPrice = proboBestBidUSD.price; // USD
    const sellPriceINR = proboBestBidINR.price; // INR
    const profit = sellPrice - buyPrice;
    const profitPercentage = (profit / buyPrice) * 100;
    const isProfitable = profit > 0;

    opportunities.push({
      platform1: "Polymarket (USD)",
      platform2: "Probo (converted to USD)",
      market: marketId,
      buyPrice,
      sellPrice,
      sellPriceINR,
      profit,
      profitPercentage,
      buySize: Math.min(polymarketBestAsk.size, proboBestBidUSD.size),
      sellSize: Math.min(polymarketBestAsk.size, proboBestBidUSD.size),
      isProfitable,
    });
  }

  return opportunities;
};

export const arbitrageTool = createTool({
  id: "check-arbitrage",
  description: "Check for arbitrage opportunities between Probo (INR) and Polymarket (USD) for a specific market. Probo prices are converted to USD using the latest exchange rate.",
  inputSchema: z.object({
    marketId: z.string().describe("Market ID to check for arbitrage opportunities"),
  }),
  outputSchema: z.object({
    opportunities: z.array(z.object({
      platform1: z.string(),
      platform2: z.string(),
      market: z.string(),
      buyPrice: z.number(),
      buyPriceINR: z.number().optional(),
      sellPrice: z.number(),
      sellPriceINR: z.number().optional(),
      profit: z.number(),
      profitPercentage: z.number(),
      buySize: z.number(),
      sellSize: z.number(),
      isProfitable: z.boolean(),
    })),
    summary: z.string(),
    inrToUsd: z.number(),
    timestamp: z.string(),
  }),
  execute: async ({ context }) => {
    const { marketId } = context;

    try {
      // Fetch exchange rate
      const inrToUsd = await getINRtoUSD();

      // Fetch orderbooks from both platforms
      const [proboOrderbookINR, polymarketOrderbook] = await Promise.all([
        fetchProboOrderbook(marketId),
        fetchPolymarketOrderbook(marketId),
      ]);

      // Convert Probo orderbook prices to USD
      const proboOrderbookUSD: Orderbook = {
        bids: proboOrderbookINR.bids.map(bid => ({ ...bid, price: parseFloat((bid.price * inrToUsd).toFixed(4)) })),
        asks: proboOrderbookINR.asks.map(ask => ({ ...ask, price: parseFloat((ask.price * inrToUsd).toFixed(4)) })),
      };

      // Calculate arbitrage opportunities
      const opportunities = calculateArbitrage(proboOrderbookUSD, proboOrderbookINR, polymarketOrderbook, marketId, inrToUsd);

      // Filter profitable opportunities
      const profitableOpportunities = opportunities.filter(opp => opp.isProfitable);

      // Create summary
      let summary = `INR→USD rate: ${inrToUsd}\nFound ${opportunities.length} arbitrage opportunities for market ${marketId}. `;
      if (profitableOpportunities.length > 0) {
        const bestOpportunity = profitableOpportunities.reduce((best, current) => 
          current.profitPercentage > best.profitPercentage ? current : best
        );
        summary += `Best opportunity: Buy on ${bestOpportunity.platform1} at `;
        if (bestOpportunity.buyPriceINR !== undefined) {
          summary += `₹${bestOpportunity.buyPriceINR} (≈$${bestOpportunity.buyPrice})`;
        } else {
          summary += `$${bestOpportunity.buyPrice}`;
        }
        summary += ` and sell on ${bestOpportunity.platform2} at `;
        if (bestOpportunity.sellPriceINR !== undefined) {
          summary += `₹${bestOpportunity.sellPriceINR} (≈$${bestOpportunity.sellPrice})`;
        } else {
          summary += `$${bestOpportunity.sellPrice}`;
        }
        summary += ` for ${bestOpportunity.profitPercentage.toFixed(2)}% profit.`;
      } else {
        summary += "No profitable arbitrage opportunities found.";
      }

      return {
        opportunities,
        summary,
        inrToUsd,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error checking arbitrage:", error);
      return {
        opportunities: [],
        summary: `Error checking arbitrage for market ${marketId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        inrToUsd: 0,
        timestamp: new Date().toISOString(),
      };
    }
  },
});

// Tool to list Probo markets
export const listProboMarketsTool = createTool({
  id: "list-probo-markets",
  description: "List available Probo markets (mocked)",
  inputSchema: z.object({}),
  outputSchema: z.object({
    markets: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })),
  }),
  execute: async () => {
    // Example API call:
    // const response = await fetch('https://api.probo.com/v1/markets');
    // const data = await response.json();
    // return { markets: data.markets.map((m: any) => ({ id: m.id, name: m.name })) };
    // For now, return mock data:
    return {
      markets: [
        { id: "12345", name: "Will India win the next cricket match?" },
        { id: "67890", name: "Will BTC close above $60k this week?" },
      ],
    };
  },
});

// Tool to list Polymarket markets
export const listPolymarketMarketsTool = createTool({
  id: "list-polymarket-markets",
  description: "List available Polymarket markets (mocked)",
  inputSchema: z.object({}),
  outputSchema: z.object({
    markets: z.array(z.object({
      id: z.string(),
      question: z.string(),
    })),
  }),
  execute: async () => {
    // Example API call:
    // const response = await fetch('https://api.polymarket.com/v1/markets');
    // const data = await response.json();
    // return { markets: data.markets.map((m: any) => ({ id: m.id, question: m.question })) };
    // For now, return mock data:
    return {
      markets: [
        { id: "0xabc123", question: "Will ETH be above $3,000 on July 31?" },
        { id: "0xdef456", question: "Will it rain in London tomorrow?" },
      ],
    };
  },
});
