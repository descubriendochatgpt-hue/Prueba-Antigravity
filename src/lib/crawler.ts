import * as cheerio from 'cheerio';
import { isAllowedUrl } from './validator';

export interface ScannedDocument {
    title: string;
    url: string;
    year?: string;
    type: 'Annual' | 'Quarterly' | 'Presentation' | 'ESG' | 'Other';
    sourcePage: string;
}

const YEAR_REGEX = /(20\d{2})|(FY\d{2})|(19\d{2})/i;
const EXTENSIONS = /\.(pdf|xlsx|xls|zip)$/i;

// Keywords for classification
const KEYWORDS = {
    Annual: ['annual report', '10-k', '20-f', 'annual review', 'year end'],
    Quarterly: ['10-q', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'interim', 'half-year', 'semi-annual'],
    Presentation: ['presentation', 'earnings deck', 'slides', 'investor deck'],
    ESG: ['esg', 'sustainability', 'climate', 'tcfd', 'csr'],
};

export async function scanPage(targetUrl: string, allowedRootDomain: string): Promise<ScannedDocument[]> {
    const results: ScannedDocument[] = [];

    try {
        console.log(`[Crawler] Fetching ${targetUrl}`);
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            }
        });

        if (!response.ok) {
            console.warn(`[Crawler] Failed to fetch ${targetUrl}: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        $('a').each((i, el) => {
            const linkText = $(el).text().trim();
            let href = $(el).attr('href');

            if (!href || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

            // Resolve relative URLs
            try {
                const absoluteUrl = new URL(href, targetUrl).toString();

                // 1. STRICT DOMAIN CHECK
                if (!isAllowedUrl(absoluteUrl, allowedRootDomain)) {
                    return;
                }

                // 2. CHECK EXTENSION (We primarily want explicit files, not just generic pages)
                // However, some download links might be /download?id=123 without extension.
                // For 'Precision', let's stick to known extensions OR explicit "Download" text for now 
                // to avoid noise, unless user asks otherwise.
                if (!EXTENSIONS.test(absoluteUrl)) {
                    // Maybe it's a "Download" button to a script? 
                    // Skip for now to favor precision as requested.
                    return;
                }

                // 3. CLASSIFICATION & METADATA
                const doc: ScannedDocument = {
                    title: linkText || absoluteUrl.split('/').pop() || 'Untitled',
                    url: absoluteUrl,
                    type: 'Other',
                    sourcePage: targetUrl
                };

                // Determine Year
                const yearMatch = (linkText + absoluteUrl).match(YEAR_REGEX);
                if (yearMatch) {
                    doc.year = yearMatch[0].toUpperCase();
                    // Normalize FY23 -> 2023 logic could go here
                }

                // Determine Type
                const combinedText = (linkText + absoluteUrl).toLowerCase();
                if (KEYWORDS.Annual.some(k => combinedText.includes(k))) doc.type = 'Annual';
                else if (KEYWORDS.Quarterly.some(k => combinedText.includes(k))) doc.type = 'Quarterly';
                else if (KEYWORDS.Presentation.some(k => combinedText.includes(k))) doc.type = 'Presentation';
                else if (KEYWORDS.ESG.some(k => combinedText.includes(k))) doc.type = 'ESG';

                // 4. DEDUPLICATION (Basic)
                if (!results.some(r => r.url === doc.url)) {
                    results.push(doc);
                }

            } catch (e) {
                // Invalid URL
            }
        });

    } catch (error) {
        console.error(`[Crawler] Error scanning ${targetUrl}:`, error);
    }

    return results;
}