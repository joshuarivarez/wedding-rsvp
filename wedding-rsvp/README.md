# Joshua & Judy Ann — Wedding RSVP

A responsive standalone Angular wedding website, styled in taupe, terracotta, sage, camel, and mocha.

## Run

```sh
npm install
npm start
```

Open http://localhost:4200. `npm run build` creates the production site in `dist/wedding/browser`.

After changing `angular.json` asset settings, restart the preview. If the uploaded logo returns 404 despite a successful build, check for an older preview running on localhost (IPv6) alongside another on 127.0.0.1 (IPv4). Use a single preview process.

`npm run test:ui` starts an isolated preview on port 4300, checks that the preview serves the exact uploaded PNG, and displays it in the header and footer on desktop and mobile. It uses installed Microsoft Edge on Windows; on other platforms install Playwright Chromium with `npx playwright install chromium`.

## Personalize

- Edit names, date, venue, story, and FAQs in `src/app.html`.
- Edit fictional sample invitations in `src/rsvp/mock-invitations.ts`. Keep real guest records on your future API.
- Update the calendar event in `src/main.ts` with the actual venue and UTC times.
- Change palette tokens in `src/styles.css`.
- Replace the remote Unsplash images and Google Fonts with your own assets if desired.
- Replace the six placeholder gallery images and captions in `src/gallery/gallery.component.ts` with your own photos.

## RSVP behavior

The RSVP follows four steps: find an invitation, confirm the household, choose attendance, and confirm the named guests. The checklist only includes invited guests; there is no custom name or plus-one field. Dietary restrictions, food allergies, a song request, and a message are optional. Declines save zero attendees and skip food/song fields.

Try **Juan & Maria Dela Cruz** (2 guests), **Sofia Reyes** (1 guest), or **The Santos Family** (3 guests). Searching **Juan** demonstrates multiple matching invitations. All are fictional mock records. Responses are saved per invitation in browser storage, edits replace the prior response, and confirmation clearly states that nothing has been sent.

The data adapter is separate from the UI. See [API integration](src/rsvp/API-INTEGRATION.md) to connect your API later. `npm run test:ui` includes full RSVP scenarios, missing/ambiguous names, guest counts, decline/edit behavior, storage errors, and mobile layout checks.

Wedding details: Joshua & Judy Ann, February 08, 2027 at 4:00 PM (Asia/Manila), 10 22 Lipa, Alaminos Rd., Lipa City, Batangas. Story, attire, and guest policy copy still need review by the couple. No RSVP deadline or reception schedule has been specified.

Features include a mobile navigation menu, FAQ accordions, calendar download, responsive layouts, hover/entrance animations, and reduced-motion support.
