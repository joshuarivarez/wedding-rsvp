# Connecting the RSVP API

The current flow uses fictional invitations and browser-only storage. `MockRsvpGateway` is registered under the `RSVP_GATEWAY` injection token in `src/main.ts`.

Implement `RsvpGateway` from `rsvp.models.ts` and replace that provider with your API-backed class. The component only calls:

- `findInvitations(name)` → matching `Invitation[]`, including each canonical invited guest’s ID, name, relationship label, and the reserved count derived from `guests.length`.
- `submit(response)` → `RsvpReceipt`, resolved only after the API has successfully saved the response.

Use `mode: 'live'` in the gateway and successful receipt to remove the sample-invitation notice and show “Your RSVP has been received.” Keep the mock provider until a real API is connected.

The search field calls `findInvitations` after a short debounce to populate its autocomplete menu, and calls it again on an explicit search. Your API should support prefix matching from three characters, cap the number of matches, rate-limit requests, and return only the invitation label and guest count needed for suggestions. Do not return private guest details until your identity rules allow them.

The API must enforce that selected guest IDs belong to the invitation, reject duplicate or unlisted IDs, require at least one attendee for acceptance, and use zero attendees for a decline. The mock gateway enforces these rules too, but browser checks are not a security boundary. Keep real invitation records on the server, not in the frontend bundle. Name lookup and the “Yes, that’s us” step confirm the displayed invitation; they do not prove ownership. If identity verification is needed, have your API require a private invitation code or link and retain its scoped authorization in the gateway.

Save one response per invitation, updating it on subsequent submissions. Return errors without resolving the receipt so the form can preserve selections and offer retry. The message is optional (blank or omitted) and limited to 1000 characters.

Mock responses use localStorage key `wedding-rsvp:mock:v1`. The prior free-name demo key is deliberately separate and is never treated as an authorized invitation response.
