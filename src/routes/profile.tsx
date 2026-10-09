import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '../lib/auth'
import { ProfilePage } from '../components/profile/ProfilePage'
export const Route = createFileRoute('/profile')({
  beforeLoad: () => requireSession('/profile'),
  component: ProfilePage,
})
