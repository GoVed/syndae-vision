import assert from 'node:assert';
import { resolveImage } from '../src/vision/image.js';
import { handleMcpRequest } from '../src/mcp/server.js';
import { TOOL_DEFINITIONS } from '../src/mcp/definitions.js';

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
}

console.log('--- Running Vision Unit Tests ---');

// 1. Image Resolution Tests
await testAsync('Image: resolve data URI format', async () => {
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const dataUri = `data:image/png;base64,${sampleBase64}`;
  const res = await resolveImage(dataUri);
  assert.strictEqual(res.mimeType, 'image/png');
  assert.strictEqual(res.base64, sampleBase64);
  assert.ok(res.byteLength > 0);
});

await testAsync('Image: resolve raw base64 string', async () => {
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const res = await resolveImage(sampleBase64);
  assert.strictEqual(res.base64, sampleBase64);
  assert.strictEqual(res.mimeType, 'image/jpeg');
});

await testAsync('Image: error on empty or invalid input', async () => {
  await assert.rejects(async () => {
    await resolveImage('');
  }, /non-empty string/);

  await assert.rejects(async () => {
    await resolveImage('/invalid/nonexistent/image.jpg');
  }, /Unable to resolve image source/);
});

// 2. MCP Tool Definitions Tests
test('MCP: tool catalog contains describe, inspect, and ocr', () => {
  assert.ok(Array.isArray(TOOL_DEFINITIONS));
  assert.strictEqual(TOOL_DEFINITIONS.length, 3);
  const names = TOOL_DEFINITIONS.map(t => t.name);
  assert.ok(names.includes('describe_image'));
  assert.ok(names.includes('inspect_image'));
  assert.ok(names.includes('ocr_image'));
});

// 3. MCP JSON-RPC Server Handshake & Tools List
await testAsync('MCP: initialize protocol handshake', async () => {
  const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.strictEqual(res.result.protocolVersion, '2024-11-05');
  assert.strictEqual(res.result.serverInfo.name, 'styx-vision');
});

await testAsync('MCP: tools/list returns all 3 tools', async () => {
  const res = await handleMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.strictEqual(res.result.tools.length, 3);
});

await testAsync('MCP: error handling on missing arguments', async () => {
  const res = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'describe_image',
      arguments: {}
    }
  });

  assert.strictEqual(res.result.isError, true);
  assert.ok(res.result.content[0].text.includes('Missing required argument: image'));
});

await testAsync('MCP: error handling for missing question in inspect_image', async () => {
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const res = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'inspect_image',
      arguments: { image: sampleBase64 }
    }
  });

  assert.strictEqual(res.result.isError, true);
  assert.ok(res.result.content[0].text.includes('Missing required argument: question'));
});

console.log(`\nAll ${passed}/${total} Vision unit tests passed successfully!\n`);
