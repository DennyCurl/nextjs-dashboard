import { cookies } from 'next/headers';

/**
 * Отримати поточну локалізацію користувача з cookies
 * @returns locals_id або null якщо не встановлено
 */
export async function getCurrentLocalsId(): Promise<number | null> {
  const cookieStore = await cookies();
  const localsId = cookieStore.get('current_locals_id')?.value;
  return localsId ? Number(localsId) : null;
}

/**
 * Перевірити чи має користувач встановлену локалізацію
 */
export async function hasLocalization(): Promise<boolean> {
  const localsId = await getCurrentLocalsId();
  return localsId !== null;
}
