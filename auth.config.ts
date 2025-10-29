import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // The `authorized` callback must return a boolean indicating whether the
    // current request is authorized. Returning a Response (eg. using
    // `Response.redirect`) from this callback causes runtime errors like
    // "NextResponse.next() was used in a app route handler". Keep the logic
    // limited to boolean checks and perform redirects elsewhere (middleware
    // or client-side navigation).
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      // Only allow access to dashboard routes when logged in
      if (isOnDashboard) {
        return isLoggedIn;
      }
      // For all other routes allow access
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;