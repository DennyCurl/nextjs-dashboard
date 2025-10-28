import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    // preserve any existing callbacks from authConfig and ensure session contains user.id
    ...(authConfig.callbacks ?? {}),

    // Ensure JWT contains user id and session exposes it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt(params: any) {
      const { token, user } = params;
      if (user?.id) {
        token.sub = String(user.id);
      }
      return token;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session(params: any) {
      const { session, token, user } = params;
      return {
        ...session,
        user: {
          ...session.user,
          id: user?.id ?? token?.sub ?? session.user?.id,
        },
      };
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
 
          if (passwordsMatch) return user;
        }
 
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});