import express from 'express';
import fs from 'node:fs';
import config from '../config.js';
import logger from '../utils/logger.js';
import { handleMcpRequest } from './server.js';
import { describeImage, inspectImage, ocrImage } from '../vision/engine.js';

/**
 * Starts the Vision Tool HTTP daemon.
 * @returns {import('http').Server}
 */
export function startHttpServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // 1. Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'styx-vision',
      version: '1.0.0',
      uptime: process.uptime()
    });
  });

  // 2. Status & Configuration
  app.get('/status', (req, res) => {
    res.json({
      service: 'styx-vision',
      backend: config.backend,
      model: config.visionModel,
      ollama_url: config.ollamaBaseUrl,
      api_url: config.apiUrl,
      port: config.port,
      status: 'ready'
    });
  });

  // 3. Instructions endpoint for Styx auto-ingestion
  app.get('/instructions', (req, res) => {
    try {
      if (fs.existsSync(config.instructionsPath)) {
        const instructions = fs.readFileSync(config.instructionsPath, 'utf-8');
        return res.json({
          success: true,
          name: 'vision',
          title: 'Universal Computer Vision & Image Inspector',
          instructions
        });
      }
      res.status(404).json({ success: false, error: 'instructions.md not found' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. MCP JSON-RPC Endpoint
  app.post('/mcp', async (req, res) => {
    try {
      const response = await handleMcpRequest(req.body);
      if (response === null) return res.status(204).end();
      res.json(response);
    } catch (err) {
      logger.error({ err }, 'Error handling MCP request over HTTP');
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: { code: -32603, message: `Internal server error: ${err.message}` }
      });
    }
  });

  // 5. REST convenience endpoint: Describe Image
  app.post('/describe', async (req, res) => {
    try {
      const { image, detail_level = 'normal' } = req.body || {};
      if (!image) return res.status(400).json({ success: false, error: 'image is required in body' });
      const result = await describeImage({ image, detail_level });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. REST convenience endpoint: Inspect Image
  app.post('/inspect', async (req, res) => {
    try {
      const { image, question } = req.body || {};
      if (!image) return res.status(400).json({ success: false, error: 'image is required in body' });
      const result = await inspectImage({ image, question });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. REST convenience endpoint: OCR Image
  app.post('/ocr', async (req, res) => {
    try {
      const { image } = req.body || {};
      if (!image) return res.status(400).json({ success: false, error: 'image is required in body' });
      const result = await ocrImage({ image });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const server = app.listen(config.port, config.host, () => {
    logger.info(
      { port: config.port, host: config.host, backend: config.backend, model: config.visionModel },
      'Styx Universal Vision MCP HTTP Server listening'
    );
  });

  return server;
}

export default { startHttpServer };
