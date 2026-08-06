# Foundations — Covert Expedition

## Color (semantic)

| Token | Role |
|-------|------|
| `background` | Page canvas (kraft paper) |
| `surface` / `surface-elevated` | Cards, panels |
| `foreground` / `muted` | Text hierarchy |
| `accent` | Primary action (stamp red) |
| `ink` | Mission headings (navy) |
| `stamp` | Decorative stamp accent |
| `success` / `warning` / `danger` / `info` | Semantic states |
| `primary` | Alias → `accent` (legacy compat) |
| `card` | Alias → `surface-elevated` |

## Typography

- **Sans** (`font-sans`): Inter — body, UI
- **Display** (`font-display`): Space Grotesk — headings, mission titles
- **Mono** (`font-mono`): JetBrains Mono — room codes, status labels

Scale: `text-xs` → `text-5xl`. Headings dùng `font-display font-bold`.

## Spacing

`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64` — không dùng giá trị lẻ.

## Radius

- `radius-sm` (8px): controls
- `radius-md` (12px): inputs
- `radius-lg` (16px): cards
- `radius-xl` (20px): panels
- `radius-full`: pills, avatars

## Shadow / Elevation

- `shadow-sm`: raised surface
- `shadow-md`: dropdown
- `shadow-lg`: modal

## Z-index

`sticky: 10, dropdown: 20, overlay: 40, dialog: 50, toast: 60`

## Motion

See `MOTION_SYSTEM.md`. Durations: instant 100ms, fast 150ms, standard 220ms, slow 320ms.
