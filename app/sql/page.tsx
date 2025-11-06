'use client'

import { useState, useEffect } from 'react'
import DuckDBQuery from '../components/DuckDBQuery'

export default function SQLPage() {
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
      })
  }, [])

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Build Your Own Query
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Directly query the {rowCount} row dataset
          </p>
          <p className="text-lg text-gray-500">
            The dataset is hosted in an S3 bucket and served via CloudFront
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <DuckDBQuery />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This interface allows you to write custom SQL queries against the dataset.
            <br />
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              ← Back to Home
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
