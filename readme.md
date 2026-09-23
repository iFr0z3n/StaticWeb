# Frostbyte IT

A dependency-free static site for https://frostbyte.it, deployed from `src/` by the existing Azure Static Web Apps workflow.

## Local preview

Run `python3 -m http.server 8000 --directory src` from the repository root and open http://localhost:8000. No build step or external font/icon/CDN runtime is required.

## Content and contact

- `src/index.html`: about, service details, game enquiries, status, getting started, FAQ and contact.
- `src/styles.css`: responsive dark/cyan design, including the decorative server illustration.
- `src/app.js`: mobile navigation, email copying, enquiry subjects and optional status feed.
- Contact links open the visitor's email app. The site does not submit a form or claim a message was sent.
- Existing game names, AMP URL and contact address are retained. Game availability and pricing are confirmed by enquiry. Unverified uptime, latency and 24/7 support claims have been removed.

## Public server status

The old client made an authenticated request directly to an unfinished AMP endpoint. The replacement defaults to an explicit “not connected” state. It never supplies fake live data or exposes AMP credentials.

To enable public status, provide a **same-origin, public, read-only** endpoint (for example an independently configured Azure Function or a periodically published JSON file), then set `statusEndpoint` in `src/config.js` to its path. The endpoint must return:

```json
{
  "updatedAt": "2026-09-23T12:00:00Z",
  "servers": [
    {
      "name": "Community world",
      "game": "Minecraft",
      "status": "online",
      "players": 0,
      "maxPlayers": 20
    }
  ]
}
```

This is a schema example, not real server data. Required fields: ISO `updatedAt`, `servers` array, each server's nonempty `name` and `status` (`online`, `offline`, `unknown`). Optional: `game`, nonnegative integer `players`, `maxPlayers`. Empty arrays are supported. Data older than five minutes displays unknown status; invalid data, network errors and eight-second timeouts display an unavailable state. Refresh is manual. Remote values are rendered as text, never HTML.

Keep AMP authentication entirely on the backend. Only publish server information intended for visitors, and never admin session tokens, credentials, private IPs or administrative endpoints. Provisioning that backend requires the owner's AMP configuration and Azure access and is not part of this frontend change.

## Deployment

The existing workflow deploys `main` to production and creates Azure preview environments for pull requests if enabled in the Azure resource. Review the PR preview before merging. No Azure resource or secret changes are required for this static frontend.
