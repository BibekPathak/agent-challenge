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
  sellPrice: number;
  profit: number;
  profitPercentage: number;
  buySize: number;
  sellSize: number;
  isProfitable: boolean;
}

// Mock data for demonstration - in real implementation, these would be API calls
const mockProboOrderbook: Orderbook = {
  bids: [
    { price: 0.45, size: 100 },
    { price: 0.44, size: 200 },
    { price: 0.43, size: 150 },
  ],
  asks: [
    { price: 0.46, size: 100 },
    { price: 0.47, size: 200 },
    { price: 0.48, size: 150 },
  ],
};

const mockPolymarketOrderbook: Orderbook = {
  bids: [
    { price: 0.48, size: 100 },
    { price: 0.47, size: 200 },
    { price: 0.46, size: 150 },
  ],
  asks: [
    { price: 0.49, size: 100 },
    { price: 0.50, size: 200 },
    { price: 0.51, size: 150 },
  ],
};

// Function to fetch orderbook from Probo (mock implementation)
const fetchProboOrderbook = async (marketId: string): Promise<Orderbook> => {
  // In real implementation, this would make an API call to Probo
  // Example API call:
  // const response = await fetch(`https://api.probo.com/v1/markets/${marketId}/orderbook`);
  // const data = await response.json();
  // return data.orderbook;
  
  console.log(`Fetching Probo orderbook for market: ${marketId}`);
  
  // Simulate API delay
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
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockPolymarketOrderbook;
};

// Function to calculate arbitrage opportunities
const calculateArbitrage = (
  proboOrderbook: Orderbook,
  polymarketOrderbook: Orderbook,
  marketId: string
): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = [];

  // Check if we can buy on Probo and sell on Polymarket
  const proboBestAsk = proboOrderbook.asks[0]; // Best ask (lowest sell price)
  const polymarketBestBid = polymarketOrderbook.bids[0]; // Best bid (highest buy price)

  if (proboBestAsk && polymarketBestBid) {
    const buyPrice = proboBestAsk.price;
    const sellPrice = polymarketBestBid.price;
    const profit = sellPrice - buyPrice;
    const profitPercentage = (profit / buyPrice) * 100;
    const isProfitable = profit > 0;

    opportunities.push({
      platform1: "Probo",
      platform2: "Polymarket",
      market: marketId,
      buyPrice,
      sellPrice,
      profit,
      profitPercentage,
      buySize: Math.min(proboBestAsk.size, polymarketBestBid.size),
      sellSize: Math.min(proboBestAsk.size, polymarketBestBid.size),
      isProfitable,
    });
  }

  // Check if we can buy on Polymarket and sell on Probo
  const polymarketBestAsk = polymarketOrderbook.asks[0];
  const proboBestBid = proboOrderbook.bids[0];

  if (polymarketBestAsk && proboBestBid) {
    const buyPrice = polymarketBestAsk.price;
    const sellPrice = proboBestBid.price;
    const profit = sellPrice - buyPrice;
    const profitPercentage = (profit / buyPrice) * 100;
    const isProfitable = profit > 0;

    opportunities.push({
      platform1: "Polymarket",
      platform2: "Probo",
      market: marketId,
      buyPrice,
      sellPrice,
      profit,
      profitPercentage,
      buySize: Math.min(polymarketBestAsk.size, proboBestBid.size),
      sellSize: Math.min(polymarketBestAsk.size, proboBestBid.size),
      isProfitable,
    });
  }

  return opportunities;
};

export const arbitrageTool = createTool({
  id: "check-arbitrage",
  description: "Check for arbitrage opportunities between Probo and Polymarket for a specific market",
  inputSchema: z.object({
    marketId: z.string().describe("Market ID to check for arbitrage opportunities"),
  }),
  outputSchema: z.object({
    opportunities: z.array(z.object({
      platform1: z.string(),
      platform2: z.string(),
      market: z.string(),
      buyPrice: z.number(),
      sellPrice: z.number(),
      profit: z.number(),
      profitPercentage: z.number(),
      buySize: z.number(),
      sellSize: z.number(),
      isProfitable: z.boolean(),
    })),
    summary: z.string(),
    timestamp: z.string(),
  }),
  execute: async ({ context }) => {
    const { marketId } = context;

    try {
      // Fetch orderbooks from both platforms
      const [proboOrderbook, polymarketOrderbook] = await Promise.all([
        fetchProboOrderbook(marketId),
        fetchPolymarketOrderbook(marketId),
      ]);

      // Calculate arbitrage opportunities
      const opportunities = calculateArbitrage(proboOrderbook, polymarketOrderbook, marketId);

      // Filter profitable opportunities
      const profitableOpportunities = opportunities.filter(opp => opp.isProfitable);

      // Create summary
      let summary = `Found ${opportunities.length} arbitrage opportunities for market ${marketId}. `;
      if (profitableOpportunities.length > 0) {
        const bestOpportunity = profitableOpportunities.reduce((best, current) => 
          current.profitPercentage > best.profitPercentage ? current : best
        );
        summary += `Best opportunity: Buy on ${bestOpportunity.platform1} at ${bestOpportunity.buyPrice} and sell on ${bestOpportunity.platform2} at ${bestOpportunity.sellPrice} for ${bestOpportunity.profitPercentage.toFixed(2)}% profit.`;
      } else {
        summary += "No profitable arbitrage opportunities found.";
      }

      return {
        opportunities,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error checking arbitrage:", error);
      return {
        opportunities: [],
        summary: `Error checking arbitrage for market ${marketId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});
