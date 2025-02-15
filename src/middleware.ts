import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sitemap.xml", // Allow sitemap access
  "/robots.txt", // Allow robots.txt access
]);
const isPublicTokenRoute = createRouteMatcher([
  "/api/token",
  "/api/sessions/create",
  "/api/sessions/end",
  "/api/events/log",
]);

export default clerkMiddleware(async (auth, request) => {
  const isApiRoute = request.url.includes("/api/");

  if ((isApiRoute || !isPublicRoute(request)) && !isPublicTokenRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
