// Use dynamic import to call the handler exported from `app/auth.ts` at runtime.
// Export real functions for each HTTP method so Next.js type-checks the route
// signatures as `(request: Request) => Response | Promise<Response>`.
// We keep a narrow, explicit `Request` parameter and cast the imported
// `auth` handler to `any` when invoking to avoid type incompatibilities
// between NextAuth's helper types and Next.js Route types at build time.

export async function GET(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function POST(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function PUT(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function DELETE(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function PATCH(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function OPTIONS(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}

export async function HEAD(request: Request) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mod = await import('../../../../auth');
	return (mod as any).auth(request);
}
