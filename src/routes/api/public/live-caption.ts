import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { validateIngestToken } from "@/lib/live-caption.server";

const MAX_SESSION_TEXT = 50000;
const MAX_CAPTION_LENGTH = 1000;

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function isValidToken(token: string): boolean {
  return token.length === 64 && /^[A-Za-z0-9_-]+$/.test(token);
}

export const Route = createFileRoute("/api/public/live-caption")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { callId, ingestToken, text, timestamp } = body;

          // Input validation
          if (!callId || !isValidUUID(callId)) {
            return new Response(
              JSON.stringify({ error: "Invalid callId" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!ingestToken || !isValidToken(ingestToken)) {
            return new Response(
              JSON.stringify({ error: "Invalid token format" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!text || text.length === 0 || text.length > MAX_CAPTION_LENGTH) {
            return new Response(
              JSON.stringify({ error: "Caption text out of range" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Validate token against call
          const validated = await validateIngestToken(
            supabaseAdmin,
            callId,
            ingestToken
          );

          if (!validated.valid) {
            return new Response(
              JSON.stringify({ error: validated.error || "Invalid token" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // Insert transcript chunk
          const { data: chunk, error: insertErr } = await supabaseAdmin
            .from("transcript_chunks")
            .insert({
              call_id: callId,
              user_id: validated.userId,
              transcript_text: text.trim(),
              source: "zoom_transcript_future",
              created_at: timestamp || new Date().toISOString(),
            })
            .select()
            .single();

          if (insertErr) {
            console.error("[live-caption] chunk insert failed", insertErr);
            return new Response(
              JSON.stringify({ error: "Failed to store caption" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Fetch existing session text
          const { data: call, error: fetchErr } = await supabaseAdmin
            .from("calls")
            .select("transcript_session_text")
            .eq("id", callId)
            .single();

          if (fetchErr) {
            console.error("[live-caption] fetch session text failed", fetchErr);
            return new Response(
              JSON.stringify({ error: "Failed to fetch call" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Append caption to session text
          let updatedText = (call?.transcript_session_text || "").trim();
          if (updatedText.length > 0) {
            updatedText += "\n" + text.trim();
          } else {
            updatedText = text.trim();
          }

          // Trim if exceeds limit
          if (updatedText.length > MAX_SESSION_TEXT) {
            updatedText = updatedText.slice(updatedText.length - MAX_SESSION_TEXT);
          }

          // Update session text
          const { error: updateErr } = await supabaseAdmin
            .from("calls")
            .update({ transcript_session_text: updatedText })
            .eq("id", callId);

          if (updateErr) {
            console.error("[live-caption] update session text failed", updateErr);
            // Don't fail the request; chunk was inserted successfully
          }

          return new Response(
            JSON.stringify({ chunkId: chunk.id, success: true }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[live-caption] unexpected error", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
