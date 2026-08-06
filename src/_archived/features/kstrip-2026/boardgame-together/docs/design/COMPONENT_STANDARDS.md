# Component Standards

All primitives live in `src/components/ui/`. Import from `@/components/ui`.

## Button

Variants: `primary` | `secondary` | `tertiary` | `destructive` | `ghost` | `success`
Sizes: `sm` | `md` | `lg`
States: loading (spinner), disabled, icon left/right

## Input / Select / Checkbox

Wrapped in `Field` with label + error message. Min height 44px on mobile.

## Card / Panel

`Card` — bordered surface. `Panel` — section with optional header.

## Sheet

Bottom sheet on mobile, centered modal on desktop. Focus trap, Esc to close, focus return.

## TicketCard

Boarding-pass layout for room codes. Notch + dashed perforation.

## Dossier

Role reveal card — hold-to-reveal classified content.

## Stamp

Rotated label badge: CLASSIFIED, DECLASSIFIED, SUSPECT, etc.

## EmptyState / ErrorState

Icon + title + description + optional CTA. Errors always include recovery action.

## Usage rules

- One primary CTA per screen section
- Destructive only for irreversible actions
- Don't use Card for every list item — use list rows
