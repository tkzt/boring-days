import { ensureSchema, getDatabase } from '../../utils/database'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  await ensureSchema()
  const { rows } = await getDatabase().query(
    `SELECT status, COUNT(*)::integer AS count, MIN(event_date)::text AS "firstEventDate"
     FROM calendar_events
    WHERE user_id = $1
     GROUP BY status`,
    [user.id]
  )
  return rows
})