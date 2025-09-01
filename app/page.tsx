'use client'

import OriginDestinationChart from './components/OriginDestinationChart'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Black callouts at the top */}
      <div className="pt-16 pb-12 px-8 text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-black tracking-tight">
          The power of DuckDB-WASM
        </h1>
        <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed font-light">
          This site has zero backend. The charts below are built from a client-side DuckDB query to a Parquet file containing 18 million rows.
        </p>
      </div>

      {/* Main Chart Interface - Containerless for negative space */}
      <div className="px-8 pb-16">
        <OriginDestinationChart />
      </div>

      {/* Footer Link */}
      <div className="text-center pb-8">
        <a href="/sql" className="text-gray-600 hover:text-black transition-colors text-sm">
          Advanced SQL Interface →
        </a>
      </div>
    </main>
  )
}
