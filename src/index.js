#!/usr/bin/env node
import { Command } from 'commander';
import config from './config.js';
import logger from './utils/logger.js';
import { startHttpServer } from './mcp/http.js';
import { describeImage, inspectImage } from './vision/engine.js';

const program = new Command();

program
  .name('styx-vision')
  .description('Universal Computer Vision & Multimodal Image Understanding Tool')
  .version('1.0.0');

program
  .command('daemon')
  .description('Start the Vision MCP HTTP daemon service')
  .action(() => {
    logger.info('Starting Universal Vision daemon...');
    startHttpServer();
  });

program
  .command('inspect <image> [question]')
  .description('Inspect an image via CLI')
  .action(async (image, question) => {
    try {
      let res;
      if (question) {
        res = await inspectImage({ image, question });
      } else {
        res = await describeImage({ image });
      }
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error('Vision inspection failed:', err.message);
      process.exit(1);
    }
  });

if (process.argv.length <= 2) {
  startHttpServer();
} else {
  program.parse(process.argv);
}
