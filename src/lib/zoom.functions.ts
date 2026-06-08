import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startZoomOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { buildSignedState } = await import("./zoom.server");
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;
    if (!clientId) throw new Error("ZOOM_CLIENT_ID is not configured");
    if (!redirectUri) throw new Error("ZOOM_REDIRECT_URI is not configured");

    const state = buildSignedState(context.userId);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    return { url: `https://zoom.us/oauth/authorize?${params.toString()}` };
  });
