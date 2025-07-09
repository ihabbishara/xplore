import helmet from 'helmet'
import { getSecurityConfig } from '@/config/security'

export const helmetMiddleware = () => {
  const config = getSecurityConfig()
  return helmet(config.helmet)
}