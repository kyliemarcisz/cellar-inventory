export type ThemeConfig = {
  name: string
  tagline: string
  preview: { bg: string; accent: string; text: string; muted: string; card: string }
  vars: Record<string, string>
}

export const THEMES: Record<string, ThemeConfig> = {
  cellar: {
    name: 'Cellar',
    tagline: 'Warm Tuscan',
    preview: { bg: '#F5EFE0', accent: '#6B2737', text: '#1E1410', muted: '#8A9167', card: '#EAE0CE' },
    vars: {},
  },
  blanc: {
    name: 'Blanc',
    tagline: 'Clean & minimal',
    preview: { bg: '#F9F9F7', accent: '#1A1A1A', text: '#1A1A1A', muted: '#8A8A88', card: '#EBEBEA' },
    vars: {
      '--cream': '#F9F9F7',
      '--cream-dark': '#EBEBEA',
      '--wine': '#1A1A1A',
      '--wine-dark': '#080808',
      '--wine-mid': '#3A3A3A',
      '--gold': '#C8C8C4',
      '--terra': '#8A8A88',
      '--text': '#1A1A1A',
      '--muted': '#8A8A88',
    },
  },
  midnight: {
    name: 'Midnight',
    tagline: 'Dark & dramatic',
    preview: { bg: '#141018', accent: '#C4A882', text: '#EAE4D8', muted: '#706A5C', card: '#1E1828' },
    vars: {
      '--cream': '#141018',
      '--cream-dark': '#1E1828',
      '--wine': '#C4A882',
      '--wine-dark': '#0D0B10',
      '--wine-mid': '#2A2238',
      '--gold': '#C4A882',
      '--terra': '#C1714F',
      '--text': '#EAE4D8',
      '--muted': '#706A5C',
    },
  },
  grove: {
    name: 'Grove',
    tagline: 'Earthy & organic',
    preview: { bg: '#F0EDE6', accent: '#4A6741', text: '#1A2418', muted: '#7A8A6A', card: '#E0DDD4' },
    vars: {
      '--cream': '#F0EDE6',
      '--cream-dark': '#E0DDD4',
      '--wine': '#4A6741',
      '--wine-dark': '#1A2418',
      '--wine-mid': '#2E4428',
      '--gold': '#C1714F',
      '--terra': '#C1714F',
      '--text': '#1A2418',
      '--muted': '#7A8A6A',
    },
  },
  ember: {
    name: 'Ember',
    tagline: 'Bold & warm',
    preview: { bg: '#FDF6ED', accent: '#B85C28', text: '#200E04', muted: '#9A7A5A', card: '#F0E4CF' },
    vars: {
      '--cream': '#FDF6ED',
      '--cream-dark': '#F0E4CF',
      '--wine': '#B85C28',
      '--wine-dark': '#200E04',
      '--wine-mid': '#5A2810',
      '--gold': '#E8A838',
      '--terra': '#E8A838',
      '--text': '#200E04',
      '--muted': '#9A7A5A',
    },
  },
  coast: {
    name: 'Coast',
    tagline: 'Fresh & airy',
    preview: { bg: '#F3F7FA', accent: '#2E5F8A', text: '#081828', muted: '#7A9AAA', card: '#E2EDF5' },
    vars: {
      '--cream': '#F3F7FA',
      '--cream-dark': '#E2EDF5',
      '--wine': '#2E5F8A',
      '--wine-dark': '#081828',
      '--wine-mid': '#1A3A58',
      '--gold': '#8AB4C8',
      '--terra': '#5A9AB8',
      '--text': '#081828',
      '--muted': '#7A9AAA',
    },
  },
}

export const THEME_KEYS = Object.keys(THEMES)
