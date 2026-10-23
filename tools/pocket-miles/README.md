# Pocket Miles

A personal, installable merchant-to-card app at https://joellimrl.github.io/pocket-miles/. GitHub Pages serves the static app; Streetbot on Fly stores the private wallet and merchant book in MongoDB. No ChatGPT sign-in or hosting is involved.

## First connection

After deploying the matching Streetbot feature:

1. Send /pocket in your private chat with Streetbot. Only the bot owner can issue a connection.
2. Open the app and paste the connection key. Select your cards in Wallet and save.
3. Add your regular merchants, with a category and usual payment route.
4. Next time, type the merchant name. An amount is optional.
5. On another device, request another /pocket key. The same MongoDB notebook loads there.
6. Add the HTTPS app to your home screen using Safari’s Share menu on iOS or Chrome’s Install/Add to home screen option on Android.

Keys last 90 days. Request another when one expires. The reply has a button to revoke that specific key. Disconnecting removes the key and cached notebook from that browser; it does not revoke other devices or delete the server copy. Keys are never embedded in public source, URLs, or backups. Keep the bot’s connection message private.

## Behaviour and limits

- Select any subset of the four supported cards: HSBC Revolution, Citi Rewards, KrisFlyer UOB and Trust Freedom. Amaze is an optional paid route with Citi.
- Saved merchant details override name-based suggestions. Different branches and online routes can be saved separately; ambiguous matches require selection.
- Merchant suggestions are assumptions, not live MCC lookup. Notes/MCC text are reference only; the selected category drives the result.
- A quick choice compares earn rates among eligible selected cards without an additional payment/FX fee. With an amount, estimates account for modelled rounding and manually entered bonus allowances. Bank FX fees, transfer fees, fuel discounts and promotional targets are not fully optimised.
- Bonus caps are manual. Searches are not recorded spending and do not deduct allowances. Stale period allowances are flagged.
- Rules are a snapshot dated 23 October 2026. This is not an automatic rewards-monitoring service. Sources are linked in “How it decides.”
- The app is a single owner notebook, not a multiuser service. Maximum 500 merchant entries. Export/import a JSON backup from Places.
- An authenticated device retains a local copy for offline lookups. Saving requires a live backend. Conflicting writes return a refresh prompt instead of silently overwriting another device.
- Close all open app windows and reopen after a new frontend release so an updated service worker can activate.

## Local development

Node 22.9+:

    cd tools/pocket-miles
    npm ci --ignore-scripts
    npm test
    npm run dev

Open http://127.0.0.1:8741/pocket-miles/. This loopback-only preview uses a local JSON file under ignored data/ and needs no connection key. It never calls Streetbot, Telegram or MongoDB. It is a development preview, not phone hosting.

Production assets are in ../../pocket-miles/. No runtime npm dependencies are shipped. The root build-site.mjs allowlist includes the app and excludes tooling, tests, package files and preview data. The existing Pages workflow runs tests before publishing.

## Updating card rules

Edit pocket-miles/rules.js and its source links/date, then update meaningful boundary tests in tests/rules.test.mjs. Wallet-specific selection and quick comparison logic is in recommend.js. Merchant schema validation is in merchants.js.

When adding a card or category, also update the backend validation modules under Streetbot feat/pocketMiles/shared. They are copies of rules.js, recommend.js and merchants.js with their relative .js imports changed to .mjs. Pure reward-rate changes only affect frontend recommendations; new schema/card/category values require matching backend deployment.

Deploy the backend before publishing a frontend that uses new schema values. Test caps, rounding, exclusions, online versus physical payments, and the documented effective date rather than assuming headline rates apply universally.

## Validation performed

28 isolated tests cover reward boundaries, wallet filtering, saved-route matching, validation, mocked sync/auth/offline/conflict handling, and DOM interactions including new merchant save/recall and HTML escaping. No real Telegram messages or MongoDB writes occur in the tests.

The local HTTP preview and production build are checked separately. Actual phone installation and real multi-device sync require the deployed app and an owner-issued key; a DOM test is not a rendered mobile-browser test.
