import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback handler — PKCE code exchange (초대, 비밀번호 재설정 등).
 *
 * 클라이언트에서 code를 교환하면 Set-Cookie 헤더가 브라우저로 전달되지 않아
 * 서버 컴포넌트가 세션을 인식하지 못한다. Route Handler에서 교환하면
 * cookies().set()이 실제 Set-Cookie 헤더로 내려가므로 다음 요청부터 세션이 확실히 적용된다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Vercel은 내부적으로 다른 hostname을 사용하므로 request.url의 origin이 틀릴 수 있다.
  // X-Forwarded-Host 헤더 또는 환경변수로 실제 origin을 결정한다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/accept-invite";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Route Handler에서는 cookies().set() 가능 — Set-Cookie 헤더로 전달됨
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/accept-invite?error=${encodeURIComponent(error.message)}&method=code`,
    );
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/accept-invite?error=${encodeURIComponent(error.message)}&method=token_hash`,
    );
  }

  // 파라미터 자체가 없는 경우 — URL에 어떤 파라미터가 왔는지 표시
  const allParams = searchParams.toString();
  return NextResponse.redirect(
    `${origin}/accept-invite?error=${encodeURIComponent("no_params: " + allParams)}`,
  );
}
