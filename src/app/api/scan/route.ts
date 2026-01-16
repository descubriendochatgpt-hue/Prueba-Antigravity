import { NextResponse } from 'next/server';
import { scanPage } from '@/lib/crawler';
import { extractRootDomain } from '@/lib/validator';
import { z } from 'zod';

const schema = z.object({
    url: z.string().url(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
        }

        const { url } = result.data;

        // Strict Domain Security: We lock the crawler to the domain of the INPUT URL.
        const rootDomain = extractRootDomain(url);
        if (!rootDomain) {
            return NextResponse.json({ error: 'Could not determine root domain from URL' }, { status: 400 });
        }

        console.log(`[API] Starting scan for ${url} (Allowed: *.${rootDomain})`);

        const documents = await scanPage(url, rootDomain);

        return NextResponse.json({
            success: true,
            scannedUrl: url,
            allowedDomain: rootDomain,
            found: documents.length,
            documents
        });

    } catch (error) {
        console.error('[API] Scan error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}