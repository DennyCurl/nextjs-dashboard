import { createClient } from '@/utils/supabase/server'
import LocalizationSelector from './localization-selector'

export default async function UserInfo() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="flex flex-col gap-2">
      {/* Локалізація */}
      <LocalizationSelector />
      
      {/* Інформація про користувача */}
      <div className="px-4 py-2 text-xs border-t border-gray-200">
        <div className="text-gray-500 text-[10px] mb-0.5">
          Користувач
        </div>
        <div className="font-medium text-gray-900 break-words">
          {user.user_metadata?.name || user.email}
        </div>
      </div>
    </div>
  )
}

