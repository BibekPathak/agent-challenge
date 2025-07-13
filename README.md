# Nosana Arbitrage Agent

![Agent-101](./assets/NosanaBuildersChallengeAgents.jpg)

## Agent Description & Purpose

The **Nosana Arbitrage Agent** is an AI-powered tool designed to monitor betting platforms (like Probo and Polymarket) and identify profitable arbitrage trading opportunities. It fetches real-time orderbooks, compares bid/ask spreads, calculates potential profits, and provides actionable trading recommendations. The agent is built using the [Mastra](https://github.com/mastra-ai/mastra) framework and is ready for deployment on the Nosana network or local environments.

**Key Features:**
- Real-time orderbook analysis from multiple platforms
- Arbitrage opportunity detection and profit calculation
- Risk assessment and execution warnings
- Multi-market monitoring workflow
- Clear, actionable trading instructions

---

## Setup Instructions

### 1. Clone & Install

```sh
# Clone the repository
 git clone https://github.com/yourusername/agent-challenge.git
 cd agent-challenge

# Install dependencies (pnpm recommended)
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the project root. See the section below for required variables.

### 3. Build & Run (Local)

```sh
# Build the project
pnpm run build

# Start the agent (dev mode)
pnpm run dev
```

The agent will be available at `http://localhost:8080` (or as configured).

---

## Environment Variables Required

Set these in your `.env` file:

| Variable                | Description                                                      | Example Value                                 |
|-------------------------|------------------------------------------------------------------|-----------------------------------------------|
| `MODEL_NAME_AT_ENDPOINT`| Name of the LLM model to use at the endpoint                     | `qwen2.5:1.5b`                                |
| `API_BASE_URL`          | Base URL for the LLM API                                         | `http://127.0.0.1:11434/api`                  |
| `PROBO_API_KEY`         | (Optional) API key for Probo betting platform                    | `your-probo-api-key`                          |
| `POLYMARKET_API_KEY`    | (Optional) API key for Polymarket betting platform               | `your-polymarket-api-key`                     |
| `PROBO_BASE_URL`        | (Optional) Override Probo API base URL                           | `https://api.probo.com/v1`                    |
| `POLYMARKET_BASE_URL`   | (Optional) Override Polymarket API base URL                      | `https://api.polymarket.com/v1`               |

---

## Docker Build & Run

### Build the Docker Image

```sh
docker build -t yourusername/agent-challenge:latest .
```

### Run the Container Locally

```sh
docker run -p 8080:8080 --env-file .env yourusername/agent-challenge:latest
```

### Push to Docker Hub

```sh
docker login
docker push yourusername/agent-challenge:latest
```

---

## Example Usage

Interact with the agent via the chat interface or API. Example prompts:

- "Check arbitrage for market ABC123"
- "Analyze opportunities across markets XYZ, DEF, GHI"
- "What's the best arbitrage opportunity right now?"

The agent will respond with detected opportunities, profit calculations, and actionable trading instructions.

---

## Additional Resources

- [Mastra Documentation](https://mastra.ai/en/docs/agents/overview)
- [Nosana Network](https://nosana.io)
- [Ollama LLM](https://ollama.com)

---

## License

MIT
