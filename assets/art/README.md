# Falcon art round 1

Sources from 微信小程序美术素材 store; staged for wx-game.

## Layout
- `ui/topbar-cta-spec.jpg` — top bar + primary CTA spec (coins > debt remaining rounds; one primary CTA; disabled state; 16px margin)
- `style/styleboard-v2.jpg` — observe / auction / result three-state board
- `items/band/batch1-sheet.jpg` — band lot contact sheet

Repo-relative paths:
- `assets/art/ui/topbar-cta-spec.jpg`
- `assets/art/style/styleboard-v2.jpg`
- `assets/art/items/band/batch1-sheet.jpg`

## Item IDs
Each id has a normal image and a silhouette. Visibility 0/1 uses the silhouette. Clear view and reveal use the normal image.

- `assets/art/items/band/bike_01.png`
- `assets/art/items/band/bike_01_silhouette.png`
- `assets/art/items/band/case_guitar_01.png`
- `assets/art/items/band/case_guitar_01_silhouette.png`
- `assets/art/items/band/box_scores_01.png`
- `assets/art/items/band/box_scores_01_silhouette.png`
- `assets/art/items/band/crate_cloth_01.png`
- `assets/art/items/band/crate_cloth_01_silhouette.png`
- `assets/art/items/band/speaker_01.png`
- `assets/art/items/band/speaker_01_silhouette.png`

Debt bar semantic: remaining rounds (not calendar date).

# Falcon art round 2

Speaker busts and speech-bubble frames. Paths only; no dialogue copy in this drop.

- `assets/art/speakers/auctioneer_bust.png` — auctioneer half-body, 1024×1024
- `assets/art/speakers/creditor_bust.png` — creditor half-body, 1024×1024
- `assets/art/ui/bubble_auctioneer.png` — auctioneer bubble frame, 1280×720
- `assets/art/ui/bubble_creditor.png` — creditor bubble frame, 1280×720
- `assets/art/rivals/laozhou_speak.png` — Lao Zhou speaking, 1024×1024
- `assets/art/rivals/alan_speak.png` — A Lan speaking, 1024×1024

Path map: `src/features/auction/data/round2-art.js` (`round2Art`).

# Falcon art round 3

P1 feedback beats. Timings and ids live in `src/features/auction/data/round3.js`.

- `assets/art/falcon-art-round3/device/device_upgrade_vfx.png` — flashlight/magnifier flash, info-card outline, level-up arrow
- `assets/art/falcon-art-round3/debt/debt_tick_frames.png` — debt-bar sparkle frames for `sfx_debt_tick`
- `assets/art/falcon-art-round3/accessory/accessory_watch_unlock.png` — stage 0 bare wrist to stage 1 old watch

Drop-in audio (optional): `assets/audio/effects/sfx_debt_tick.wav`. The id is `sfx_debt_tick`. The sparkle still plays if the file is absent.

# Falcon art round 4

Observe-tier guides only. In-game strokes and hotspots are drawn from `src/features/auction/data/observe-tiers.js`. These sheets are not item sprites.

- `assets/art/falcon-art-round4/observe_visibility_tiers.png` — doorway green stroke, silhouette amber stroke, deep light-gray dashed stroke, plus hotzones
- `assets/art/falcon-art-round4/observe_hotzone_rules.png` — clear / silhouette / deep outlines; minimum touch target 44px

TODO: if painted per-item outlines arrive, point `observeArt` at them and swap the stroke helper. Do not feed those pixels into bids.

# Falcon art round 5

Auction-beat reference boards. Timings live in `src/features/auction/data/round5.js`. None of these pixels enter bids.

- `assets/art/falcon-art-round5/bid_button_states.png` — raise button default / pressed / disabled. The live control is drawn from `raiseButtonBeat` fills because this sheet includes captions. TODO: swap in a caption-free 3-state slice and set `useSheet`.
- `assets/art/falcon-art-round5/leader_highlight.png` — crown study. In game the crown stays off (`showCrown: false`); the screen uses a soft glow plus the 「领先」 label.
- `assets/art/falcon-art-round5/pass_wave_frames.png` — abandon wave, three frames, held 1–2s. Crops: `expressionBeat.waveCrops`.
- `assets/art/falcon-art-round5/gavel_pause_compare.png` — pre-hammer pause versus after the strike. Reference only; the 0.4–0.6s hold is drawn in code (scale + vignette) and does not show item grades.

# Falcon art round 6

Reveal-feel reference boards. Timings and hit zones live in `src/features/auction/data/round6.js`. These sheets include captions, so the live screen is drawn from the beat data (`useSheet: false`). None of these pixels enter bids, sale prices, or the collection ledger.

- `assets/art/falcon-art-round6/reveal_flip_frames.png` — tap-to-enlarge, flip, then the readable front. Queue scale rests at 1.15–1.25; the next item takes 300–500ms.
- `assets/art/falcon-art-round6/sell_collect_layout.png` — primary 「卖掉」versus secondary 「收下」, wide gap, separate icon and color.
- `assets/art/falcon-art-round6/rare_sparkle_frame.png` — one rare highlight frame. In game it lasts at most 300ms and does not loop. Normal items draw none.
