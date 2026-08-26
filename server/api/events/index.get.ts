import { ensureSchema, getDatabase } from '../../utils/database'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : ''
  const to = typeof query.to === 'string' ? query.to : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, statusMessage: '请提供有效的日期范围。' })
  }
  await ensureSchema()
  const { rows } = await getDatabase().query(
    `SELECT id, title, description, event_date::text AS "eventDate", end_date::text AS "endDate", start_time AS "startTime", status
     FROM calendar_events WHERE user_id = $1 AND event_date <= $3 AND end_date >= $2 ORDER BY event_date, start_time NULLS LAST, id`,
    [user.id, from, to]
  )
  return rows
})