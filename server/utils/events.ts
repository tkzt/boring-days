export const eventStatuses = ['planned', 'in_progress', 'completed', 'overdue', 'cancelled'] as const
export type EventStatus = typeof eventStatuses[number]

export interface EventPayload {
  title: string
  description?: string | null
  eventDate: string
  endDate: string
  startTime?: string | null
  status: EventStatus
}

export function validateEvent(payload: Partial<EventPayload>): EventPayload {
  if (typeof payload.title !== 'string' || !payload.title.trim() || payload.title.length > 120) {
    throw createError({ statusCode: 400, statusMessage: '标题必须为 1 至 120 个字符。' })
  }
  if (typeof payload.eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.eventDate)) {
    throw createError({ statusCode: 400, statusMessage: '请输入有效日期。' })
  }
  if (typeof payload.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.endDate) || payload.endDate < payload.eventDate) {
    throw createError({ statusCode: 400, statusMessage: '结束日期不能早于开始日期。' })
  }
  if (!eventStatuses.includes(payload.status as EventStatus)) {
    throw createError({ statusCode: 400, statusMessage: '日程状态无效。' })
  }
  if (payload.startTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(payload.startTime)) {
    throw createError({ statusCode: 400, statusMessage: '请输入有效时间。' })
  }
  if (payload.description && (typeof payload.description !== 'string' || payload.description.length > 500)) {
    throw createError({ statusCode: 400, statusMessage: '备注不能超过 500 个字符。' })
  }
  return { title: payload.title.trim(), eventDate: payload.eventDate, endDate: payload.endDate, startTime: payload.startTime || null, description: payload.description?.trim() || null, status: payload.status as EventStatus }
}