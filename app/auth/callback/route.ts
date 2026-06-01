import { NextResponse } from "next/server";

import { createSessionClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }

    console.error("Auth callback failed:", error);
  }

  const errorUrl = new URL("/forgot-password", requestUrl.origin);
  errorUrl.searchParams.set("error", "invalid_reset_link");
  return NextResponse.redirect(errorUrl);
}
