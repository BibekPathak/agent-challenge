import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";
import { arbitrageTool } from "./arb-tool";

const agent = new Agent({
  name: "Arbitrage Analysis Agent",
  model,
  instructions: `
    You are an expert arbitrage analyst who specializes in identifying profitable trading opportunities across betting platforms.
    
    Your role is to:
    1. Analyze arbitrage opportunities from multiple markets
    2. Rank opportunities by profitability and risk
    3. Provide actionable trading recommendations
    4. Explain market dynamics and risks
    
    When analyzing opportunities:
    - Focus on opportunities with >1% profit margin
    - Consider liquidity and execution risk
    - Explain the trading strategy clearly
    - Warn about potential risks and timing constraints
    - Provide step-by-step execution instructions
    
    Format your analysis with clear sections:
    - Summary of findings
    - Top opportunities ranked by profit
    - Risk assessment
    - Execution strategy
    - Market insights
  `,
});

const marketListSchema = z.object({
  markets: z.array(z.string()).describe("List of market IDs to analyze"),
});

const arbitrageResultSchema = z.object({
  marketId: z.string(),
  opportunities: z.array(z.object({
    platform1: z.string(),
    platform2: z.string(),
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
});

const comprehensiveAnalysisSchema = z.object({
  totalMarkets: z.number(),
  profitableOpportunities: z.number(),
  bestOpportunity: z.object({
    marketId: z.string(),
    profitPercentage: z.number(),
    platforms: z.string(),
  }),
  analysis: z.string(),
  recommendations: z.array(z.string()),
  risks: z.array(z.string()),
});

// Step 1: Check arbitrage for a single market
const checkMarketArbitrage = createStep({
  id: "check-market-arbitrage",
  description: "Check arbitrage opportunities for a specific market",
  inputSchema: z.object({
    marketId: z.string().describe("Market ID to analyze"),
  }),
  outputSchema: arbitrageResultSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const result = await arbitrageTool.execute({ 
      context: { marketId: inputData.marketId },
      runtimeContext: {} as any
    });
    return {
      marketId: inputData.marketId,
      ...result,
    };
  },
});

// Step 2: Analyze multiple markets
const analyzeMultipleMarkets = createStep({
  id: "analyze-multiple-markets",
  description: "Check arbitrage opportunities across multiple markets",
  inputSchema: marketListSchema,
  outputSchema: z.object({
    results: z.array(arbitrageResultSchema),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const results = await Promise.all(
      inputData.markets.map(async (marketId) => {
        try {
          const result = await arbitrageTool.execute({ 
            context: { marketId },
            runtimeContext: {} as any
          });
          return {
            marketId,
            ...result,
          };
        } catch (error) {
          console.error(`Error analyzing market ${marketId}:`, error);
          return {
            marketId,
            opportunities: [],
            summary: `Error analyzing market ${marketId}`,
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    return { results };
  },
});

// Step 3: Generate comprehensive analysis
const generateAnalysis = createStep({
  id: "generate-analysis",
  description: "Generate comprehensive arbitrage analysis and recommendations",
  inputSchema: z.object({
    results: z.array(arbitrageResultSchema),
  }),
  outputSchema: comprehensiveAnalysisSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const { results } = inputData;
    
    // Calculate statistics
    const totalMarkets = results.length;
    const allOpportunities = results.flatMap(r => r.opportunities);
    const profitableOpportunities = allOpportunities.filter(opp => opp.isProfitable).length;
    
    // Find best opportunity
    const profitableOpps = allOpportunities.filter(opp => opp.isProfitable);
    const bestOpportunity = profitableOpps.length > 0 
      ? profitableOpps.reduce((best, current) => 
          current.profitPercentage > best.profitPercentage ? current : best
        )
      : null;

    // Generate analysis using the agent
    const prompt = `Analyze the following arbitrage opportunities across ${totalMarkets} markets:
      ${JSON.stringify(results, null, 2)}
      
      Provide a comprehensive analysis including:
      1. Summary of findings
      2. Top 3 most profitable opportunities
      3. Risk assessment
      4. Trading recommendations
      5. Market insights
    `;

    const response = await agent.stream([
      {
        role: "user",
        content: prompt,
      },
    ]);

    let analysisText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      analysisText += chunk;
    }

    // Extract recommendations and risks from analysis
    const recommendations = [
      "Monitor markets continuously for new opportunities",
      "Execute trades quickly to minimize execution risk",
      "Consider transaction fees in profit calculations",
      "Start with smaller position sizes to test execution",
    ];

    const risks = [
      "Market prices can change rapidly during execution",
      "Liquidity may be insufficient for large trades",
      "Platform downtime can prevent trade execution",
      "Regulatory changes may affect trading ability",
    ];

    return {
      totalMarkets,
      profitableOpportunities,
      bestOpportunity: {
        marketId: bestOpportunity ? `${bestOpportunity.platform1} → ${bestOpportunity.platform2}` : 'None',
        profitPercentage: bestOpportunity ? bestOpportunity.profitPercentage : 0,
        platforms: bestOpportunity ? `${bestOpportunity.platform1} → ${bestOpportunity.platform2}` : 'None',
      },
      analysis: analysisText,
      recommendations,
      risks,
    };
  },
});

// Create the workflow
const arbitrageWorkflow = createWorkflow({
  id: "arbitrage-workflow",
  inputSchema: marketListSchema,
  outputSchema: comprehensiveAnalysisSchema,
})
  .then(analyzeMultipleMarkets)
  .then(generateAnalysis);

arbitrageWorkflow.commit();

export { arbitrageWorkflow }; 