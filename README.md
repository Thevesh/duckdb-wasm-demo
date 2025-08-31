# DuckDB WASM Demo

A NextJS application that demonstrates DuckDB WASM's ability to query large datasets directly in the browser from S3, without server-side processing.

## Features

- **Client-side SQL queries** on a 15 million row dataset
- **Direct S3 integration** - no server required
- **Real-time performance metrics** showing query execution time
- **Sample queries** to get started quickly
- **Responsive UI** with Tailwind CSS
- **WASM-powered analytics** in the browser

## Dataset

The demo uses a 14 million row dataset hosted at:
`https://data.kijang.net/cb39dq/duckdb_test.parquet`

## Tech Stack

- **NextJS 14** - React framework with App Router
- **DuckDB WASM** - In-browser SQL engine powered by WebAssembly
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern styling
- **Apache Arrow** - Efficient data format for results

## How It Works

1. **WASM Initialization**: DuckDB WASM is loaded and initialized in the browser using Web Workers
2. **S3 Connection**: The app connects directly to the S3-hosted parquet file via HTTP
3. **Query Execution**: SQL queries are executed client-side using DuckDB's engine
4. **Results Display**: Query results are displayed with performance metrics in a responsive table

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd duckdb-wasm-demo
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Performance Notes

- **First load**: May take 5-10 seconds as DuckDB WASM initializes
- **Query performance**: Depends on query complexity and data size
- **Memory usage**: Efficient Arrow-based data handling
- **Browser compatibility**: Chrome/Edge 90+, Firefox 88+, Safari 14+

## Browser Compatibility

- **Chrome/Edge**: 90+ (Full support)
- **Firefox**: 88+ (Full support)  
- **Safari**: 14+ (Full support)
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 90+

## Architecture Details

### DuckDB WASM Integration
- Uses `@duckdb/duckdb-wasm` package
- Web Worker-based architecture for non-blocking operations
- Automatic bundle selection based on browser capabilities
- Support for MVP, EH, and COI WASM variants

### Data Flow
1. User enters SQL query
2. Query sent to DuckDB WASM engine
3. Engine fetches data from S3 parquet file
4. Results converted to Apache Arrow format
5. Arrow data displayed in responsive table

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
