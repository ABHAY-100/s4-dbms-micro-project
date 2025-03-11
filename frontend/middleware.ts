import { NextResponse, NextRequest } from "next/server";
import { handleAuthRedirect } from "@/middleware/auth";

export function middleware(request: NextRequest) {
  console.log("Middleware running on:", request.nextUrl.pathname);
  const authRedirect = handleAuthRedirect(request);
  if (authRedirect) {
    console.log("Redirecting to:", authRedirect.url);
    return authRedirect;
  }

  console.log("Continuing to next middleware");
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
