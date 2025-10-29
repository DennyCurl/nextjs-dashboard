import NextAuth from 'next-auth';
import { authConfig } from '../../../../auth.config';

// Create a NextAuth handler and export it for the App Router HTTP method
// exports. This matches the expected `(request: Request) => Response` shape
// for `GET`/`POST` etc. and satisfies Next.js type checking.
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as OPTIONS, handler as HEAD };
