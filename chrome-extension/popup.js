// Call Compass Caption Bridge - Popup UI

const callIdInput = document.getElementById("callId");
const ingestTokenInput = document.getElementById("ingestToken");
const backendUrlInput = document.getElementById("backendUrl");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDiv = document.getElementById("status");

// Load saved config
chrome.storage.local.get(
  ["callId", "ingestToken", "backendUrl", "isCapturing"],
  (data) => {
    callIdInput.value = data.callId || "";
    ingestTokenInput.value = data.ingestToken || "";
    backendUrlInput.value = data.backendUrl || "https://api.callcompass.app";

    if (data.isCapturing) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      updateStatus("Capturing...");
    }
  }
);

startBtn.addEventListener("click", async () => {
  const callId = callIdInput.value.trim();
  const ingestToken = ingestTokenInput.value.trim();
  const backendUrl = backendUrlInput.value.trim() || "https://api.callcompass.app";

  if (!callId || !ingestToken) {
    updateStatus("⚠ Enter Call ID and Ingest Token");
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(callId)) {
    updateStatus("⚠ Invalid Call ID (not a valid UUID)");
    return;
  }

  // Validate token format
  if (ingestToken.length !== 64) {
    updateStatus("⚠ Token must be 64 characters");
    return;
  }

  // Save config
  chrome.storage.local.set({
    callId,
    ingestToken,
    backendUrl,
    isCapturing: true,
  });

  // Send to background script
  chrome.runtime.sendMessage(
    {
      type: "START_CAPTURE",
      config: { callId, ingestToken, backendUrl },
    },
    (response) => {
      if (response && response.ok) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        updateStatus("✓ Capturing started");
      } else {
        updateStatus("✗ Failed to start");
      }
    }
  );
});

stopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" }, (response) => {
    if (response && response.ok) {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      updateStatus("✓ Capturing stopped");

      chrome.storage.local.set({ isCapturing: false });
    }
  });
});

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "STATUS_UPDATE") {
    updateStatus(message.message);
  }
});

function updateStatus(message) {
  statusDiv.textContent = message;
  statusDiv.style.opacity = "1";

  // Auto-fade after 3 seconds
  setTimeout(() => {
    statusDiv.style.opacity = "0.5";
  }, 3000);
}

// Periodically check status
setInterval(() => {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
    if (response && response.isCapturing) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });
}, 1000);
