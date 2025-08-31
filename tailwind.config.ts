import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
