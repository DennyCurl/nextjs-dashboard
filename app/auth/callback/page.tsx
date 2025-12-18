'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getClaims()
      
      if (error) {
        console.error('Error during auth callback:', error)
        router.push('/auth/login?error=callback_error')
      } else if (data) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Обробка авторизації...</h2>
        <p className="text-gray-600">Зачекайте, будь ласка</p>
      </div>
    </div>
  )
}