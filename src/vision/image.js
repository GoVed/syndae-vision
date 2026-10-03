import fs from 'node:fs';
import path from 'node:path';
import logger from '../utils/logger.js';

/**
 * Normalizes and resolves an image from a path, URL, or base64 string into clean base64 data.
 * @param {string} input Local path, HTTP URL, data URI, or raw base64.
 * @returns {Promise<{ base64: string, mimeType: string, byteLength: number }>}
 */
export async function resolveImage(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Image input must be a non-empty string (path, URL, or base64)');
  }

  const trimmed = input.trim();

  // 1. Data URI (e.g. data:image/png;base64,....)
  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
    if (match) {
      const mimeType = match[1];
      const base64 = match[2].trim();
      const byteLength = Buffer.from(base64, 'base64').length;
      return { base64, mimeType, byteLength };
    }
  }

  // 2. HTTP / HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    logger.debug({ url: trimmed }, 'Fetching remote image URL');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const resp = await fetch(trimmed, { signal: controller.signal });
      clearTimeout(timeout);
      if (!resp.ok) {
        throw new Error(`Failed to fetch image: HTTP ${resp.status}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = resp.headers.get('content-type') || 'image/jpeg';
      return {
        base64: buffer.toString('base64'),
        mimeType,
        byteLength: buffer.length
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // 3. Local filesystem path
  if (fs.existsSync(trimmed)) {
    const stats = fs.statSync(trimmed);
    if (!stats.isFile()) {
      throw new Error(`Path is not a regular file: ${trimmed}`);
    }

    const buffer = fs.readFileSync(trimmed);
    const ext = path.extname(trimmed).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';

    return {
      base64: buffer.toString('base64'),
      mimeType,
      byteLength: buffer.length
    };
  }

  // 4. Raw base64 string
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 100))) {
    const buffer = Buffer.from(trimmed, 'base64');
    if (buffer.length > 32) {
      return {
        base64: trimmed,
        mimeType: 'image/jpeg',
        byteLength: buffer.length
      };
    }
  }

  throw new Error(`Unable to resolve image source: file not found or invalid format: ${trimmed.slice(0, 80)}...`);
}

export default { resolveImage };
