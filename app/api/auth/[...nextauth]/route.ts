import { auth } from '../../../../auth';

// Forward all relevant HTTP methods to the NextAuth handler exported from the
// project root `auth.ts`. This creates the App Router API endpoint that
// NextAuth expects (e.g. /api/auth/callback/credentials).
export const GET = auth;
export const POST = auth;
export const PUT = auth;
export const DELETE = auth;
export const PATCH = auth;
export const OPTIONS = auth;
export const HEAD = auth;
