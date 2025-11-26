import { useAuthStore } from '@/store/auth'
import { User } from 'lucide-react'
import { useUserCharacter } from '@/api/stats'

export const UserInfo = () => {
  const user = useAuthStore((s) => s.user)
  
  // Fetch user character data (fetched here so it's available if needed)
  const { data: character } = useUserCharacter()

  // Get display name from character name, email, or use a default
  const displayName = character?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="border-b-4 border-foreground dark:border-ring p-4">
      <div className="flex items-center gap-4">
        {/* Avatar section */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-foreground dark:border-ring bg-muted flex items-center justify-center shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl retro truncate">{displayName}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {character?.title && `${character.title} • `}
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}

