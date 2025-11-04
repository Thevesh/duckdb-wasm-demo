'use client'

import { useState, useEffect, useCallback } from 'react'
import * as duckdb from '@duckdb/duckdb-wasm'
import PassengerChart from './PassengerChart'

interface PassengerData {
  origin: string
  destination: string
  date: string
  passengers: number
}

interface StationData {
  [key: string]: string[]
}

export default function OriginDestinationChart() {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initTime, setInitTime] = useState<number>(0)

  // Station data state
  const [stationData, setStationData] = useState<StationData>({})
  const [selectedOrigin, setSelectedOrigin] = useState<string>('KJ15: KL Sentral')
  const [selectedDestination, setSelectedDestination] = useState<string>('A0: All Stations')
  const [destinations, setDestinations] = useState<string[]>([])

  // Chart data state
  const [passengerData, setPassengerData] = useState<PassengerData[]>([])
  const [reversePassengerData, setReversePassengerData] = useState<PassengerData[]>([])
  const [querySpeed, setQuerySpeed] = useState<number>(0)
  const [hasInitialData, setHasInitialData] = useState<boolean>(false)
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false)

  // Date range filter state
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('6months')
  const [filteredPassengerData, setFilteredPassengerData] = useState<PassengerData[]>([])
  const [filteredReverseData, setFilteredReverseData] = useState<PassengerData[]>([])
  const [showDestinationWarning, setShowDestinationWarning] = useState<boolean>(false)

  // Load initial data from static_test.json for fast first paint
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('https://data.kijang.net/cb39dq/static_test.json')
        const data = await response.json()

        if (data.initial_data) {
          const origin = 'KJ15: KL Sentral'
          const destination = 'A0: All Stations'

          const dates = data.initial_data.dates || []
          const forwardPassengers = data.initial_data.forward || []
          const reversePassengers = data.initial_data.reverse || []

          // Build PassengerData arrays from the optimized format
          const forward: PassengerData[] = dates.map((date: string, index: number) => ({
            origin,
            destination,
            date,
            passengers: forwardPassengers[index] || 0
          }))

          const reverse: PassengerData[] = dates.map((date: string, index: number) => ({
            origin: destination,
            destination: origin,
            date,
            passengers: reversePassengers[index] || 0
          }))

          setPassengerData(forward)
          setReversePassengerData(reverse)
          setHasInitialData(true)
          console.log('✨ Initial data loaded for fast first paint!')
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
        // Continue without initial data - will load via DuckDB
      }
    }

    loadInitialData()
  }, [])

  // Filter data based on selected time filter
  useEffect(() => {
    if (passengerData.length > 0) {
      let filteredData: PassengerData[] = []

      switch (selectedTimeFilter) {
        case '1month':
          filteredData = passengerData.slice(-31)
          break
        case '6months':
          filteredData = passengerData.slice(-180)
          break
        case '1year':
          filteredData = passengerData.slice(-365)
          break
        default: // 'all'
          filteredData = passengerData
          break
      }

      setFilteredPassengerData(filteredData)
    }

    if (reversePassengerData.length > 0) {
      let filteredData: PassengerData[] = []

      switch (selectedTimeFilter) {
        case '1month':
          filteredData = reversePassengerData.slice(-31)
          break
        case '6months':
          filteredData = reversePassengerData.slice(-180)
          break
        case '1year':
          filteredData = reversePassengerData.slice(-365)
          break
        default: // 'all'
          filteredData = reversePassengerData
          break
      }

      setFilteredReverseData(filteredData)
    }
  }, [selectedTimeFilter, passengerData, reversePassengerData])

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
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        )

        // Instantiate the asynchronous version of DuckDB-wasm
        const worker = new Worker(worker_url)
        const logger = new duckdb.ConsoleLogger()
        const duckdbInstance = new duckdb.AsyncDuckDB(logger, worker)

        await duckdbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker)
        URL.revokeObjectURL(worker_url)

        setDb(duckdbInstance)

        const endTime = performance.now()
        const totalInitTime = endTime - startTime
        setInitTime(totalInitTime)
        console.log(`🚀 DuckDB initialized in ${totalInitTime.toFixed(2)}ms`)

        setIsInitializing(false)
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err)
        setError(`Failed to initialize DuckDB: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsInitializing(false)
      }
    }

    initDuckDB()
  }, [])

  // Load station data from the JSON endpoint
  // Load immediately, independent of DuckDB initialization, for fast UI
  useEffect(() => {
    const loadStationData = async () => {
      try {
        const response = await fetch('https://data.kijang.net/cb39dq/duckdb_test_dropdown.json')
        const data = await response.json()
        setStationData(data)

        // Set destinations for the default origin (KJ15: KL Sentral)
        if (data[selectedOrigin]) {
          setDestinations(data[selectedOrigin])
        }
      } catch (err) {
        console.error('Failed to load station data:', err)
        setError('Failed to load station data')
      }
    }

    loadStationData()
  }, [selectedOrigin])

  // Load destinations when origin changes
  useEffect(() => {
    if (selectedOrigin && stationData[selectedOrigin]) {
      setDestinations(stationData[selectedOrigin])
    }
  }, [selectedOrigin, stationData])

  // Set initial destinations for default origin when component loads
  useEffect(() => {
    if (selectedOrigin && stationData[selectedOrigin] && destinations.length === 0) {
      setDestinations(stationData[selectedOrigin])
    }
  }, [selectedOrigin, stationData, destinations.length])

  const handleOriginChange = (origin: string) => {
    setSelectedOrigin(origin)
    setSelectedDestination('') // Reset destination when origin changes
    setDestinations(stationData[origin] || [])
    setShowDestinationWarning(true) // Show warning that destination needs to be selected
    setHasUserInteracted(true) // Mark that user has interacted
    // Don't trigger query - wait for destination selection
  }

  // Execute query to get passenger data for both directions
  const executeQuery = useCallback(async () => {
    if (!db || !selectedOrigin || !selectedDestination) {
      return // Don't execute query if either is missing
    }

    setIsLoading(true)
    setError('')
    setShowDestinationWarning(false) // Clear warning when query executes

    try {
      const startTime = performance.now()

      const connection = await db.connect()

      // Execute both queries simultaneously

      const [forwardResult, reverseResult] = await Promise.all([
        // Query 1: Origin → Destination
        connection.query(`
          SELECT 
            origin,
            destination,
            date,
            passengers
          FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet'
          WHERE origin = '${selectedOrigin}' 
            AND destination = '${selectedDestination}'
          ORDER BY date ASC
        `),

        // Query 2: Destination → Origin (reverse direction)
        connection.query(`
          SELECT 
            origin,
            destination,
            date,
            passengers
          FROM 'https://data.kijang.net/cb39dq/duckdb_test.parquet'
          WHERE origin = '${selectedDestination}' 
            AND destination = '${selectedOrigin}'
          ORDER BY date ASC
        `)
      ])

      const endTime = performance.now()
      const totalQueryTime = endTime - startTime
      setQuerySpeed(totalQueryTime)

      // Process forward direction data
      if (forwardResult && forwardResult.numRows > 0) {
        const rows = forwardResult.toArray()
        const data: PassengerData[] = rows.map(row => ({
          origin: row.origin,
          destination: row.destination,
          date: row.date,
          passengers: Number(row.passengers)
        }))
        setPassengerData(data)
      }

      // Process reverse direction data
      if (reverseResult && reverseResult.numRows > 0) {
        const rows = reverseResult.toArray()
        const data: PassengerData[] = rows.map(row => ({
          origin: row.origin,
          destination: row.destination,
          date: row.date,
          passengers: Number(row.passengers)
        }))
        setReversePassengerData(data)
      }

    } catch (err) {
      console.error('Query execution failed:', err)
      let errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to load')) {
        errorMessage = `Network Error: The dataset URL may not be accessible due to CORS restrictions.`
      }

      setError(`Query failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [db, selectedOrigin, selectedDestination])

  // Auto-execute query when component loads with default values
  // Skip only on initial mount if we have static data and it's the default selection
  // Once user interacts, always query DuckDB (even when returning to defaults)
  useEffect(() => {
    const isDefaultSelection = selectedOrigin === 'KJ15: KL Sentral' && selectedDestination === 'A0: All Stations'

    // Skip DuckDB query only if:
    // 1. We have initial static data
    // 2. It's the default selection
    // 3. User hasn't interacted yet (first paint only)
    if (hasInitialData && isDefaultSelection && !hasUserInteracted) {
      return
    }

    // Otherwise, always query DuckDB when ready
    if (selectedOrigin && selectedDestination && db && !isInitializing) {
      executeQuery()
    }
  }, [selectedOrigin, selectedDestination, db, isInitializing, executeQuery, hasInitialData, hasUserInteracted])

  // Only show loading spinner if we don't have initial data yet
  // If we have initial data, render immediately and let DuckDB load silently in background
  if (isInitializing && !hasInitialData) {
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
    <div className="space-y-8">
      {/* Station Selection */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin Dropdown */}
          <div>
            <label htmlFor="origin" className="block text-sm font-semibold text-gray-700 mb-2">
              Origin Station
            </label>
            <select
              id="origin"
              value={selectedOrigin}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-colors font-medium"
            >
              <option value="">Select Origin Station</option>
              {Object.keys(stationData).map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Dropdown */}
          <div>
            <label htmlFor="destination" className="block text-sm font-semibold text-gray-700 mb-2">
              Destination Station
            </label>
            <select
              id="destination"
              value={selectedDestination}
              onChange={(e) => {
                setSelectedDestination(e.target.value)
                setShowDestinationWarning(false) // Clear warning when destination is selected
                setHasUserInteracted(true) // Mark that user has interacted
              }}
              disabled={!selectedOrigin}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors font-medium ${showDestinationWarning && !selectedDestination ? 'border-red-500' : ''
                }`}
            >
              <option value="">Select Destination Station</option>
              {destinations.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
            {showDestinationWarning && !selectedDestination && (
              <p className="text-red-500 text-xs mt-1">Please select a destination station.</p>
            )}
          </div>
        </div>
        {/* Query Speed Display */}
        {querySpeed > 0 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-25 border border-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">
                Query completed in {querySpeed.toFixed(0)}ms
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-25 border border-red-100 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Chart Loading */}
      {isLoading && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading passenger data...</p>
        </div>
      )}

      {/* Time Period Filter Buttons - positioned above charts */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setSelectedTimeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Data
          </button>
          <button
            onClick={() => setSelectedTimeFilter('1year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeFilter === '1year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            1 Year
          </button>
          <button
            onClick={() => setSelectedTimeFilter('6months')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeFilter === '6months'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setSelectedTimeFilter('1month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeFilter === '1month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            1 Month
          </button>
        </div>
      </div>

      {/* Dual Charts Layout */}
      {passengerData.length > 0 && (
        <div className="mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Chart: Origin → Destination */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedOrigin} → {selectedDestination}
              </h3>
            </div>

            <PassengerChart
              data={filteredPassengerData}
              origin={selectedOrigin}
              destination={selectedDestination}
              selectedTimeFilter={selectedTimeFilter}
            />
          </div>

          {/* Right Chart: Destination → Origin */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedDestination} → {selectedOrigin}
              </h3>
            </div>

            <PassengerChart
              data={filteredReverseData}
              origin={selectedDestination}
              destination={selectedOrigin}
              selectedTimeFilter={selectedTimeFilter}
            />
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!isLoading && selectedOrigin && selectedDestination && passengerData.length === 0 && (
        <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">
          <p>No passenger data found for the selected route.</p>
          <p className="text-sm mt-2">Try selecting different origin and destination stations.</p>
        </div>
      )}
    </div>
  )
}
