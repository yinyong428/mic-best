import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Blueprint dark theme
        bg: 'var(--c-bg)',
        text: 'var(--c-text)',
        accent: 'var(--c-accent)',
        'g-50': 'var(--c-g50)',
        'g-100': 'var(--c-g100)',
        'g-200': 'var(--c-g200)',
        'g-300': 'var(--c-g300)',
        'g-400': 'var(--c-g400)',
        'g-500': 'var(--c-g500)',
        'g-600': 'var(--c-g600)',
        'g-700': 'var(--c-g700)',
        'g-800': 'var(--c-g800)',
        'g-900': 'var(--c-g900)',
        'g-950': 'var(--c-g950)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
