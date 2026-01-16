
'use client';

import { useState } from 'react';
import { Search, Loader2, FileText, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Doc {
  title: string;
  url: string;
  type: string;
  year?: string;
  sourcePage: string;
}

export function Scanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Doc[]>([]);
  const [error, setError] = useState('');
  const [scannedUrl, setScannedUrl] = useState('');
  const [downloading, setDownloading] = useState(false); // Add simple loading state for download

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setScannedUrl('');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setResults(data.documents);
      setScannedUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
      if (!scannedUrl || results.length === 0) return;
      setDownloading(true);
      try {
          const res = await fetch('/api/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  documents: results, 
                  sourceDomain: new URL(scannedUrl).hostname 
              }),
          });

          if (!res.ok) throw new Error('Download failed');

          // Trigger file download
          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `financial_docs_${new URL(scannedUrl).hostname}.zip`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          
      } catch (err: any) {
          setError(err.message);
      } finally {
          setDownloading(false);
      }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Search Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <form onSubmit={handleScan} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label htmlFor="url" className="text-slate-400 text-sm font-medium uppercase tracking-wider">
              Official Source URL
            </label>
            <div className="relative">
              <input
                id="url"
                type="url"
                required
                placeholder="https://investor.company.com/financials"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-lg"
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              Strict strict mode enabled: Only downloads from official domain allowed.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Scanning Safe Sources...
              </>
            ) : (
              'Scan for Financial Docs'
            )}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Verified Documents</h2>
              <p className="text-sm text-slate-500">Found {results.length} files from {new URL(scannedUrl).hostname}</p>
            </div>
             <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {downloading ? 'Archiving...' : 'Download ZIP'}
                        </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-6 py-4">Title / Filename</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-emerald-400 transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="max-w-[300px] truncate" title={doc.url}>
                        <div className="text-slate-200 font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-slate-600 truncate">{doc.url}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium border",
                        doc.type === 'Annual' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                        doc.type === 'Quarterly' && "bg-purple-500/10 border-purple-500/20 text-purple-400",
                        doc.type === 'Presentation' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                        doc.type === 'ESG' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                        doc.type === 'Other' && "bg-slate-800 border-slate-700 text-slate-400",
                      )}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {doc.year || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-500 hover:text-emerald-400 font-medium hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}