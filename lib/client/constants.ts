// App constants and configuration

export const WAITING_STEPS = [
  { id: 'filter', label: 'Cleaning energy...', icon: 'Sparkles' },
  { id: 'analyzer', label: 'Sensing aura...', icon: 'Zap' },
  { id: 'selector', label: 'Shuffling...', icon: 'RefreshCw' },
  { id: 'reader', label: 'Interpreting...', icon: 'Moon' },
] as const;

export const FUN_FACTS = [
  "Did you know? The Death card rarely means physical death. It signifies transformation.",
  "Tarot originated in northern Italy in the 15th century.",
  "The Fool is the only card that is unnumbered (or Zero), representing infinite potential.",
  "Mimi connects with the cosmic energy, please be patient...",
] as const;

export const PACKAGES = [
  { id: 1, price: 99, stars: 10, highlight: false },
  { id: 2, price: 189, stars: 20, highlight: true }, // Recommended
  { id: 3, price: 399, stars: 40, highlight: false },
] as const;