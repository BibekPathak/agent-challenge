import { arbitrageTool } from "./arb-tool";
import { arbitrageAgent } from "./arb-agent";

// Simple test function
export async function testArbitrageAgent() {
  console.log("Testing Arbitrage Agent...");
  
  try {
    // Test the arbitrage tool
    console.log("\n1. Testing arbitrage tool...");
    const toolResult = await arbitrageTool.execute({
      context: { marketId: "test-market-123" },
      runtimeContext: {} as any
    });
    
    console.log("Tool result:", JSON.stringify(toolResult, null, 2));
    
    // Test the agent (this would normally be done through the Mastra framework)
    console.log("\n2. Arbitrage agent is ready!");
    console.log("Agent name:", arbitrageAgent.name);
    console.log("Agent tools:", Object.keys(arbitrageAgent.tools));
    
    console.log("\n Arbitrage agent test completed successfully!");
    
  } catch (error) {
    console.error(" Error testing arbitrage agent:", error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testArbitrageAgent();
} 