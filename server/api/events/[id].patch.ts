import { ensureSchema, getDatabase } from '../../utils/database'
import { validateEvent } from '../../utils/events'

export default defineEventHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: '日程编号无效。' })
  }
  const payload = validateEvent(await readBody(event))
  await ensureSchema()
  const { rows } = await getDatabase().query(
    `UPDATE calendar_events SET title = $1, description = $2, event_date = $3, end_date = $4, start_time = $5, status = $6, updated_at = NOW()
     WHERE id = $7 RETURNING id, title, description, event_date::text AS "eventDate", end_date::text AS "endDate", start_time AS "startTime", status`,
    [payload.title, payload.description, payload.eventDate, payload.endDate, payload.startTime, payload.status, id]
  )
  if (!rows[0]) {
    throw createError({ statusCode: 404, statusMessage: '未找到该日程。' })
  }
  return rows[0]
})