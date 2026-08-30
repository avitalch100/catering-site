import { NextResponse } from "next/server";

// מגן על כל /admin/* מלבד עמוד ההתחברות עצמו.
// הבדיקה: יש עוגיית אימות תקינה שתואמת לסיסמה שהוגדרה במשתנה הסביבה ADMIN_PASSWORD.
export function middleware(req) {
  const { pathname } = req.nextUrl;

  const isAdminPath = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (!isAdminPath) return NextResponse.next();

  const cookie = req.cookies.get("cc_admin_auth")?.value;
  if (!cookie || cookie !== process.env.ADMIN_PASSWORD) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
