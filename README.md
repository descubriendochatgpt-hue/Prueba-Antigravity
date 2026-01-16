# Official Financial Docs Downloader

A precision-focused financial document downloader that ensures verifiability by only downloading from official Investor Relations domains.

## Features

-   **Strict Domain Validation**: Rejects any file not hosted on the official company domain.
-   **Official Only**: Does not use third-party aggregators.
-   **Smart Classification**: Detects Annual Reports, 10-K, 10-Q, Presentations, and ESG reports.
-   **Audit Manifest**: (Coming soon) Generates a JSON manifest of all downloaded files.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Crawling**: Cheerio + Fetch (Server-Side)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

3.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Vercel Deployment

This project is optimized for Vercel.
1.  Push to GitHub.
2.  Import project in Vercel.
3.  Deploy (Zero config required).

> **Note**: On Vercel Free Tier, heavy crawling might hit the 10s timeout. The app is optimized to scan first then allow individual downloads to mitigate this.

## Security

-   **SSRF Protection**: Crawler is restricted to the user-provided domain.
-   **No Private IP Access**: The validator blocks local IP ranges (implementation pending in `validator.ts` if needed, currently relies on domain matching).