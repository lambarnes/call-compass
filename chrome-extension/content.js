// Call Compass Caption Bridge - Content Script
// Observes Zoom web meeting captions and sends them to background script

let lastSeenCaption = "";
let isObserving = false;

function startCaptionObserver() {
  if (isObserving) return;

  const observer = new MutationObserver(() => {
    const captionText = getCaptionText();

    // Only send if caption changed (deduplicate)
    if (captionText && captionText !== lastSeenCaption) {
      lastSeenCaption = captionText;

      chrome.runtime.sendMessage(
        {
          type: "CAPTION_CHANGED",
          text: captionText,
          timestamp: new Date().toISOString(),
        },
        (response) => {
          // Optional: log response for debugging
          if (chrome.runtime.lastError) {
            console.warn("[caption-bridge] sendMessage failed:", chrome.runtime.lastError);
          }
        }
      );
    }
  });

  // Observe entire document for caption changes
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  isObserving = true;
  console.log("[caption-bridge] caption observer started");
}

function stopCaptionObserver() {
  isObserving = false;
  lastSeenCaption = "";
  console.log("[caption-bridge] caption observer stopped");
}

function getCaptionText() {
  // Try multiple selectors (Zoom updates UI periodically)
  const selectors = [
    '[role="complementary"] .zm-caption-text',
    '[data-testid="caption-box"] .caption-text',
    '.zm-video-footer-caption-text',
    '[class*="caption"][class*="text"]',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim() || "";
        if (text.length > 0) {
          return text;
        }
      }
    } catch (e) {
      // Selector error, try next one
    }
  }

  return "";
}

// Detect if we're in a Zoom meeting
function isInZoomMeeting() {
  return window.location.hostname.includes("zoom.us") && window.location.pathname.includes("/wc/");
}

// Start observer if in Zoom meeting
if (isInZoomMeeting()) {
  startCaptionObserver();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    startCaptionObserver();
    sendResponse({ ok: true });
  } else if (message.type === "STOP_CAPTURE") {
    stopCaptionObserver();
    sendResponse({ ok: true });
  }
});
