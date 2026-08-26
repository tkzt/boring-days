import { ensureSchema, getDatabase } from '../../utils/database'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const date = typeof query.date === 'string' ? query.date : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: '请提供有效日期。' })
  }
  await ensureSchema()
  const { rowCount } = await getDatabase().query(
    'DELETE FROM calendar_events WHERE event_date <= $1 AND end_date >= $1',
    [date]
  )
  return { deleted: rowCount ?? 0 }
})