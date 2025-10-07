/**
 * Escapes special characters in a string for safe HTML rendering
 * @param str The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Processes a recipe step or ingredient to ensure it's safe for rendering
 * @param text The text to process
 * @returns The processed and HTML-safe string
 */
export function processRecipeText(text: string): string {
  if (!text) return '';
  
  // First escape any HTML special characters
  let processed = escapeHtml(text);
  
  // Handle common formatting in recipe steps
  processed = processed
    .replace(/\n/g, '<br>') // Preserve line breaks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
    
  return processed;
}
