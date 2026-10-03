# Universal Vision & Image Inspector Tool Instructions

## Overview
The **Vision Tool** provides advanced visual perception and analysis capabilities to Syndae Agent OS:
1. **`describe_image`**: Generates a thorough, comprehensive description of what is in an image.
2. **`inspect_image`**: Answers a targeted question about an image (e.g. "What model car is this?", "What is the error message on the screen?").
3. **`ocr_image`**: Transcribes all readable text, signs, logos, and receipts.

---

## When to Call Vision Tools

1. **Incoming Media from Chat / Messaging (WhatsApp, Email, etc.)**:
   - When a user sends an image, photo, screenshot, or receipt, call `describe_image` or `inspect_image` to understand what they are sharing.
2. **Reading Screenshots & Terminal Logs**:
   - If an image contains code, terminal errors, or UI screenshots, call `ocr_image` or `inspect_image` with a query like `"Extract the exact error message and file path"`.
3. **Comparing or Identifying Objects**:
   - When asked to identify an item, place, or person in a picture, call `inspect_image` with the specific user query.

---

## Supported Input Formats
- **Local File Paths**: e.g., `/home/user/Pictures/photo.jpg`, `/app/data/uploads/image.png`
- **Web URLs**: e.g., `https://example.com/image.jpg` (automatically fetched)
- **Data URIs & Base64**: e.g., `data:image/jpeg;base64,...` or raw base64 string

---

## Tool Signatures

### 1. `describe_image`
```json
{
  "name": "describe_image",
  "arguments": {
    "image": "/path/to/image.jpg",
    "detail_level": "normal"
  }
}
```

### 2. `inspect_image`
```json
{
  "name": "inspect_image",
  "arguments": {
    "image": "https://example.com/receipt.png",
    "question": "What is the total amount on this receipt?"
  }
}
```

### 3. `ocr_image`
```json
{
  "name": "ocr_image",
  "arguments": {
    "image": "data:image/png;base64,..."
  }
}
```
