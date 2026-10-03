/**
 * MCP tool catalog definitions for Universal Computer Vision & Image Inspector (2024-11-05 spec).
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'describe_image',
    description: 'Analyze an image (from a local file path, web URL, or base64 data URI) and return a rich, descriptive overview of its visual contents, objects, colors, and setting.',
    inputSchema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Local absolute image path (e.g. /path/to/img.png), HTTP/HTTPS URL, or base64 data URI.'
        },
        detail_level: {
          type: 'string',
          enum: ['brief', 'normal', 'detailed'],
          description: 'Level of visual detail: "brief" (1-2 sentences), "normal" (standard summary), or "detailed" (comprehensive visual breakdown).'
        }
      },
      required: ['image']
    }
  },
  {
    name: 'inspect_image',
    description: 'Ask a specific question or query about an image to analyze fine details, count objects, read charts, or identify elements.',
    inputSchema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Local absolute image path, web URL, or base64 data URI.'
        },
        question: {
          type: 'string',
          description: 'The specific question or instruction about the image (e.g. "What does the text on the error screen say?", "What brand of car is this?").'
        }
      },
      required: ['image', 'question']
    }
  },
  {
    name: 'ocr_image',
    description: 'Extract all visible text, numbers, signs, labels, receipts, or handwriting verbatim from an image.',
    inputSchema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Local absolute image path, web URL, or base64 data URI.'
        }
      },
      required: ['image']
    }
  }
];

export default { TOOL_DEFINITIONS };
