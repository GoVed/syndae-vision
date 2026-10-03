import config from '../config.js';
import logger from '../utils/logger.js';
import { resolveImage } from './image.js';

/**
 * Invokes Ollama's multimodal vision generate endpoint.
 */
async function callOllamaVision(prompt, base64Image) {
  const url = `${config.ollamaBaseUrl}/api/generate`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.visionModel,
        prompt,
        images: [base64Image],
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Ollama Vision HTTP error: ${res.status}`);
    const data = await res.json();
    return (data.response || '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Invokes OpenAI-compatible multimodal endpoint (vLLM, llama-server, Claude/OpenAI proxy).
 */
async function callOpenAiCompatibleVision(prompt, base64Image, mimeType) {
  const url = `${config.apiUrl}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  const payload = {
    model: config.visionModel,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` }
          }
        ]
      }
    ],
    max_tokens: 1024
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Vision API HTTP error: ${res.status}`);
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Core image analysis dispatcher.
 */
async function analyzeImage(imageInput, prompt) {
  const start = Date.now();
  const { base64, mimeType, byteLength } = await resolveImage(imageInput);

  let description = '';
  if (config.backend === 'openai_compatible') {
    description = await callOpenAiCompatibleVision(prompt, base64, mimeType);
  } else {
    description = await callOllamaVision(prompt, base64);
  }

  return {
    description,
    model: config.visionModel,
    backend: config.backend,
    image_bytes: byteLength,
    mime_type: mimeType,
    latency_ms: Date.now() - start
  };
}

/**
 * Describes the visual contents of an image.
 */
export async function describeImage({ image, detail_level = 'normal' }) {
  let prompt = 'Describe this image thoroughly and objectively. Identify all key subjects, environment, prominent colors, and activities.';
  if (detail_level === 'brief') {
    prompt = 'Provide a concise, 1-2 sentence description of this image.';
  } else if (detail_level === 'detailed') {
    prompt = 'Provide a deeply detailed visual analysis of this image, describing foreground, background, text, style, lighting, and all visible elements.';
  }
  return analyzeImage(image, prompt);
}

/**
 * Answers a specific question or inspects details in an image.
 */
export async function inspectImage({ image, question }) {
  const prompt = question || 'What is shown in this image?';
  return analyzeImage(image, prompt);
}

/**
 * Extracts visible text and signs via Optical Character Recognition (OCR).
 */
export async function ocrImage({ image }) {
  const prompt = 'Transcribe all visible text, numbers, labels, signs, and handwriting from this image verbatim. If no text exists, reply: "No readable text found."';
  const res = await analyzeImage(image, prompt);
  return {
    text: res.description,
    ...res
  };
}

export default { describeImage, inspectImage, ocrImage, analyzeImage };
