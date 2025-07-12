import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { model } from "../../config";
import { generateText } from "ai";

interface GeocodingResponse {
	results: {
		latitude: number;
		longitude: number;
		name: string;
	}[];
}
interface WeatherResponse {
	current: {
		time: string;
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		wind_speed_10m: number;
		wind_gusts_10m: number;
		weather_code: number;
	};
}

export const weatherTool = createTool({
	id: "get-weather",
	description: "Get current weather for a location",
	inputSchema: z.object({
		location: z.string().describe("City name"),
	}),
	outputSchema: z.object({
		temperature: z.number(),
		feelsLike: z.number(),
		humidity: z.number(),
		windSpeed: z.number(),
		windGust: z.number(),
		conditions: z.string(),
		location: z.string(),
	}),
	execute: async ({ context }) => {
		return await getWeather(context.location);
	},
});

const getWeather = async (location: string) => {
	// Ask the LLM to imagine the weather for the given location
	const prompt = `Imagine you are a weather reporter. What is the weather like today in ${location}? Please provide temperature (°C), feels like (°C), humidity (%), wind speed (km/h), wind gust (km/h), and a short description of the conditions. Format your answer as JSON with keys: temperature, feelsLike, humidity, windSpeed, windGust, conditions.`;

	const { text } = await generateText({
	  model,
	  prompt,
	});
	const response = text;

	// Try to parse the LLM's response as JSON
	let weather;
	try {
		weather = typeof response === 'string' ? JSON.parse(response) : response;
	} catch (e) {
		// If parsing fails, return a default imagined weather
		weather = {
			temperature: 20,
			feelsLike: 19,
			humidity: 60,
			windSpeed: 10,
			windGust: 15,
			conditions: "Partly cloudy",
		};
	}

	return {
		...weather,
		location,
	};
};

function getWeatherCondition(code: number): string {
	const conditions: Record<number, string> = {
		0: "Clear sky",
		1: "Mainly clear",
		2: "Partly cloudy",
		3: "Overcast",
		45: "Foggy",
		48: "Depositing rime fog",
		51: "Light drizzle",
		53: "Moderate drizzle",
		55: "Dense drizzle",
		56: "Light freezing drizzle",
		57: "Dense freezing drizzle",
		61: "Slight rain",
		63: "Moderate rain",
		65: "Heavy rain",
		66: "Light freezing rain",
		67: "Heavy freezing rain",
		71: "Slight snow fall",
		73: "Moderate snow fall",
		75: "Heavy snow fall",
		77: "Snow grains",
		80: "Slight rain showers",
		81: "Moderate rain showers",
		82: "Violent rain showers",
		85: "Slight snow showers",
		86: "Heavy snow showers",
		95: "Thunderstorm",
		96: "Thunderstorm with slight hail",
		99: "Thunderstorm with heavy hail",
	};
	return conditions[code] || "Unknown";
}
