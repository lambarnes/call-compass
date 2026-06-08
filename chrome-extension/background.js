// Call Compass Caption Bridge - Background Script
// Queues captions and sends them to backend endpoint

let captionQueue = [];
let lastSentTime = 0;
let isCapturing = false;
let config = {
  callId: "",
  ingestToken: "",
  backendUrl: "https://api.callcompass.app",
};

let flushTimeoutId = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CAPTION_CHANGED" && isCapturing) {
    captionQueue.push({
      text: message.text,
      timestamp: message.timestamp,
    });

    scheduleFlush();
    sendResponse({ queued: true });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    config = message.config;
    isCapturing = true;
    captionQueue = [];
    sendResponse({ ok: true, message: "Capturing started" });
  } else if (message.type === "STOP_CAPTURE") {
    isCapturing = false;
    captionQueue = [];
    if (flushTimeoutId) clearTimeout(flushTimeoutId);
    sendResponse({ ok: true, message: "Capturing stopped" });
  } else if (message.type === "GET_STATUS") {
    sendResponse({
      isCapturing,
      config,
      queueLength: captionQueue.length,
    });
  }
});

function scheduleFlush() {
  if (flushTimeoutId) clearTimeout(flushTimeoutId);

  // Flush after 0.5 seconds (or when queue reaches 5 captions)
  if (captionQueue.length >= 5) {
    flushQueue();
  } else {
    flushTimeoutId = setTimeout(flushQueue, 500);
  }
}

function flushQueue() {
  if (!isCapturing || captionQueue.length === 0 || !config.callId || !config.ingestToken) {
    return;
  }

  const now = Date.now();
  const minIntervalMs = 100; // Min 100ms between sends to avoid overwhelming backend

  if (now - lastSentTime < minIntervalMs) {
    scheduleFlush();
    return;
  }

  const batch = captionQueue.shift();

  sendCaptionToBackend(batch)
    .then((response) => {
      lastSentTime = Date.now();
      notifyPopupStatus(`✓ Sent (${response.chunkId?.slice(0, 8) || "OK"})`);

      if (captionQueue.length > 0) {
        scheduleFlush();
      }
    })
    .catch((error) => {
      console.error("[caption-bridge] send failed:", error);
      notifyPopupStatus(`✗ Error: ${error.message}`);

      // Re-queue the batch if it was an error
      captionQueue.unshift(batch);

      // Retry after delay
      if (flushTimeoutId) clearTimeout(flushTimeoutId);
      flushTimeoutId = setTimeout(flushQueue, 2000);
    });
}

function sendCaptionToBackend(batch) {
  if (!batch || !batch.text) {
    return Promise.reject(new Error("Empty caption"));
  }

  const url = `${config.backendUrl}/api/public/live-caption`;
  const payload = {
    callId: config.callId,
    ingestToken: config.ingestToken,
    text: batch.text,
    timestamp: batch.timestamp,
  };

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new Error(`HTTP ${res.status}: ${text}`);
      });
    }
    return res.json();
  });
}

function notifyPopupStatus(message) {
  chrome.runtime.sendMessage({ type: "STATUS_UPDATE", message }, (response) => {
    if (chrome.runtime.lastError) {
      // Popup not open, ignore
    }
  });
}
