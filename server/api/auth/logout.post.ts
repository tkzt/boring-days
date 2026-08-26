import { clearUserSession } from '../../utils/auth'

export default defineEventHandler(event => {
  clearUserSession(event)
  return { ok: true }
})