import { createFileRoute } from "@tanstack/react-router";
import { verifySignedState } from "@/lib/zoom.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

export const Route = createFileRoute("/api/public/zoom/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error");

        if (oauthError) {
          return redirect(`/zoom/connect?error=${encodeURIComponent(oauthError)}`);
        }
        if (!code || !state) {
          return new Response("Missing code or state", { status: 400 });
        }

        const verified = verifySignedState(state);
        if (!verified.ok) {
          return new Response(`Invalid state: ${verified.reason}`, { status: 400 });
        }

        const clientId = process.env.ZOOM_CLIENT_ID;
        const clientSecret = process.env.ZOOM_CLIENT_SECRET;
        const redirectUri = process.env.ZOOM_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
          return new Response("Zoom OAuth not configured", { status: 500 });
        }

        try {
          // Exchange code for access token (tokens NOT stored)
          const tokenRes = await fetch("https://zoom.us/oauth/token", {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
            }).toString(),
          });
          if (!tokenRes.ok) {
            const txt = await tokenRes.text();
            console.error("[zoom-callback] token exchange failed", tokenRes.status, txt);
            return redirect("/zoom/connect?error=token_exchange_failed");
          }
          const tokenJson = (await tokenRes.json()) as { access_token?: string };
          const accessToken = tokenJson.access_token;
          if (!accessToken) {
            return redirect("/zoom/connect?error=no_access_token");
          }

          // Fetch Zoom user profile
          const meRes = await fetch("https://api.zoom.us/v2/users/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!meRes.ok) {
            const txt = await meRes.text();
            console.error("[zoom-callback] users/me/email failed", meRes.status, txt);
            const detail = encodeURIComponent(txt.slice(0, 200));
            return redirect(`/zoom/connect?error=users_me_failed&status=${meRes.status}&detail=${detail}`);
          }
          const me = (await meRes.json()) as { email?: string };
          const zoomEmail = me.email ?? null;

          // Update profile (tokens discarded)
          const { error: upErr } = await supabaseAdmin
            .from("profiles")
            .update({
              zoom_auth_status: "connected",
              zoom_auth_email: zoomEmail,
              zoom_auth_connected_at: new Date().toISOString(),
            })
            .eq("id", verified.userId);
          if (upErr) {
            console.error("[zoom-callback] profile update failed", upErr);
            return redirect("/zoom/connect?error=profile_update_failed");
          }

          return redirect("/dashboard?zoom=connected");
        } catch (e) {
          console.error("[zoom-callback] unexpected", e);
          return redirect("/zoom/connect?error=unexpected");
        }
      },
    },
  },
});
