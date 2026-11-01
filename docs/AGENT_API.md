# Agent API v1

## Script contract

`version` must equal `1`. `title` is optional (max 120 characters). `segments` contains 1–100 items; total text is capped at 20,000 characters. Unknown fields are dropped.

Each segment:

| Field | Default | Range / meaning |
|---|---|---|
| `text` | required | Nonblank string, max 2,000 characters; rendered as text, never HTML |
| `expression` | `neutral` | `neutral`, `smile`, `laugh`, `serious`, `frown`, `angry` |
| `intensity` | `0.8` | 0–1 |
| `rate` | `1` | 0.5–2, system TTS only |
| `pitch` | `1` | 0.5–2, system TTS only |
| `pauseMs` | `350` | 0–5,000, gap after segment |
| `durationMs` | max(1400, text.length × 160) | 300–120,000; silent/audio timeline only, not TTS duration |

With system speech, real utterance completion determines the next segment. With imported audio, segments form one fixed timeline: `durationMs` + `pauseMs`. Audio continues through pauses. If audio outlasts the script, captions clear while audio continues; if the script outlasts audio, playback ends with the audio.

## Methods

Available after module load on `window.avatarAgent`:

- `load(script)` validates and clones input, stops previous playback, returns normalized script. Invalid input leaves the current script and playback unchanged.
- `play({mode:'speech'|'audio'|'silent'})` starts from the beginning; Promise resolves when playback is started, not finished.
- `pause()`, `resume()` (Promise), `stop()`.
- `status()` returns state, segment index, mode, title, mouth amount.
- `getScript()` returns a clone of loaded script.
- `setExpression(name, intensity)` previews a pose. Scheduled segment changes can replace it.
- `loadAudio(file)` accepts a browser File object, max 100 MB. File bytes stay in browser memory.

The browser can require a user gesture before TTS/audio playback. An Agent should prepare the script, then let the user press Play if autoplay is blocked. The API does not bypass browser security.

## Events

Listen on `window`:

- `avatar:ready`: `{version:1}`
- `avatar:state`: playback status; `state` is `idle`, `playing`, `paused`, `ended`
- `avatar:segment`: `{segment,index}`; segment may be null during an audio gap
- `avatar:result`: success or error of a command event

Send data-only commands:

```js
window.dispatchEvent(new CustomEvent('avatar:command', {
  detail: { command: 'load', script: myScript }
}));
window.dispatchEvent(new CustomEvent('avatar:command', {
  detail: { command: 'play', options: { mode: 'silent' } }
}));
```

Supported command names: `load`, `run` (load + play), `play`, `pause`, `resume`, `stop`. Unsupported commands and malformed JSON are rejected. The event API is same-page only, not a cross-origin `postMessage` receiver. An optional loopback HTTP bridge is described below.

## Agent-driven browser example

After the page has loaded in a browser automation session:

```js
await page.waitForFunction(() => Boolean(window.avatarAgent));
await page.evaluate(script => {
  window.avatarAgent.load(script);
}, generatedScript);
await page.getByRole('button', {name:'开始口播'}).click();
```

In silent automated tests, `await page.evaluate(() => window.avatarAgent.play({mode:'silent'}))` is sufficient. Real TTS and recorded audio should be accepted on the target OS/device; a synthetic test does not establish voice availability or lip-sync accuracy.

## Optional local HTTP bridge

Start `npm run agent`, then open http://127.0.0.1:4173 in one browser tab. The bridge uses server-sent events to that tab. It rejects a second presenter connection, to avoid controlling the wrong tab. Start `npm start` instead to leave HTTP control disabled.

- `GET /api/status`: whether a presenter tab is connected and count of accepted commands.
- `POST /api/commands`: application/json command from the whitelist above.
- HTTP mode permits `speech` or `silent`; local audio files must be chosen in the browser.
- Response `202` means delivered, not executed successfully or finished. Read UI state / browser events to confirm.
- No browser tab: `409`. Invalid data: `400`. Payload above 256 KB: `413`. Non-JSON: `415`.
- A running request does not grant microphone/camera permissions; neither is used.

```sh
curl http://127.0.0.1:4173/api/status
curl -X POST http://127.0.0.1:4173/api/commands -H 'Content-Type: application/json' -d '{"command":"stop"}'
```

**Security boundary:** only trusted local processes. There is no authentication token; anyone who can run a local process can control this local presenter while the opt-in bridge is running. It must not be exposed through tunnels or proxies. Control mode refuses non-loopback HOST values, validates the socket peer and Host header, and rejects cross-origin requests. The ordinary static preview server can use HOST for development, but never with control mode. Close the server to revoke control. The bridge is not enabled on static hosting.
