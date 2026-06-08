# Call Compass – Zoom Live Caption Bridge

This Chrome extension captures live captions from Zoom meetings and sends them to Call Compass in real-time.

## Installation (Sideload)

1. **Build/Prepare**: Ensure you have all files in this `chrome-extension/` folder
   - `manifest.json`
   - `content.js`
   - `background.js`
   - `popup.html`
   - `popup.js`
   - `popup.css`

2. **Open Chrome Extensions**:
   - Go to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)

3. **Load Extension**:
   - Click "Load unpacked"
   - Select the `chrome-extension/` folder
   - The extension appears in your extensions list

4. **Verify Installation**:
   - Click the extension icon (puzzle piece) in Chrome toolbar
   - You should see "Call Compass – Live Caption Bridge"

## Usage

### Step 1: Enable Zoom Captions in Call Compass

1. Open a call in Call Compass Live Radar
2. Click the **"Enable Zoom"** button next to the Transcript Source selector
3. Copy the **ingest token** from the modal

### Step 2: Start Capturing in the Extension

1. Join a Zoom meeting in your browser: `https://zoom.us/wc/...`
2. Click the **Call Compass extension icon** in Chrome toolbar
3. Fill in:
   - **Call ID**: The UUID from the Call Compass URL
   - **Ingest Token**: The token you copied in Step 1
   - **Backend URL**: (Leave default unless running locally)
4. Click **"Start Capturing"**
5. Status shows **"✓ Capturing started"** when ready

### Step 3: Speak in the Zoom Meeting

- As Zoom generates captions, the extension captures them
- Captions are sent to the Call Compass backend every 0.5 seconds
- In Call Compass Live Radar, captions appear in the transcript textarea in real-time
- You can immediately click "Analyze Current Moment" to get AI insights

### Step 4: Stop Capturing

- Click **"Stop Capturing"** in the extension popup
- Or close the Zoom meeting

## Troubleshooting

### Captions Not Appearing

**Issue**: Extension captures captions but they don't show in Call Compass.

**Fix**:
1. Verify you're in Zoom web client (`zoom.us/wc/...`), not desktop app
2. Verify Zoom has auto-captions enabled (bottom toolbar: "CC" button)
3. Check browser console for errors: `F12` → Console
4. Verify Call ID and ingest token are correct
5. Check backend URL is correct (default: `https://api.callcompass.app`)

### Token Validation Error

**Issue**: Extension shows `✗ Error: HTTP 401: Invalid token`

**Fix**:
1. Regenerate the token in Call Compass (click "Enable Zoom" again)
2. Paste the new token into the extension
3. Restart capturing

### Extension Not Injecting into Zoom

**Issue**: Extension installed but not capturing captions.

**Fix**:
1. Reload the extension: `chrome://extensions` → find extension → click reload icon
2. Hard-refresh the Zoom tab: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Try a different Zoom meeting URL

## Architecture

```
Zoom Web Meeting (https://zoom.us/wc/...)
    ↓
[content.js] Observes caption DOM
    ↓
[background.js] Queues & batches captions
    ↓
POST /api/public/live-caption
    ↓
Call Compass Backend (validates token, inserts chunk)
    ↓
Supabase Realtime
    ↓
Call Compass Live Radar (appends to transcript)
```

## Limitations (Phase 2A)

- ❌ Desktop Zoom app not supported (web client only)
- ❌ No rate limiting yet (aggressive sending ok for beta)
- ❌ No speaker name extraction (captions sent as-is from Zoom)
- ❌ No error recovery / retry after network failure
- ❌ Token doesn't expire (revoked only when call ends)
- ❌ No persistence (extension loses config on crash)

## Privacy & Security

- **Token**: Ingest token is stored locally in `chrome.storage.local` (encrypted by Chrome)
- **Captions**: Captions are sent to Call Compass backend (not logged permanently)
- **No Data Collection**: Extension doesn't track usage or collect analytics
- **Open Source**: Code is visible in this folder (no hidden requests)

## Development

To modify the extension:

1. Edit the `.js` or `.css` files
2. Go to `chrome://extensions`
3. Click the reload icon for this extension
4. Hard-refresh any Zoom meeting tabs (`Cmd+Shift+R`)

## Reporting Issues

If captions aren't capturing:

1. Check browser console: `F12` → Console tab
2. Look for messages starting with `[caption-bridge]`
3. Report the error message + steps to reproduce
