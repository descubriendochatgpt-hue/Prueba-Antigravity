import { URL } from 'url';

/**
 * Validates if a given URL belongs to the allowed company domain.
 * STRICT MODE: Only subdomains of the official allowed domain are permitted.
 */
export function isAllowedUrl(url: string, allowedRootDomain: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const cleanRoot = allowedRootDomain.toLowerCase().replace(/^www\./, '');

    // 1. Exact match
    if (hostname === cleanRoot) return true;

    // 2. Subdomain match (e.g. ir.apple.com ends with .apple.com)
    // We add a dot to ensure we don't match "crabapple.com" for "apple.com"
    if (hostname.endsWith('.' + cleanRoot)) return true;

    return false;
  } catch (e) {
    // Invalid URL format
    return false;
  }
}

/**
 * Extracts the root domain from a user input URL to use as the allowlist base.
 * e.g. "https://investor.apple.com/..." -> "apple.com"
 * NOTE: This is a simple heuristic. For production, use a public suffix list library
 * if we needed to handle "co.uk" perfectly, but for this task, we ask user/auto-detect.
 */
export function extractRootDomain(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    
    // Fallback logic: take simple last 2 parts (apple.com)
    // If it's a known short TLD, this might be risky, but usually IR sites are .com/.org
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return parsed.hostname;
  } catch (e) {
    return '';
  }
}