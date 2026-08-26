import { ensureSchema, getDatabase } from '../../utils/database'

export default defineEventHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: '日程编号无效。' })
  }
  await ensureSchema()
  const { rowCount } = await getDatabase().query('DELETE FROM calendar_events WHERE id = $1', [id])
  if (!rowCount) {
    throw createError({ statusCode: 404, statusMessage: '未找到该日程。' })
  }
  return { id }
})