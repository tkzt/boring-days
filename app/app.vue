<template>
  <main class="calendar-app" @click="closeContextMenu">
    <div class="background-bubbles" aria-hidden="true">
      <span v-for="bubble in backgroundBubbles" :key="bubble.id" class="background-bubble" :style="{
        '--bubble-left': `${bubble.x}%`,
        '--bubble-top': `${bubble.y}%`,
        '--bubble-dx': `${bubble.dx}vw`,
        '--bubble-dy': `${bubble.dy}vh`,
        '--bubble-size': `${bubble.size}px`,
        '--bubble-duration': `${bubble.duration}s`,
        '--bubble-delay': `${bubble.delay}s`
      }" @animationend="replaceBubble($event, bubble.id)">
        <svg class="bubble-outline" viewBox="0 0 100 100" focusable="false">
          <circle cx="50" cy="50" r="49" vector-effect="non-scaling-stroke" />
        </svg>
      </span>
    </div>
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
        <button v-for="status in statusOptions" :key="status.value" type="button"
          :class="['legend-item', `status-${status.value}`]"
          :disabled="!backlogByStatus[status.value]?.count"
          :title="backlogByStatus[status.value]?.count ? `全部月份共 ${backlogByStatus[status.value]?.count} 项${status.label}，点击跳转到最早一项所在月份` : `没有${status.label}的日程`"
          @click="goToFirstBacklogEvent(status.value)">
          <span class="legend-count"><span>{{ backlogByStatus[status.value]?.count ?? 0
          }}</span></span>{{ status.label }}
        </button>
        <span class="legend-hint">全部月份 · 点击状态定位最早一项</span>
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
            <button v-for="segment in week.eventSegments"
              :key="`${segment.event.id}-${segment.startDate}`"
              :class="['event-chip', `status-${segment.event.status}`, eventSegmentClass(segment)]"
              :style="{ gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}`, gridRow: segment.row }"
              :title="`${segment.event.title} - ${statusLabel(segment.event.status)}`"
              @click="openEdit(segment.event)"
              @contextmenu.prevent.stop="openEventMenu($event, segment.event)">
              <template v-if="shouldShowEventLabel(segment.event, segment.startDate)">
                <span
                  v-if="segment.event.startTime && segment.event.eventDate === segment.startDate"
                  class="event-time">{{
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

interface BacklogSummary {
  status: EventStatus
  count: number
  firstEventDate: string
}

interface EventSegment {
  event: CalendarEvent
  startIndex: number
  endIndex: number
  startDate: string
  endDate: string
  continuesFromPreviousWeek: boolean
  continuesToNextWeek: boolean
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
let nextBubbleId = 0
function createBubble(stagger = false) {
  const angle = Math.random() * Math.PI * 2
  const distance = 10 + Math.random() * 18
  const duration = 7 + Math.random() * 3
  return {
    id: nextBubbleId++,
    x: 8 + Math.random() * 84,
    y: 8 + Math.random() * 84,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 18 + Math.random() * 40,
    duration,
    delay: stagger ? -Math.random() * duration * .85 : 0
  }
}
const backgroundBubbles = ref<ReturnType<typeof createBubble>[]>([])

function replaceBubble(event: AnimationEvent, id: number) {
  if (event.animationName !== 'bubble-drift' || event.target !== event.currentTarget) return
  const index = backgroundBubbles.value.findIndex(bubble => bubble.id === id)
  if (index !== -1) backgroundBubbles.value.splice(index, 1, createBubble())
}

onMounted(() => {
  backgroundBubbles.value = Array.from({ length: 14 }, () => createBubble(true))
})

const statusOptions: Array<{ value: EventStatus, label: string }> = [
  { value: 'planned', label: '待开始' },
  { value: 'in_progress', label: '正在做' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '超期' },
  { value: 'cancelled', label: '决定不做' }
]

const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const events = ref<CalendarEvent[]>([])
const backlog = ref<BacklogSummary[]>([])
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
const backlogByStatus = computed(() => Object.fromEntries(backlog.value.map(item => [item.status, item])) as Partial<Record<EventStatus, BacklogSummary>>)
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
      const continuesFromPreviousWeek = event.eventDate < weekStart
      const continuesToNextWeek = event.endDate > weekEnd
      const startIndex = event.eventDate <= weekStart ? 0 : days.findIndex(day => day.key === event.eventDate)
      const endIndex = event.endDate >= weekEnd ? days.length - 1 : days.findIndex(day => day.key === event.endDate)
      return { event, startIndex, endIndex, continuesFromPreviousWeek, continuesToNextWeek }
    })
    .sort((first, second) => first.startIndex - second.startIndex || eventDuration(second.event) - eventDuration(first.event))
    .map(({ event, startIndex, endIndex, continuesFromPreviousWeek, continuesToNextWeek }) => {
      const existingRow = rowEndIndexes.findIndex(rowEndIndex => rowEndIndex < startIndex)
      const rowIndex = existingRow === -1 ? rowEndIndexes.length : existingRow
      rowEndIndexes[rowIndex] = endIndex
      return {
        event,
        startIndex,
        endIndex,
        startDate: days[startIndex].key,
        endDate: days[endIndex].key,
        continuesFromPreviousWeek,
        continuesToNextWeek,
        row: rowIndex + 1
      }
    })
}

function shouldShowEventLabel(event: CalendarEvent, date: string) {
  return event.eventDate === date || new Date(`${date}T00:00:00`).getDay() === 1
}

function eventSegmentClass(segment: EventSegment) {
  const startsSegment = !segment.continuesFromPreviousWeek
  const endsSegment = !segment.continuesToNextWeek
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
  const requestedMonth = currentMonth.value
  const first = formatDate(currentMonth.value)
  const last = formatDate(new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0))
  try {
    const [monthEvents, summary] = await Promise.all([
      $fetch<CalendarEvent[]>('/api/events', { query: { from: first, to: last } }),
      $fetch<BacklogSummary[]>('/api/events/backlog')
    ])
    if (!authUser.value || requestedMonth !== currentMonth.value) return
    events.value = monthEvents
    backlog.value = summary
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
  backlog.value = []
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

function goToFirstBacklogEvent(status: EventStatus) {
  const summary = backlogByStatus.value[status]
  if (!summary) return
  const date = new Date(`${summary.firstEventDate}T00:00:00`)
  currentMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
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
  background: #edf4fc;
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
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  padding: 32px;
  background: #edf4fc;
}

.background-bubbles {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.background-bubble {
  --bubble-color: rgba(45, 111, 190, .24);
  position: absolute;
  top: var(--bubble-top);
  left: var(--bubble-left);
  width: var(--bubble-size);
  height: var(--bubble-size);
  border-radius: 50%;
  background: var(--bubble-color);
  animation:
    bubble-drift var(--bubble-duration) var(--bubble-delay) linear both,
    bubble-fill var(--bubble-duration) var(--bubble-delay) steps(1, end) both;
}

.background-bubble::before,
.background-bubble::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, .95);
  transform: rotate(-38deg);
  animation: bubble-highlight var(--bubble-duration) var(--bubble-delay) steps(1, end) both;
}

.background-bubble::before {
  top: 14%;
  right: 20%;
  width: 10%;
  height: 19%;
}

.background-bubble::after {
  top: 36%;
  right: 15%;
  width: 5%;
  height: 9%;
  background: rgba(255, 255, 255, .85);
}

.bubble-outline {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: var(--bubble-color);
  stroke-width: .6px;
  stroke-dasharray: 9 4 2 7 5 3 12 6;
  stroke-opacity: 0;
  animation: bubble-border-fade var(--bubble-duration) var(--bubble-delay) linear both;
}

@keyframes bubble-drift {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(.5);
  }

  12% {
    opacity: 1;
  }

  92% {
    transform: translate3d(var(--bubble-dx), var(--bubble-dy), 0) scale(2.8);
    opacity: 1;
  }

  100% {
    opacity: 1;
    transform: translate3d(var(--bubble-dx), var(--bubble-dy), 0) scale(2.8);
  }
}

@keyframes bubble-fill {
  0% {
    background: var(--bubble-color);
  }

  92%,
  100% {
    background: transparent;
  }
}

@keyframes bubble-highlight {
  0% {
    opacity: 1;
  }

  92%,
  100% {
    opacity: 0;
  }
}

@keyframes bubble-border-fade {
  0% {
    stroke-opacity: 0;
    animation-timing-function: steps(1, end);
  }

  92% {
    stroke-opacity: 1;
    animation-timing-function: linear;
  }

  100% {
    stroke-opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .background-bubbles {
    display: none;
  }
}

.app-shell {
  max-width: 1380px;
  margin: 0 auto;
  background: rgba(255, 255, 255, .37);
  -webkit-backdrop-filter: blur(20px) saturate(135%);
  backdrop-filter: blur(20px) saturate(135%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 16px 38px rgba(44, 78, 118, .09), inset 0 1px 0 rgba(255, 255, 255, .8);
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
  border-radius: 20px;
  background: rgba(255, 255, 255, .37);
  -webkit-backdrop-filter: blur(20px) saturate(135%);
  backdrop-filter: blur(20px) saturate(135%);
  box-shadow: 0 16px 38px rgba(44, 78, 118, .09), inset 0 1px 0 rgba(255, 255, 255, .8);
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
  border: 0;
  border-radius: 6px;
  padding: 3px 4px;
  background: transparent;
  transition: background-color .15s ease, box-shadow .15s ease;
}

.legend-item:not(:disabled) {
  cursor: pointer;
}

.legend-item:not(:disabled):hover {
  background: color-mix(in srgb, currentColor 14%, white);
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 30%, transparent);
}

.legend-item:not(:disabled):hover .legend-count {
  box-shadow: 0 2px 6px color-mix(in srgb, currentColor 30%, transparent);
}

.legend-hint {
  align-self: center;
  margin-left: auto;
  color: #777981;
  font-size: 12px;
}

.legend-item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.legend-item:disabled {
  cursor: default;
}

.legend-count {
  display: inline-grid;
  min-width: 24px;
  height: 22px;
  place-items: center;
  border-radius: 6px;
  padding: 0 6px;
  background: currentColor;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.legend-count span {
  color: #fff;
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
  background: rgba(255, 255, 255, .12);
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
