'use client'

import { useState, useEffect, useCallback } from 'react'
import * as duckdb from '@duckdb/duckdb-wasm'

interface QueryResult {
  columns: string[]
  rows: any[][]
  executionTime: number
  rowCount: number
}

export default function DuckDBQuery() {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [query, setQuery] = useState<string>('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [datasetInfo, setDatasetInfo] = useState<string>('')
  const [initTime, setInitTime] = useState<number>(0)

  // Format cell values based on column type
  const formatCellValue = (cell: any, columnName: string): string => {
    if (cell === null || cell === undefined) return 'NULL'
    
    // Format date columns to yyyy-mm-dd
    if (columnName.toLowerCase().includes('date')) {
      try {
        const date = new Date(cell)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0] // yyyy-mm-dd format
        }
      } catch (e) {
        // If date parsing fails, return original value
      }
    }
    
    // Format passenger/numerical columns with comma separators
    if (columnName.toLowerCase().includes('passenger') || 
        columnName.toLowerCase().includes('total') ||
        columnName.toLowerCase().includes('rank') ||
        typeof cell === 'number') {
      return Number(cell).toLocaleString()
    }
    
    // Return original value for other columns
    return String(cell)
  }



  // Initialize DuckDB WASM
  useEffect(() => {
    const initDuckDB = async () => {
      const startTime = performance.now()
      try {
        setIsInitializing(true)
        setError(null)
        
        // Get the JSDelivr bundles
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
        
        // Select a bundle based on browser checks
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)
        
        // Create a worker
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
        )
        
        // Instantiate the asynchronous version of DuckDB-wasm
        const worker = new Worker(worker_url)
        const logger = new duckdb.ConsoleLogger()
        const duckdbInstance = new duckdb.AsyncDuckDB(logger, worker)
        
        await duckdbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker)
        URL.revokeObjectURL(worker_url)
        
        // Create a connection
        const connection = await duckdbInstance.connect()
        
        // Register the S3 dataset with timeout
        const s3Url = 'https://data.kijang.net/cb39dq/duckdb_test.parquet'
        
        // Set a timeout for dataset info to prevent blocking
        const datasetInfoPromise = Promise.race([
          connection.query(`
            SELECT 
              COUNT(*) as total_rows,
              COUNT(DISTINCT *) as distinct_rows
            FROM '${s3Url}'
          `),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Dataset info timeout')), 5000)
          )
        ])
        
        try {
          const infoResult = await datasetInfoPromise as any
          if (infoResult && infoResult.numRows > 0) {
            const row = infoResult.toArray()[0]
            setDatasetInfo(`Dataset loaded: ${row.total_rows?.toLocaleString()} rows`)
          }
        } catch (infoError) {
          console.log('Dataset info not available yet:', infoError)
          setDatasetInfo('Dataset ready - info loading in background')
        }
        
        const endTime = performance.now()
        const totalInitTime = endTime - startTime
        setInitTime(totalInitTime)
        console.log(`🚀 DuckDB initialized in ${totalInitTime.toFixed(2)}ms`)
        
        setDb(duckdbInstance)
        setIsInitializing(false)
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err)
        setError(`Failed to initialize DuckDB: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsInitializing(false)
      }
    }

    initDuckDB()
  }, [])

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!db || !query.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const startTime = performance.now()
      const connection = await db.connect()
      
      const queryResult = await connection.query(query.trim())
      const endTime = performance.now()
      
      if (queryResult && queryResult.numRows > 0) {
        // Convert Arrow table to array for easier handling
        const rows = queryResult.toArray()
        const columns = queryResult.schema.fields.map(field => field.name)
        
        setResult({
          columns,
          rows: rows.slice(0, 100).map(row => Object.values(row)), // Limit to first 100 rows for display
          executionTime: endTime - startTime,
          rowCount: queryResult.numRows
        })
      } else {
        setResult({
          columns: [],
          rows: [],
          executionTime: endTime - startTime,
          rowCount: 0
        })
      }
    } catch (err) {
      console.error('Query execution failed:', err)
      let errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to load')) {
        errorMessage = `Network Error: The dataset URL may not be accessible due to CORS restrictions. Try the "Test CORS dataset" sample query first.`
      } else if (errorMessage.includes('parquet')) {
        errorMessage = `Parquet Error: ${errorMessage}. The file format may not be compatible.`
      }
      
      setError(`Query failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [db, query])

  // Auto-resize textarea when query changes
  useEffect(() => {
    const textarea = document.getElementById('query') as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px'
    }
  }, [query])

  // Sample queries
  const sampleQueries = [
    {
      name: 'Number of Rows',
      query: "SELECT COUNT(*) as total_rows FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet'"
    },
    {
      name: 'Sample Data',
      query: "SELECT * FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet' LIMIT 10"
    }
  ]

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery)
  }

  if (isInitializing) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Initializing DuckDB WASM...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds on first load</p>
      </div>
    )
  }

  if (error && !db) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg mb-4">❌ Initialization Failed</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dataset Info */}
      {datasetInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{datasetInfo}</p>
          {initTime > 0 && (
            <p className="text-green-600 text-sm mt-1">
              ⚡ Initialized in {initTime.toFixed(0)}ms
              {initTime < 1000 ? ' (Excellent!)' : initTime < 3000 ? ' (Good)' : ' (Loading...)'}
            </p>
          )}
        </div>
      )}

      {/* Sample Queries */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Sample Queries</h3>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSampleQuery(sample.query)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              {sample.name}
            </button>
          ))}
          
          <button
            onClick={() => setQuery(`WITH station_totals AS (
  SELECT 
    station,
    SUM(passengers) as total_passengers
  FROM (
    SELECT origin as station, passengers FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet'
    UNION ALL
    SELECT destination as station, passengers FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet'
  )
  WHERE station != 'A0: All Stations'
  GROUP BY station
)
SELECT 
  station,
  total_passengers,
  RANK() OVER (ORDER BY total_passengers DESC) as rank
FROM station_totals
ORDER BY total_passengers DESC
LIMIT 10`)}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Popular Stations
          </button>
        </div>
      </div>

      {/* Query Input */}
      <div>
        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
          SQL Query
        </label>
        
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query here..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none bg-white text-gray-900 relative z-10"
          style={{ 
            minHeight: '128px',
            maxHeight: '400px',
            height: 'auto',
            backgroundColor: 'white',
            color: '#111827',
            border: '1px solid #d1d5db',
            position: 'relative',
            zIndex: 10
          }}
          autoComplete="off"
          spellCheck="false"
          aria-label="SQL Query Input"
          aria-describedby="query-help"
          tabIndex={0}
          onInput={(e) => {
            // Auto-expand the textarea to fit content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 400) + 'px';
          }}
        />
        <div id="query-help" className="sr-only">
          Enter your SQL query to execute against the 15 million row dataset
        </div>
        

        
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Query the 14M row dataset directly from S3
          </p>
          <button
            onClick={executeQuery}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
          
          {/* CORS Troubleshooting */}
          {error.includes('Network Error') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-yellow-800 font-medium mb-2">🔧 CORS Issue Detected</h4>
              <p className="text-yellow-700 text-sm mb-3">
                The dataset URL is not accessible due to CORS (Cross-Origin Resource Sharing) restrictions.
              </p>
              <div className="space-y-2 text-sm text-yellow-700">
                <p><strong>Quick Fix:</strong> Try the "Test CORS dataset" sample query first to verify DuckDB WASM is working.</p>
                <p><strong>For Production:</strong> The S3 bucket needs CORS configuration to allow cross-origin requests.</p>
                <p><strong>Alternative:</strong> Use a CORS-enabled dataset or host the file on a CORS-enabled server.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Query Results</h3>
            <div className="text-sm text-gray-600">
              {result.rowCount.toLocaleString()} rows • {result.executionTime.toFixed(2)}ms
            </div>
          </div>
          
          {result.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {result.columns.map((column, index) => (
                      <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-b">
                          {formatCellValue(cell, result.columns[cellIndex])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rowCount > 100 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing first 100 rows of {result.rowCount.toLocaleString()} total rows
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Query executed successfully but returned no rows
            </div>
          )}
        </div>
      )}
    </div>
  )
}
