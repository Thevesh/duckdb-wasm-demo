import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono'
})

export const metadata: Metadata = {
  title: 'The power of DuckDB-WASM',
  description: 'This site has zero backend. Built from client-side DuckDB queries to a Parquet file containing 14 million rows.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono`}>{children}</body>
    </html>
  )
}
