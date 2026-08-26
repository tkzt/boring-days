import { ensureSchema, getDatabase } from '../../utils/database'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : ''
  const to = typeof query.to === 'string' ? query.to : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, statusMessage: '请提供有效的日期范围。' })
  }
  await ensureSchema()
  const { rows } = await getDatabase().query(
    `SELECT id, title, description, event_date::text AS "eventDate", end_date::text AS "endDate", start_time AS "startTime", status
     FROM calendar_events WHERE event_date <= $2 AND end_date >= $1 ORDER BY event_date, start_time NULLS LAST, id`,
    [from, to]
  )
  return rows
})