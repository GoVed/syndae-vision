import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.HTTP_PORT || '8773', 10),
  host: process.env.HTTP_HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Backend: 'ollama' | 'openai_compatible'
  backend: (process.env.VISION_BACKEND || 'ollama').toLowerCase(),

  // Ollama configuration
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),

  // Vision Model ID
  visionModel: process.env.VISION_MODEL || 'moondream',

  // OpenAI-compatible endpoint configuration (vLLM, llama-server, Claude/OpenAI proxy)
  apiUrl: (process.env.VISION_API_URL || 'http://localhost:11434/v1').replace(/\/+$/, ''),
  apiKey: process.env.VISION_API_KEY || '',

  // Styx Host Integration
  styxApiUrl: process.env.STYX_API_URL || 'http://localhost:3000',
  styxAccessKey: process.env.STYX_ACCESS_KEY || 'styx-local-dev-key',

  // Directory paths
  rootDir,
  instructionsPath: path.join(rootDir, 'instructions.md'),
  manifestPath: path.join(rootDir, 'manifest.json')
};

export default config;
