import { Sparkles, Zap, RefreshCw, Moon } from '@/components';

export const WAITING_STEPS = [
  { id: 'filter', label: 'Cleaning energy...', Icon: Sparkles },
  { id: 'analyzer', label: 'Sensing aura...', Icon: Zap },
  { id: 'selector', label: 'Shuffling...', Icon: RefreshCw },
  { id: 'reader', label: 'Interpreting...', Icon: Moon },
] as const;

export const FUN_FACTS = [
  "Did you know? The Death card rarely means physical death. It signifies transformation.",
  "Tarot originated in northern Italy in the 15th century.",
  "The Fool is the only card that is unnumbered (or Zero), representing infinite potential.",
  "Mimi connects with the cosmic energy, please be patient...",
] as const;