# Sound Effects — Guess Who I Am

Place the following `.mp3` files in this directory (`public/sounds/`).

| File | Trigger | Suggested source |
|---|---|---|
| `heart-lost.mp3` | Wrong answer (lose 1 heart) | [freesound.org #131657](https://freesound.org/people/fins/sounds/146718/) |
| `hint-unlock.mp3` | Hint becomes available | Short "ding" or notification chime |
| `danger-alert.mp3` | Hearts ≤ 3 (fires once per word) | Low warning beep |
| `success.mp3` | Correct answer | Cheerful success jingle |
| `game-over.mp3` | All 9 hearts lost | Short "fail" fanfare |

## Quick free sources

- https://freesound.org (CC0 licence — free for any use)
- https://pixabay.com/sound-effects/

## Fallback behaviour

`useSoundEffects` wraps every `.play()` call in a try/catch and sets
`volume = 0.6`. If any file is missing the game continues silently.

## File requirements

- Format: **MP3** (widest browser support)
- Duration: ≤ 2 seconds each
- Volume: normalised to around −14 LUFS so the 0.6 JS volume sounds balanced
