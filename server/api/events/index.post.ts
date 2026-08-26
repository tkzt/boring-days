import { ensureSchema, getDatabase } from '../../utils/database'
import { validateEvent } from '../../utils/events'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const payload = validateEvent(await readBody(event))
  await ensureSchema()
  const { rows } = await getDatabase().query(
    `INSERT INTO calendar_events (user_id, title, description, event_date, end_date, start_time, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, event_date::text AS "eventDate", end_date::text AS "endDate", start_time AS "startTime", status`,
    [user.id, payload.title, payload.description, payload.eventDate, payload.endDate, payload.startTime, payload.status]
  )
  return rows[0]
})