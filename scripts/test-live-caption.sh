#!/bin/bash

# Test script for live caption endpoint
# Usage: ./scripts/test-live-caption.sh

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="/api/public/live-caption"

echo "========================================"
echo "Call Compass Live Caption API Test"
echo "========================================"
echo "API URL: $API_URL"
echo ""

# Generate a test UUID (for demonstration)
TEST_CALL_ID="550e8400-e29b-41d4-a716-446655440000"
TEST_TOKEN="aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3QgdG9rZW4gZm9yIHRlc3RpbmcgdGhlIENBUFRJT04gYnJpZGdlIQ"

echo "⚠️  Note: These tests use a dummy call ID and token."
echo "For real testing, you need to:"
echo "  1. Create a call in Call Compass"
echo "  2. Generate a real ingest token"
echo "  3. Replace TEST_CALL_ID and TEST_TOKEN below"
echo ""

# Test 1: Valid caption
echo "TEST 1: Valid caption"
echo "---"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"$TEST_CALL_ID\",
    \"ingestToken\": \"$TEST_TOKEN\",
    \"text\": \"This is a test caption from the Zoom meeting.\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null || echo "FAILED: Connection refused"

echo ""
echo ""

# Test 2: Missing token (should fail)
echo "TEST 2: Missing ingest token (should fail with 400)"
echo "---"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"$TEST_CALL_ID\",
    \"text\": \"This should fail\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null || echo "FAILED: Connection refused"

echo ""
echo ""

# Test 3: Invalid token (should fail)
echo "TEST 3: Invalid token (should fail with 401)"
echo "---"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"$TEST_CALL_ID\",
    \"ingestToken\": \"wrong_token_12345678901234567890123456789012\",
    \"text\": \"This should fail\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null || echo "FAILED: Connection refused"

echo ""
echo ""

# Test 4: Empty caption (should fail)
echo "TEST 4: Empty caption (should fail with 400)"
echo "---"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"$TEST_CALL_ID\",
    \"ingestToken\": \"$TEST_TOKEN\",
    \"text\": \"\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null || echo "FAILED: Connection refused"

echo ""
echo ""

# Test 5: Caption with speaker name
echo "TEST 5: Caption with speaker name"
echo "---"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"callId\": \"$TEST_CALL_ID\",
    \"ingestToken\": \"$TEST_TOKEN\",
    \"text\": \"John Smith: I think we should move forward with this proposal.\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null || echo "FAILED: Connection refused"

echo ""
echo ""
echo "========================================"
echo "Test complete"
echo "========================================"
echo ""
echo "To run real tests:"
echo "  1. Start the Call Compass dev server"
echo "  2. Create a call and get an ingest token"
echo "  3. Set environment variables:"
echo "     export TEST_CALL_ID=\"your-uuid-here\""
echo "     export TEST_TOKEN=\"your-token-here\""
echo "  4. Run: $API_URL$ENDPOINT"
