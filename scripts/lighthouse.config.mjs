export const pages = [
  { name: 'inicio', path: '/' },
  { name: 'detalhe', path: '/nft/emerald' },
]

export const profiles = {
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
}

export const targets = { performance: 90, accessibility: 95, 'best-practices': 100, seo: 100 }
