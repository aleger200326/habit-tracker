import { describe, expect, it } from 'vitest'
import { addDays, completionRate, currentStreak, dateKey, isScheduled, type Habit } from './habit'

const habit: Habit = {
  id: '1', name: 'Читать', description: '', color: '#ad78f0',
  weekdays: [1, 3, 5], createdAt: '2026-10-01',
  completions: ['2026-10-12', '2026-10-14', '2026-10-16'],
}

describe('habit schedule and progress', () => {
  it('uses local calendar dates', () => {
    expect(dateKey(new Date(2026, 9, 19))).toBe('2026-10-19')
    expect(dateKey(addDays(new Date(2026, 9, 19), -1))).toBe('2026-10-18')
  })

  it('counts only planned weekdays', () => {
    expect(isScheduled(habit, new Date(2026, 9, 19))).toBe(true)
    expect(isScheduled(habit, new Date(2026, 9, 18))).toBe(false)
    expect(currentStreak(habit, new Date(2026, 9, 19))).toBe(3)
  })

  it('stops at a missed planned day and ignores unplanned days', () => {
    expect(currentStreak(habit, new Date(2026, 9, 21))).toBe(0)
    expect(completionRate(habit, [12, 13, 14, 15, 16].map(day => new Date(2026, 9, day)), new Date(2026, 9, 19))).toBe(100)
  })
})
