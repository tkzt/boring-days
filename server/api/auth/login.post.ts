import { setUserSession, validateCredentials, verifyPassword } from '../../utils/auth'
import { ensureSchema, getDatabase } from '../../utils/database'

export default defineEventHandler(async event => {
  const { username, password } = validateCredentials(await readBody(event))
  await ensureSchema()
  const { rows } = await getDatabase().query<{ id: number, username: string, password_hash: string }>(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username]
  )
  const user = rows[0]
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误。' })
  }
  setUserSession(event, user.id)
  return { id: user.id, username: user.username }
})