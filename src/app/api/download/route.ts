import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { fetchFile } from '@/lib/downloader';
import { extractRootDomain, isAllowedUrl } from '@/lib/validator';
import { z } from 'zod';

// Define the expected request body schema
const docSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    year: z.string().optional(),
    type: z.string(),
});

const bodySchema = z.object({
    documents: z.array(docSchema),
    sourceDomain: z.string(), // Added to verify strictly against the original source
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = bodySchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { documents, sourceDomain } = result.data;

        // Validate headers for streaming response
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="financial_docs_${sourceDomain}.zip"`);
        headers.set('Content-Type', 'application/zip');

        // Create a pass-through stream to pipe the archive to the response
        const passThrough = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Pipe archive data to the stream
        archive.pipe(passThrough);

        // Process files asynchronously but coordinate the stream
        // Note: In Vercel serverless, we generally want to avoid long-running processes.
        // We'll trust the architecture choice for now but note clearly this might timeout on >10 files.

        (async () => {
            try {
                // Create Manifest
                const manifest = {
                    sourceDomain,
                    timestamp: new Date().toISOString(),
                    documents: documents.map(d => ({ ...d, status: 'pending' }))
                };

                for (const doc of documents) {
                    try {
                        // STRICT SECURITY RE-CHECK
                        if (!isAllowedUrl(doc.url, sourceDomain)) {
                            console.warn(`[Download] Skipping ${doc.url} - Off-domain violation`);
                            continue;
                        }

                        console.log(`[Download] Fetching ${doc.url}...`);
                        const buffer = await fetchFile(doc.url);

                        // Generate Folder Structure: FY2023/Annual/Report.pdf
                        const yearFolder = doc.year ? `FY${doc.year}` : 'Unknown_Year';
                        const categoryFolder = doc.type || 'Other';
                        // Sanitize filename
                        const safeTitle = doc.title.replace(/[^a-z0-9\.\-_]/gi, '_').substring(0, 100);
                        const ext = doc.url.split('.').pop()?.split('?')[0] || 'pdf'; // Access query param safe extension

                        const zipPath = `${yearFolder}/${categoryFolder}/${safeTitle}.${ext}`;

                        archive.append(buffer, { name: zipPath });

                    } catch (error) {
                        console.error(`[Download] Failed to include ${doc.url}`, error);
                        // We could add a text file noting the error in the zip
                        archive.append(Buffer.from(`Failed to download: ${doc.url}\nError: ${String(error)}`), { name: `ERRORS/${doc.title}_error.txt` });
                    }
                }

                // Add Manifest
                archive.append(Buffer.from(JSON.stringify(manifest, null, 2)), { name: 'manifest.json' });

                await archive.finalize();
            } catch (err) {
                console.error('Archiving error:', err);
                archive.abort();
            }
        })();

        // Return the stream
        // @ts-ignore - Next.js/Node stream compatibility implies this works usually
        return new NextResponse(passThrough, { headers });

    } catch (error) {
        console.error('[API] Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}