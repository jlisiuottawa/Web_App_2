Release 1.4 - EcoBuddy mascot, accessories, streaks, tips, dynamic background

- Leaderboard now promotes the currently-logged-in user to the top if found in the DOM.
- Added EcoBuddy mascot UI using the provided PNG (place at /assets/ecobuddy.png).
- Buyable accessories (hat, sunglasses, scarf) using localStorage to persist purchases and coins wallet.
- Daily login streak system (tracked in localStorage) increments when the user visits on consecutive days.
- Tips panel that rotates daily with helpful energy-saving tips.
- Dynamic background: Earth with orbiting sun and moon that move according to the user's local time of day.
- Added small coin wallet to purchase accessories (initial coins: 200).

Notes for integration:
- Include <link rel="stylesheet" href="/src/mascot.css"> and <script defer src="/src/mascot.js"></script> on pages where you want the mascot and background to appear.
- Add the PNG asset at /assets/ecobuddy.png.

If you want, I can also open a PR instead of pushing to main, or add richer accessory graphics and server-backed persistence.