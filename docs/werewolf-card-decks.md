# Werewolf card artwork

In the host lobby, **Bộ thẻ** offers Classic and **Ma Sói - Vân Sơn 26 - 28/9/2026**.
The selection applies to the entire room: role setup thumbnails, the host board,
and each player's private card. It changes artwork only, not role counts, role
IDs, factions, dealing, or game rules.

The existing MongoDB room stores `cardDeck` (`classic` or `van-son-2026`). This
extends the existing board-game-room domain described in coding standards §11.1;
no migration or seed is needed. Missing values fall back to Classic. Only the
host can change the deck, and only in the lobby. The setting survives reloads,
redeals, and returning to the lobby for the lifetime of the room.

`PATCH /api/ma-soi/rooms/:code/roles` accepts `token` with `roleCounts`, `cardDeck`,
or both. An artwork-only update preserves the current role counts; a counts-only
update preserves the artwork. Admin test-room commands use the same service and
validation.

## Artwork

`public/board-game/ma-soi/van-son-2026/<roleId>.webp` contains all 17 user-approved
cards generated in the design conversation. Nine use the supplied portraits
(seer, bodyguard, hunter, cupid, elder, two_sisters, three_brothers, werewolf,
wolf_mute); the other eight use fictional characters. The completed replacement
Hai Chị Em card is included, not the interrupted first attempt.

Assets are 960 × 1440 WebP, at most 300,000 bytes each. The original Classic
artwork and shared face-down card remain in place. `config/cardDecks.ts` resolves
the image for each role and deck; the asset unit test checks coverage and size.

The Vân Sơn images already contain Vietnamese titles and rules, so the private
card omits the visual gradient/text overlay. Localized role text stays available
to screen readers only while the card is revealed. Both decks retain hold-to-view
privacy; releasing the pointer/key or losing focus conceals the card. The card's
2:3 ratio is preserved on short mobile viewports so printed rules are not cropped.

The settings description explains that the event cards contain Vietnamese text,
including when the rest of the interface is in English.
