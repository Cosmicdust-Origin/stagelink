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
  const { searchParams, origin } = new URL(request.url);
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
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 교환 실패 시 에러 파라미터와 함께 리다이렉트
  return NextResponse.redirect(`${origin}/accept-invite?error=invalid_link`);
}
