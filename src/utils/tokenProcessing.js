/**
 * Utility functions for processing tokens with special space characters
 */

/**
 * Check if a token is a special token that should be hidden from visualization.
 * Unified across the app.
 *
 * Special tokens include:
 * - Angle-bracket all-caps tokens like <BOS_TOKEN>, <EOS_TOKEN>
 * - Chat markers like <|im_start|>, <|im_end|>, <|start_header_id|>, <|end_header_id|>, <|eot_id|>
 * - Think tags: <think>, </think>
 * - Any token that matches the generic <|...|> pattern
 *
 * Note: role tokens like "user", "assistant" are NOT considered special by themselves,
 * but they can be filtered contextually when wrapped by chat markers.
 *
 * @param {string} token - The raw token string
 * @returns {boolean} True if token is a special token
 */
export function isSpecialToken(token) {
  if (!token || typeof token !== 'string') return false;

  // <BOS_TOKEN>, <EOS_TOKEN> ...
  if (/^<[A-Z_]+>$/.test(token)) return true;

  // <think> ... </think>
  if (token === '<think>' || token === '</think>') return true;

  // Explicit chat markers
  if (
    token === '<|im_start|>' ||
    token === '<|im_end|>' ||
    token === '<|start_header_id|>' ||
    token === '<|end_header_id|>' ||
    token === '<|eot_id|>'
  ) {
    return true;
  }

  // Generic <|...|> pattern (covers many special tokens)
  if (/^<\|.*\|>$/.test(token)) return true;

  return false;
}

/**
 * Return true if the token is a chat "start" marker that may be followed by a role token.
 * Currently recognizes <|im_start|> and <|start_header_id|>.
 */
export function isChatStartMarker(token) {
  return token === '<|im_start|>' || token === '<|start_header_id|>';
}

/**
 * Return true if the token is a chat "end" marker for a role header.
 * Currently recognizes <|im_end|> and <|end_header_id|>.
 */
export function isChatEndMarker(token) {
  return token === '<|im_end|>' || token === '<|end_header_id|>';
}

/**
 * Role tokens used in chat templates.
 * We keep this list small and English-only to avoid over-filtering normal content.
 */
const CHAT_ROLES = new Set(['user', 'assistant', 'system', 'developer', 'tool']);

/**
 * Return true if the token looks like a role name in chat templates.
 * This is used in combination with chat start/end markers to filter sequences.
 */
export function isChatRoleToken(token) {
  if (!token || typeof token !== 'string') return false;
  return CHAT_ROLES.has(token);
}

/**
 * Contextual special-token check.
 * Treat role tokens (user/system/assistant/...) as special when they immediately
 * follow a chat start marker (<|im_start|> or <|start_header_id|>).
 *
 * @param {string} token - Current token
 * @param {string|null} prevToken - Previous token in the sequence
 */
export function isSpecialTokenContextual(token, prevToken) {
  if (isSpecialToken(token)) return true;
  if (prevToken && isChatStartMarker(prevToken) && isChatRoleToken(token)) return true;
  return false;
}

/**
 * Process a token for display in the visualization canvas
 * Converts "Ġ" and "▁" to "▁" for visual representation
 * @param {string} token - The raw token string
 * @returns {string} Processed token for visualization
 */
export function processTokenForVisualization(token) {
  if (!token) return token;

  // Replace both "Ġ" and "▁" with "▁" for visualization
  return token.replace(/Ġ/g, '▁').replace(/▁/g, '▁');
}

/**
 * Process a token for display in text (user input or model answer)
 * Converts "Ġ" and "▁" to regular space " "
 * @param {string} token - The raw token string
 * @returns {string} Processed token for text display
 */
export function processTokenForText(token) {
  if (!token) return token;

  // Replace both "Ġ" and "▁" with a regular space
  return token.replace(/Ġ/g, ' ').replace(/▁/g, ' ');
}

/**
 * Check if a token contains a space marker
 * @param {string} token - The raw token string
 * @returns {boolean} True if token starts with a space marker
 */
export function hasSpaceMarker(token) {
  if (!token) return false;
  return token.includes('Ġ') || token.includes('▁');
}
