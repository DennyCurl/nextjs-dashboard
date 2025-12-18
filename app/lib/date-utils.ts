/**
 * Safe date formatting utility to avoid hydration mismatches
 */
export function formatDateSafe(dateString: string): string {
    if (typeof window === 'undefined') {
        // Server-side: return ISO date to avoid locale differences
        return new Date(dateString).toISOString().split('T')[0];
    }

    // Client-side: use local formatting
    try {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        // Fallback if locale formatting fails
        return new Date(dateString).toISOString().split('T')[0];
    }
}

/**
 * Check if we're running on client side
 */
export function isClient(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Check if a date is expired (past current date)
 */
export function isDateExpired(dateString: string): boolean {
    if (typeof window === 'undefined') {
        // Server-side: avoid date comparison to prevent hydration issues
        return false;
    }

    // Client-side: safe comparison
    try {
        return new Date(dateString) < new Date();
    } catch {
        return false;
    }
}