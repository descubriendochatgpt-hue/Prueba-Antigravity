
import { Scanner } from '@/components/Scanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
             Official Financial Search
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Retrieving documents exclusively from official verified sources.
          </p>
        </div>

        <Scanner />
      </div>
    </main>
  );
}
