import { handlers } from '@/auth'

console.log('🚀 NextAuth v5 route loaded')

// The new v5 handlers include built-in error handling and logging
export const { GET, POST } = handlers