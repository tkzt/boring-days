<template>
  <main class="calendar-app" @click="closeContextMenu">
    <NuxtRouteAnnouncer />
    <section v-if="authUser" class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">BORING DAYS</p>
          <h1>{{ monthTitle }}</h1>
        </div>
        <div class="toolbar">
          <button class="icon-button" aria-label="上一个月" title="上一个月"
            @click="moveMonth(-1)">‹</button>
          <button class="today-button" @click="goToday">今天</button>
          <button class="icon-button" aria-label="下一个月" title="下一个月"
            @click="moveMonth(1)">›</button>
          <button class="add-button" @click="openCreate()">+ 新建日程</button>
          <button class="logout-button" @click="logout">退出</button>
        </div>
      </header>

      <div class="status-legend" aria-label="日程状态说明">
        <span v-for="status in statusOptions" :key="status.value"
          :class="['legend-item', `status-${status.value}`]">
          <i />{{ status.label }}
        </span>
      </div>

      <section class="calendar" aria-label="月历">
        <div class="calendar-weekdays">
          <div v-for="weekday in weekdays" :key="weekday" class="weekday">{{ weekday }}</div>
        </div>
        <section v-for="week in calendarWeeks" :key="week.days[0].key" class="calendar-week"
          :style="{ minHeight: `${week.minHeight}px` }">
          <article v-for="day in week.days" :key="day.key"
            :class="['day-cell', { 'is-outside': !day.isCurrentMonth, 'is-today': day.isToday }]"
            @dblclick="openCreate(day.date)" @contextmenu.prevent="openDayMenu($event, day.key)">
            <time :datetime="day.key">{{ day.date.getDate() }}</time>
          </article>
          <div class="week-events">
            <button v-for="segment in week.eventSegments" :key="`${segment.event.id}-${segment.startDate}`"
              :class="['event-chip', `status-${segment.event.status}`, eventSegmentClass(segment.event, segment.startDate, segment.endDate)]"
              :style="{ gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}`, gridRow: segment.row }"
              :title="`${segment.event.title} - ${statusLabel(segment.event.status)}`" @click="openEdit(segment.event)"
              @contextmenu.prevent.stop="openEventMenu($event, segment.event)">
              <template v-if="shouldShowEventLabel(segment.event, segment.startDate)">
                <span v-if="segment.event.startTime && segment.event.eventDate === segment.startDate" class="event-time">{{
                  segment.event.startTime.slice(0, 5) }}</span>{{ segment.event.title }}
              </template>
            </button>
          </div>
        </section>
      </section>
    </section>

    <section v-else class="login-shell" aria-labelledby="login-title">
      <form class="login-panel" @submit.prevent="submitAuthentication">
        <p class="eyebrow">BORING DAYS</p>
        <h1 id="login-title">登录日程</h1>
        <p class="login-intro">登录后查看和管理只属于你的日程。</p>
        <label>用户名
          <input v-model.trim="authForm.username" required minlength="3" maxlength="30"
            autocomplete="username" placeholder="小写字母、数字或下划线" />
        </label>
        <label>密码
          <input v-model="authForm.password" required minlength="8" maxlength="128" type="password"
            autocomplete="current-password" placeholder="至少 8 个字符" />
        </label>
        <p v-if="authError" class="form-error">{{ authError }}</p>
        <button class="auth-submit" :disabled="isAuthenticating">
          {{ isAuthenticating ? '请稍候…' : '登录' }}
        </button>
      </form>
    </section>

    <div v-if="contextMenu" class="context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <template v-if="contextMenu.kind === 'day'">
        <button @click="openCreateFromMenu">新增日程</button>
        <button class="danger-menu-item" @click="confirmClearDay">清空当天</button>
      </template>
      <template v-else>
        <button @click="openEditFromMenu">编辑</button>
        <button class="danger-menu-item" @click="confirmDeleteEvent">删除</button>
      </template>
    </div>

    <div v-if="pendingDeletion" class="modal-backdrop" @click.self="closeConfirmation">
      <section class="confirmation-dialog" role="alertdialog" aria-modal="true"
        aria-labelledby="confirmation-title">
        <p class="eyebrow">确认操作</p>
        <h2 id="confirmation-title">{{ pendingDeletion.kind === 'day' ? '清空当天日程？' : '删除这个日程？' }}
        </h2>
        <p class="confirmation-message">
          <template v-if="pendingDeletion.kind === 'day'">将删除 {{ pendingDeletion.date }}
            的全部日程，包括覆盖当天的跨天事项。</template>
          <template v-else>“{{ pendingDeletion.event.title }}”将被永久删除。</template>
        </p>
        <div class="editor-actions">
          <button type="button" class="cancel-button" :disabled="isDeleting"
            @click="closeConfirmation">取消</button>
          <button type="button" class="delete-button" :disabled="isDeleting"
            @click="executeDeletion">{{
              isDeleting ? '删除中…' : '删除' }}</button>
        </div>
      </section>
    </div>

    <div v-if="isEditorOpen" class="modal-backdrop" @click.self="closeEditor">
      <form class="event-editor" @submit.prevent="saveEvent">
        <div class="editor-heading">
          <div>
            <p class="eyebrow">{{ editingId ? '编辑日程' : '新建日程' }}</p>
            <h2>{{ editingId ? form.title || '未命名日程' : '安排一天' }}</h2>
          </div>
          <button type="button" class="close-button" aria-label="关闭" title="关闭"
            @click="closeEditor">×</button>
        </div>
        <label>标题<input v-model.trim="form.title" required maxlength="120"
            placeholder="例如：完成项目复盘" /></label>
        <div class="date-range">
          <label>开始日期<input v-model="form.eventDate" required type="date" /></label>
          <label>结束日期<input v-model="form.endDate" required :min="form.eventDate"
              type="date" /></label>
        </div>
        <label>时间<input v-model="form.startTime" type="time" /></label>
        <label>状态
          <select v-model="form.status">
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{
              status.label }}</option>
          </select>
        </label>
        <label>备注<textarea v-model.trim="form.description" rows="3" maxlength="500"
            placeholder="可选" /></label>
        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
        <div class="editor-actions">
          <button type="button" class="cancel-button" @click="closeEditor">取消</button>
          <button class="save-button" :disabled="isSaving">{{ isSaving ? '保存中…' : '保存日程' }}</button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
type EventStatus = 'planned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'

interface CalendarEvent {
  id: number
  title: string
  description: string | null
  eventDate: string
  endDate: string
  startTime: string | null
  status: EventStatus
}

interface CalendarDay {
  date: Date
  key: string
  isCurrentMonth: boolean
  isToday: boolean
}

interface EventSegment {
  event: CalendarEvent
  startIndex: number
  endIndex: number
  startDate: string
  endDate: string
  row: number
}

interface AuthUser {
  id: number
  username: string
}

type ContextMenu =
  | { kind: 'day', date: string, x: number, y: number }
  | { kind: 'event', event: CalendarEvent, x: number, y: number }

type PendingDeletion =
  | { kind: 'day', date: string }
  | { kind: 'event', event: CalendarEvent }

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const statusOptions: Array<{ value: EventStatus, label: string }> = [
  { value: 'planned', label: '待开始' },
  { value: 'in_progress', label: '正在做' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '超期' },
  { value: 'cancelled', label: '决定不做' }
]

const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const events = ref<CalendarEvent[]>([])
const isEditorOpen = ref(false)
const editingId = ref<number | null>(null)
const isSaving = ref(false)
const errorMessage = ref('')
const contextMenu = ref<ContextMenu | null>(null)
const pendingDeletion = ref<PendingDeletion | null>(null)
const isDeleting = ref(false)
const authUser = ref<AuthUser | null>(null)
const authForm = reactive({ username: '', password: '' })
const authError = ref('')
const isAuthenticating = ref(false)
const emptyForm = () => ({ title: '', description: '', eventDate: formatDate(new Date()), endDate: formatDate(new Date()), startTime: '', status: 'planned' as EventStatus })
const form = reactive(emptyForm())

const monthTitle = computed(() => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(currentMonth.value))
const calendarDays = computed(() => {
  const monthStart = new Date(currentMonth.value)
  const startOffset = (monthStart.getDay() + 6) % 7
  const start = new Date(monthStart)
  start.setDate(start.getDate() - startOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { date, key: formatDate(date), isCurrentMonth: date.getMonth() === currentMonth.value.getMonth(), isToday: formatDate(date) === formatDate(new Date()) }
  })
})
const calendarWeeks = computed(() => Array.from({ length: 6 }, (_, weekIndex) => {
  const days = calendarDays.value.slice(weekIndex * 7, weekIndex * 7 + 7)
  const eventSegments = eventSegmentsForWeek(days)
  const eventRows = Math.max(0, ...eventSegments.map(segment => segment.row))
  return { days, eventSegments, minHeight: Math.max(130, 53 + eventRows * 26) }
}))

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function statusLabel(status: EventStatus) {
  return statusOptions.find(item => item.value === status)?.label ?? status
}

function eventDuration(event: CalendarEvent) {
  return new Date(`${event.endDate}T00:00:00`).getTime() - new Date(`${event.eventDate}T00:00:00`).getTime()
}

function eventSegmentsForWeek(days: CalendarDay[]): EventSegment[] {
  const weekStart = days[0].key
  const weekEnd = days[days.length - 1].key
  const rowEndIndexes: number[] = []

  return events.value
    .filter(event => event.eventDate <= weekEnd && event.endDate >= weekStart)
    .map(event => {
      const startIndex = event.eventDate <= weekStart ? 0 : days.findIndex(day => day.key === event.eventDate)
      const endIndex = event.endDate >= weekEnd ? days.length - 1 : days.findIndex(day => day.key === event.endDate)
      return { event, startIndex, endIndex }
    })
    .sort((first, second) => first.startIndex - second.startIndex || eventDuration(second.event) - eventDuration(first.event))
    .map(({ event, startIndex, endIndex }) => {
      const existingRow = rowEndIndexes.findIndex(rowEndIndex => rowEndIndex < startIndex)
      const rowIndex = existingRow === -1 ? rowEndIndexes.length : existingRow
      rowEndIndexes[rowIndex] = endIndex
      return { event, startIndex, endIndex, startDate: days[startIndex].key, endDate: days[endIndex].key, row: rowIndex + 1 }
    })
}

function shouldShowEventLabel(event: CalendarEvent, date: string) {
  return event.eventDate === date || new Date(`${date}T00:00:00`).getDay() === 1
}

function eventSegmentClass(event: CalendarEvent, startDate: string, endDate: string) {
  const startsSegment = event.eventDate === startDate
  const endsSegment = event.endDate === endDate || new Date(`${endDate}T00:00:00`).getDay() === 0
  if (startsSegment && endsSegment) return 'is-single-day'
  return startsSegment ? 'is-segment-start' : endsSegment ? 'is-segment-end' : 'is-segment-middle'
}

function openDayMenu(mouseEvent: MouseEvent, date: string) {
  contextMenu.value = { kind: 'day', date, ...menuPosition(mouseEvent) }
}

function openEventMenu(mouseEvent: MouseEvent, event: CalendarEvent) {
  contextMenu.value = { kind: 'event', event, ...menuPosition(mouseEvent) }
}

function menuPosition(mouseEvent: MouseEvent) {
  return {
    x: Math.min(mouseEvent.clientX, window.innerWidth - 172),
    y: Math.min(mouseEvent.clientY, window.innerHeight - 92)
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

function openCreateFromMenu() {
  if (contextMenu.value?.kind === 'day') openCreate(new Date(`${contextMenu.value.date}T00:00:00`))
  closeContextMenu()
}

function openEditFromMenu() {
  if (contextMenu.value?.kind === 'event') openEdit(contextMenu.value.event)
  closeContextMenu()
}

function confirmClearDay() {
  if (contextMenu.value?.kind !== 'day') return
  pendingDeletion.value = { kind: 'day', date: contextMenu.value.date }
  closeContextMenu()
}

function confirmDeleteEvent() {
  if (contextMenu.value?.kind !== 'event') return
  pendingDeletion.value = { kind: 'event', event: contextMenu.value.event }
  closeContextMenu()
}

function closeConfirmation() {
  if (!isDeleting.value) pendingDeletion.value = null
}

async function executeDeletion() {
  if (!pendingDeletion.value) return
  isDeleting.value = true
  try {
    if (pendingDeletion.value.kind === 'day') {
      await $fetch('/api/events', { method: 'DELETE', query: { date: pendingDeletion.value.date } })
    } else {
      await $fetch(`/api/events/${pendingDeletion.value.event.id}`, { method: 'DELETE' })
    }
    await loadEvents()
    pendingDeletion.value = null
  } catch {
    errorMessage.value = pendingDeletion.value?.kind === 'day' ? '清空当天失败，请稍后重试。' : '删除日程失败，请稍后重试。'
  } finally {
    isDeleting.value = false
  }
}

async function loadEvents() {
  const first = formatDate(currentMonth.value)
  const last = formatDate(new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0))
  try {
    events.value = await $fetch<CalendarEvent[]>('/api/events', { query: { from: first, to: last } })
  } catch {
    errorMessage.value = '无法连接日程服务，请确认数据库已启动。'
  }
}

function authenticationError(error: unknown) {
  const statusMessage = (error as { data?: { statusMessage?: unknown } })?.data?.statusMessage
  return typeof statusMessage === 'string' ? statusMessage : '请求失败，请稍后重试。'
}

async function loadSession() {
  try {
    authUser.value = await $fetch<AuthUser>('/api/auth/me')
    await loadEvents()
  } catch {
    authUser.value = null
  }
}

async function submitAuthentication() {
  isAuthenticating.value = true
  authError.value = ''
  try {
    authUser.value = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: authForm
    })
    authForm.password = ''
    await loadEvents()
  } catch (error) {
    authError.value = authenticationError(error)
  } finally {
    isAuthenticating.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  authUser.value = null
  events.value = []
  closeEditor()
  closeConfirmation()
}

function moveMonth(direction: number) {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + direction, 1)
  loadEvents()
}

function goToday() {
  currentMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  loadEvents()
}

function openCreate(date = new Date()) {
  editingId.value = null
  Object.assign(form, emptyForm(), { eventDate: formatDate(date), endDate: formatDate(date) })
  errorMessage.value = ''
  isEditorOpen.value = true
}

function openEdit(event: CalendarEvent) {
  editingId.value = event.id
  Object.assign(form, { title: event.title, description: event.description ?? '', eventDate: event.eventDate, endDate: event.endDate, startTime: event.startTime?.slice(0, 5) ?? '', status: event.status })
  errorMessage.value = ''
  isEditorOpen.value = true
}

function closeEditor() {
  isEditorOpen.value = false
  errorMessage.value = ''
}

async function saveEvent() {
  isSaving.value = true
  errorMessage.value = ''
  const body = { ...form, startTime: form.startTime || null }
  try {
    if (editingId.value) {
      await $fetch(`/api/events/${editingId.value}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/events', { method: 'POST', body })
    }
    closeEditor()
    await loadEvents()
  } catch {
    errorMessage.value = '保存失败，请检查输入或数据库连接。'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => window.addEventListener('keydown', closeMenuOnEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', closeMenuOnEscape))

function closeMenuOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeContextMenu()
    closeConfirmation()
  }
}

onMounted(loadSession)
</script>

<style>
:root {
  color: #202124;
  background: #f5f5f7;
  font-family: 'Avenir Next', 'PingFang SC', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.calendar-app {
  min-height: 100vh;
  padding: 32px;
  background: #f5f5f7;
}

.app-shell {
  max-width: 1380px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #dedee3;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 16px 38px rgba(26, 28, 32, .08);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-bottom: 1px solid #e8e8ec;
}

.eyebrow {
  margin: 0 0 5px;
  color: #777981;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

h1,
h2 {
  margin: 0;
  font-family: 'Avenir Next', 'PingFang SC', sans-serif;
  font-weight: 650;
  letter-spacing: 0;
}

h1 {
  font-size: 28px;
}

h2 {
  font-size: 22px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  max-width: 150px;
  overflow: hidden;
  color: #5e6068;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button,
.close-button {
  width: 34px;
  height: 34px;
  border: 1px solid #d7d7dc;
  border-radius: 6px;
  color: #3b3b40;
  background: #fff;
  font-size: 26px;
  line-height: 1;
}

.today-button,
.cancel-button,
.logout-button {
  padding: 7px 13px;
  border: 1px solid #d7d7dc;
  border-radius: 6px;
  background: #fff;
  color: #303136;
  font-size: 14px;
}

.logout-button {
  color: #5e6068;
}

.login-shell {
  display: grid;
  min-height: calc(100vh - 64px);
  place-items: center;
}

.login-panel {
  display: grid;
  width: min(100%, 380px);
  gap: 16px;
  padding: 32px;
  border: 1px solid #dedee3;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 38px rgba(26, 28, 32, .08);
}

.login-intro {
  margin: -6px 0 4px;
  color: #6a6c74;
  font-size: 14px;
  line-height: 1.5;
}

.login-panel label {
  display: grid;
  gap: 6px;
  color: #4d4e54;
  font-size: 13px;
  font-weight: 600;
}

.login-panel input {
  width: 100%;
  border: 1px solid #d2d3d8;
  border-radius: 6px;
  padding: 10px;
  background: #fff;
  color: #27282d;
  font-size: 14px;
}

.auth-submit {
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: #1f6feb;
  color: #fff;
  font-weight: 600;
}

.auth-submit:disabled {
  cursor: wait;
  opacity: .65;
}

.add-button,
.save-button {
  border: 0;
  border-radius: 6px;
  padding: 9px 14px;
  background: #1f6feb;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 14px 28px;
  border-bottom: 1px solid #e8e8ec;
  color: #5e6068;
  font-size: 13px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
}

.status-planned {
  color: #cf9300;
}

.status-in_progress {
  color: #1976d2;
}

.status-completed {
  color: #1f9d55;
}

.status-overdue {
  color: #e14a43;
}

.status-cancelled {
  color: #8b919b;
}

.calendar {
  overflow: hidden;
}

.calendar-weekdays,
.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-week {
  position: relative;
}

.weekday {
  padding: 11px 12px;
  border-bottom: 1px solid #e8e8ec;
  color: #777981;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.day-cell {
  box-sizing: border-box;
  min-height: 130px;
  padding: 10px 8px;
  border-right: 1px solid #e8e8ec;
  border-bottom: 1px solid #e8e8ec;
  background: #fff;
}

.day-cell:last-child {
  border-right: 0;
}

.day-cell time {
  display: block;
  width: 25px;
  height: 25px;
  margin: 0 0 8px auto;
  color: #34353a;
  font-size: 13px;
  line-height: 25px;
  text-align: center;
}

.is-outside time {
  color: #b8b9bf;
}

.is-today time {
  border-radius: 50%;
  background: #e2473d;
  color: #fff;
  font-weight: 700;
}

.week-events {
  position: absolute;
  top: 43px;
  right: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: 22px;
  gap: 4px 0;
  pointer-events: none;
}

.event-chip {
  display: block;
  overflow: hidden;
  min-width: 0;
  height: 22px;
  border: 0;
  border-left: 3px solid currentColor;
  border-radius: 3px;
  padding: 3px 5px;
  background: color-mix(in srgb, currentColor 12%, white);
  font-size: 12px;
  line-height: 16px;
  pointer-events: auto;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-chip.is-segment-start {
  margin-left: 8px;
  border-radius: 3px 0 0 3px;
}

.event-chip.is-single-day {
  margin-right: 8px;
  border-radius: 3px;
}

.event-chip.is-segment-middle {
  border-left: 0;
  border-radius: 0;
}

.event-chip.is-segment-end {
  margin-right: 8px;
  border-left: 0;
  border-radius: 0 3px 3px 0;
}

.event-time {
  margin-right: 4px;
}

.context-menu {
  position: fixed;
  z-index: 20;
  display: grid;
  min-width: 148px;
  padding: 4px;
  border: 1px solid #d7d7dc;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(28, 29, 33, .18);
}

.context-menu button {
  border: 0;
  border-radius: 4px;
  padding: 7px 9px;
  background: transparent;
  color: #303136;
  font-size: 13px;
  text-align: left;
}

.context-menu button:hover {
  background: #eef4ff;
}

.context-menu .danger-menu-item {
  color: #c7352e;
}

.context-menu .danger-menu-item:hover {
  background: #fff0ef;
}

.confirmation-dialog {
  width: min(100%, 390px);
  display: grid;
  gap: 14px;
  padding: 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 22px 60px rgba(0, 0, 0, .2);
}

.confirmation-message {
  margin: 0;
  color: #5d5f66;
  font-size: 14px;
  line-height: 1.55;
}

.delete-button {
  border: 0;
  border-radius: 6px;
  padding: 9px 14px;
  background: #df3f38;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.delete-button:disabled,
.cancel-button:disabled {
  opacity: .65;
  cursor: wait;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(29, 30, 34, .32);
}

.event-editor {
  width: min(100%, 430px);
  display: grid;
  gap: 15px;
  padding: 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 22px 60px rgba(0, 0, 0, .2);
}

.editor-heading,
.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.event-editor label {
  display: grid;
  gap: 6px;
  color: #4d4e54;
  font-size: 13px;
  font-weight: 600;
}

.event-editor input,
.event-editor textarea,
.event-editor select {
  width: 100%;
  border: 1px solid #d2d3d8;
  border-radius: 6px;
  padding: 9px 10px;
  background: #fff;
  color: #27282d;
  font-size: 14px;
}

.event-editor textarea {
  resize: vertical;
}

.form-error {
  margin: 0;
  color: #c7352e;
  font-size: 13px;
}

.save-button:disabled {
  opacity: .65;
  cursor: wait;
}

@media (max-width: 720px) {
  .calendar-app {
    padding: 0;
  }

  .app-shell {
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .toolbar {
    width: 100%;
    flex-wrap: wrap;
  }

  .add-button {
    margin-left: auto;
  }

  .login-shell {
    min-height: 100vh;
    padding: 20px;
  }

  .login-panel {
    padding: 24px;
  }

  .status-legend {
    gap: 10px;
    padding: 12px 16px;
  }

  .weekday {
    padding: 9px 3px;
    font-size: 11px;
  }

  .day-cell {
    min-height: 100px;
    padding: 6px 3px;
  }

  .event-chip {
    padding: 3px;
    font-size: 10px;
  }

  .event-time {
    display: none;
  }
}
</style>
