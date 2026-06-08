-- Migration: Add live transcript ingest token support
-- Phase 2A: Chrome Extension Live Caption Bridge
-- Date: 2026-06-08

-- Add columns to calls table for live caption ingestion
ALTER TABLE calls ADD COLUMN live_ingest_token_hash VARCHAR(64) UNIQUE NULL;
ALTER TABLE calls ADD COLUMN live_transcript_enabled BOOLEAN DEFAULT FALSE;

-- Index for fast token lookup during caption ingestion
CREATE INDEX idx_calls_live_ingest_token_hash ON calls(live_ingest_token_hash)
WHERE live_ingest_token_hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN calls.live_ingest_token_hash IS 'SHA256 hash of the live ingest token (plaintext never stored)';
COMMENT ON COLUMN calls.live_transcript_enabled IS 'Flag indicating if live transcript via extension is enabled for this call';
