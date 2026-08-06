# Motion System

## Tokens

```
--dur-instant: 100ms
--dur-fast: 150ms
--dur-standard: 220ms
--dur-slow: 320ms
--ease-enter: cubic-bezier(0, 0, 0.2, 1)
--ease-exit: cubic-bezier(0.4, 0, 1, 1)
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
```

## Rules

1. Direct interaction feedback: instant–fast
2. Enter: standard; exit: fast
3. Only `transform` and `opacity` for performance
4. No stagger on long lists
5. `@media (prefers-reduced-motion: reduce)` → durations → 0

## Component specs

### Button press
scale(0.98), 100ms

### Sheet enter
overlay opacity 0→1; panel translateY(16px)→0; standard

### Sheet exit
fast; panel translateY(0)→8px

### Dossier reveal
opacity + slight scale; no blur animation if reduced-motion

### Timer urgent (<10s)
pulse opacity on mono digits only

### Phase transition
fade content 150ms crossfade
