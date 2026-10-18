export type Habit = {
  id: string
  name: string
  description: string
  color: string
  weekdays: number[] // 0 = Sunday
  createdAt: string // local YYYY-MM-DD
  completions: string[]
}

export const COLORS = ['#ad78f0', '#f193c0', '#77c9e7', '#9bd59a', '#f2c77e']
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]
export const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + amount)
  return next
}

export function isScheduled(habit: Habit, date: Date): boolean {
  return dateKey(date) >= habit.createdAt && habit.weekdays.includes(date.getDay())
}

export function isComplete(habit: Habit, date: Date): boolean {
  return habit.completions.includes(dateKey(date))
}

export function currentStreak(habit: Habit, today: Date): number {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let count = 0
  let firstScheduled = true
  while (dateKey(cursor) >= habit.createdAt) {
    if (isScheduled(habit, cursor)) {
      if (isComplete(habit, cursor)) count++
      else if (!firstScheduled) break
      firstScheduled = false
    }
    cursor = addDays(cursor, -1)
  }
  return count
}

export function lastDays(today: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index - count + 1))
}

export function weekDays(today: Date): Date[] {
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = addDays(today, -mondayOffset)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function completionRate(habit: Habit, dates: Date[], today: Date): number {
  const scheduled = dates.filter(date => date <= today && isScheduled(habit, date))
  if (!scheduled.length) return 0
  return Math.round(scheduled.filter(date => isComplete(habit, date)).length / scheduled.length * 100)
}

const STORAGE_KEY = 'ritm.habits.v1'

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is Habit => {
      if (!value || typeof value !== 'object') return false
      const habit = value as Habit
      return typeof habit.id === 'string' && typeof habit.name === 'string' &&
        typeof habit.createdAt === 'string' && Array.isArray(habit.weekdays) &&
        Array.isArray(habit.completions) && typeof habit.color === 'string'
    }).map(habit => ({ ...habit, description: habit.description || '' }))
  } catch {
    return []
  }
}

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
}
