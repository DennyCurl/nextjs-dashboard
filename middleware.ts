import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  // Спочатку оновлюємо сесію Supabase
  const response = await updateSession(request)
  
  // Перевіряємо чи користувач на захищеному маршруті
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isSelectLocalizationPage = request.nextUrl.pathname === '/select-localization'
  
  if (isProtectedRoute && !isSelectLocalizationPage) {
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!authError && user) {
        // Перевіряємо чи є current_locals_id в cookies
        const currentLocalsId = request.cookies.get('current_locals_id')?.value
        
        if (!currentLocalsId) {
          // Перенаправляємо на сторінку вибору локалізації
          const selectUrl = new URL('/select-localization', request.url)
          return NextResponse.redirect(selectUrl)
        }
      }
    } catch (error) {
      console.error('Middleware localization check error:', error)
    }
  }
  
  // Тут можна додати RBAC перевірки для захищених маршрутів
  // Наприклад, перевіряти доступ до /dashboard/admin/*
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|ico)$).*)',
  ],
}