import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherAgent } from "./agents/weather-agent/weather-agent"; // This can be deleted later
import { weatherWorkflow } from "./agents/weather-agent/weather-workflow"; // This can be deleted later
import { arbitrageAgent } from "./agents/arb-agent/arb-agent";
import { arbitrageWorkflow } from "./agents/arb-agent/arb-workflow";

export const mastra = new Mastra({
	workflows: { weatherWorkflow, arbitrageWorkflow }, // can be deleted later
	agents: { weatherAgent, arbitrageAgent },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
