export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/api/apps/:path*", "/api/generate/:path*"],
};