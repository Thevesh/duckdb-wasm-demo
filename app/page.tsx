'use client'

import { useState, useEffect } from 'react'
import OriginDestinationChart from './components/OriginDestinationChart'

export default function Home() {
  const [rowCount, setRowCount] = useState<string>('multi-million')

  useEffect(() => {
    fetch('https://data.kijang.net/cb39dq/static_test.json')
      .then(res => res.json())
      .then(data => {
        const rows = data.n_rows
        const formatted = typeof rows === 'number'
          ? rows.toLocaleString()
          : rows
        setRowCount(formatted)
      })
      .catch(err => {
        console.error('Failed to fetch metadata:', err)
        // Keep default fallback text
      })
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero Section - Black callouts at the top */}
      <div className="pt-16 pb-12 px-8 text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-black tracking-tight">
          The power of DuckDB-WASM
        </h1>
        <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed font-light">
          This site has zero backend. The charts below are built from a client-side DuckDB query to a Parquet file containing {rowCount} rows.
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
