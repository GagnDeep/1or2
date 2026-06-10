/**
 * Encodes and decodes poll data to/from a compact URL-safe string.
 * Uses native CompressionStream if available, falling back to uncompressed base64url.
 */

// Base64URL encoding/decoding utilities
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  // Standard base64 to base64url
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url) {
  // Add padding if needed
  let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encodes a JSON object into a compressed base64url string.
 * @param {Object} data
 * @returns {Promise<string>} The payload string. Prepended with 'c~' if compressed, 'u~' if uncompressed.
 */
export async function encodePoll(data) {
  const jsonStr = JSON.stringify(data);
  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode(jsonStr);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const response = new Response(cs.readable);
      const compressedBuffer = await response.arrayBuffer();
      return 'c~' + bufferToBase64Url(compressedBuffer);
    } catch (e) {
      console.warn('Compression failed, falling back to uncompressed', e);
      return 'u~' + bufferToBase64Url(bytes.buffer);
    }
  } else {
    // Fallback for browsers without CompressionStream
    return 'u~' + bufferToBase64Url(bytes.buffer);
  }
}

/**
 * Decodes a payload string back into a JSON object.
 * @param {string} payloadStr The payload string to decode
 * @returns {Promise<Object>} The decoded data object
 */
export async function decodePoll(payloadStr) {
  if (!payloadStr || payloadStr.length < 3) {
    throw new Error('Invalid payload');
  }

  const mode = payloadStr.substring(0, 2);
  const b64Data = payloadStr.substring(2);

  if (mode !== 'c~' && mode !== 'u~') {
    throw new Error('Unknown payload format');
  }

  try {
    const buffer = base64UrlToBuffer(b64Data);

    if (mode === 'c~') {
      if (typeof DecompressionStream === 'undefined') {
         throw new Error('Browser does not support DecompressionStream to read this poll.');
      }
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(buffer));
      writer.close();
      const response = new Response(ds.readable);
      const decompressedBuffer = await response.arrayBuffer();
      const textDecoder = new TextDecoder();
      const jsonStr = textDecoder.decode(decompressedBuffer);
      return JSON.parse(jsonStr);
    } else {
      const textDecoder = new TextDecoder();
      const jsonStr = textDecoder.decode(buffer);
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error('Failed to decode poll', e);
    throw new Error('Corrupt or unreadable poll data');
  }
}

/**
 * Utility to escape HTML entities to prevent XSS attacks when rendering user content via innerHTML.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a consistent hash id for a payload to use as a local storage key.
 * This ensures the same poll always resolves to the same local results.
 */
export async function hashPayload(payloadStr) {
  const msgBuffer = new TextEncoder().encode(payloadStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Return a short 16 char hex string
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 16);
}
