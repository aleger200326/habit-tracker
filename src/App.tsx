import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, Flame, LayoutDashboard, ListChecks, Menu, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, TrendingUp, X } from 'lucide-react'
import { COLORS, completionRate, currentStreak, dateKey, isComplete, isScheduled, lastDays, loadHabits, saveHabits, WEEKDAYS, WEEKDAY_SHORT, weekDays, type Habit } from './habit'

type Page = 'dashboard' | 'habits' | 'analytics'
type FormValues = Pick<Habit, 'name' | 'description' | 'color' | 'weekdays'>
const emptyForm: FormValues = { name: '', description: '', color: COLORS[0], weekdays: [0, 1, 2, 3, 4, 5, 6] }
const today = new Date()
const todayKey = dateKey(today)
const dateLabel = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)

function IconBadge({ color, children }: { color: string, children: React.ReactNode }) {
  return <span className="icon-badge" style={{ '--habit-color': color } as React.CSSProperties}>{children}</span>
}

function App() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits)
  const [page, setPage] = useState<Page>('dashboard')
  const [isFormOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => { saveHabits(habits) }, [habits])
  useEffect(() => {
    if (!isFormOpen && !deleteTarget) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setFormOpen(false); setDeleteTarget(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFormOpen, deleteTarget])

  const todayHabits = habits.filter(habit => isScheduled(habit, today))
  const doneToday = todayHabits.filter(habit => isComplete(habit, today)).length
  const progress = todayHabits.length ? Math.round(doneToday / todayHabits.length * 100) : 0
  const longestStreak = Math.max(0, ...habits.map(habit => currentStreak(habit, today)))
  const week = weekDays(today)
  const recent = lastDays(today, 28)
  const selectedHabit = habits.find(habit => habit.id === selectedHabitId) || null
  const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const calendarDays = useMemo(() => {
    const leading = (monthStart.getDay() + 6) % 7
    return Array.from({ length: leading + monthEnd.getDate() }, (_, index) => index < leading ? null : new Date(monthStart.getFullYear(), monthStart.getMonth(), index - leading + 1))
  }, [monthStart.getFullYear(), monthStart.getMonth(), monthEnd.getDate()])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setFormError(''); setFormOpen(true)
  }
  function openEdit(habit: Habit) {
    setEditing(habit)
    setForm({ name: habit.name, description: habit.description, color: habit.color, weekdays: habit.weekdays })
    setFormError(''); setFormOpen(true)
  }
  function submitForm(event: React.FormEvent) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) { setFormError('Введите название привычки.'); return }
    if (!form.weekdays.length) { setFormError('Выберите хотя бы один день недели.'); return }
    if (editing) {
      setHabits(current => current.map(habit => habit.id === editing.id ? { ...habit, name, description: form.description.trim(), color: form.color, weekdays: form.weekdays } : habit))
    } else {
      const newHabit: Habit = { id: crypto.randomUUID(), name, description: form.description.trim(), color: form.color, weekdays: form.weekdays, createdAt: todayKey, completions: [] }
      setHabits(current => [...current, newHabit])
      setSelectedHabitId(newHabit.id)
    }
    setFormOpen(false)
  }
  function toggleCompletion(habit: Habit, date: Date) {
    if (!isScheduled(habit, date) || dateKey(date) > todayKey) return
    const key = dateKey(date)
    setHabits(current => current.map(item => item.id === habit.id ? { ...item, completions: item.completions.includes(key) ? item.completions.filter(value => value !== key) : [...item.completions, key] } : item))
  }
  function removeHabit() {
    if (!deleteTarget) return
    setHabits(current => current.filter(habit => habit.id !== deleteTarget.id))
    if (selectedHabitId === deleteTarget.id) setSelectedHabitId(null)
    setDeleteTarget(null)
  }
  function navigate(next: Page) { setPage(next); setMobileMenu(false) }

  const nav = [
    { id: 'dashboard' as Page, label: 'Обзор', icon: LayoutDashboard },
    { id: 'habits' as Page, label: 'Мои привычки', icon: ListChecks },
    { id: 'analytics' as Page, label: 'Аналитика', icon: Activity },
  ]

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={20} strokeWidth={2.1} /></span><span>ритм<span className="brand-dot">.</span></span></div>
      <div className="sidebar-section-label">ПРОСТРАНСТВО</div>
      <nav className="side-nav" aria-label="Основная навигация">
        {nav.map(item => <button key={item.id} type="button" className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={18} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip"><span className="tip-orb"><Sparkles size={17} /></span><strong>Маленькие шаги.<br />Большие перемены.</strong><p>Каждый отмеченный день — часть твоей истории.</p></div>
      <div className="sidebar-footer"><CircleHelp size={17} /><span>Твой личный ритм</span></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="mobile-menu-button" type="button" aria-label="Открыть меню" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={23} /></button><div className="breadcrumbs"><span>Пространство</span><ChevronRight size={15} /><strong>{nav.find(item => item.id === page)?.label}</strong></div><div className="top-actions"><span className="today-pill"><CalendarDays size={15} /> {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(today)}</span><span className="avatar" aria-label="Личный профиль">Я</span></div></header>

      {page === 'dashboard' && <div className="page-content">
        <div className="page-heading"><div><h1>Привет, это твой ритм <span className="heading-spark">✳</span></h1><p>Сегодня {dateLabel}. Хороший день, чтобы продолжить.</p></div><button className="primary-button" type="button" onClick={openCreate}><Plus size={19} /> Новая привычка</button></div>

        <div className="dashboard-grid">
          <section className="hero-card"><div className="hero-copy"><span className="hero-label">ПРОГРЕСС СЕГОДНЯ</span><h2>{todayHabits.length ? `${doneToday} из ${todayHabits.length}` : 'Твой первый шаг'}</h2><p>{todayHabits.length ? doneToday === todayHabits.length ? 'Все привычки на сегодня выполнены. Так держать!' : 'Двигайся в своём темпе. Каждый шаг важен.' : 'Добавь привычку, которую хочется развивать.'}</p><div className="hero-progress"><span style={{ width: `${progress}%` }} /></div><span className="hero-progress-caption">{progress}% выполнено</span></div><div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-center"><span>{progress}%</span><small>сегодня</small></div><span className="star star-one">✦</span><span className="star star-two">✧</span></div></section>
          <div className="stat-column"><div className="stat-card"><IconBadge color="#ad78f0"><ListChecks size={21} /></IconBadge><div><span>Всего привычек</span><strong>{habits.length}</strong></div><small>в твоём списке</small></div><div className="stat-card"><IconBadge color="#f4a5c6"><Flame size={21} /></IconBadge><div><span>Лучшая серия</span><strong>{longestStreak} <em>дн.</em></strong></div><small>продолжай в том же духе</small></div></div>
        </div>

        <div className="content-grid">
          <section className="panel today-panel"><div className="section-header"><div><h2>На сегодня</h2><p>Твои привычки на этот день</p></div><span className="section-count">{doneToday}/{todayHabits.length}</span></div>
            {todayHabits.length ? <div className="today-list">{todayHabits.map(habit => <div className={`today-item ${isComplete(habit, today) ? 'completed' : ''}`} key={habit.id}><IconBadge color={habit.color}><Sparkles size={18} /></IconBadge><div className="today-item-copy"><strong>{habit.name}</strong><span>{habit.description || 'Один шаг к цели'}</span></div><button className="complete-button" type="button" aria-label={`${isComplete(habit, today) ? 'Отменить выполнение' : 'Отметить выполнение'}: ${habit.name}`} aria-pressed={isComplete(habit, today)} onClick={() => toggleCompletion(habit, today)}>{isComplete(habit, today) && <Check size={17} strokeWidth={3} />}</button></div>)}</div> : <div className="empty-today"><span className="empty-orb"><Sparkles size={27} /></span><strong>{habits.length ? 'Сегодня свободный день' : 'Начни с одной привычки'}</strong><p>{habits.length ? 'По расписанию на сегодня ничего нет. Загляни в календарь или добавь новую привычку.' : 'Например, читать 10 минут или выходить на прогулку. Твой путь начинается здесь.'}</p><button type="button" onClick={openCreate}>Добавить привычку <ArrowRight size={16} /></button></div>}
          </section>
          <section className="panel week-panel"><div className="section-header"><div><h2>Эта неделя</h2><p>Как складывается твой ритм</p></div><span className="muted-icon"><TrendingUp size={20} /></span></div><div className="week-bars">{week.map(date => { const scheduled = habits.filter(habit => isScheduled(habit, date)); const completed = scheduled.filter(habit => isComplete(habit, date)); const future = dateKey(date) > todayKey; const height = scheduled.length && !future ? Math.max(12, completed.length / scheduled.length * 100) : 12; return <div className={`week-day ${dateKey(date) === todayKey ? 'is-today' : ''}`} key={dateKey(date)}><div className="bar-track"><span style={{ height: `${height}%`, opacity: completed.length ? 1 : .28 }} /></div><span>{WEEKDAY_SHORT[date.getDay()]}</span><small>{date.getDate()}</small></div> })}</div><div className="week-note"><span className="legend-dot" /> Выполненные привычки по дням</div></section>
        </div>
        <div className="bottom-link"><button type="button" onClick={() => navigate('habits')}>Посмотреть все привычки <ArrowRight size={17} /></button></div>
      </div>}

      {page === 'habits' && <div className="page-content"><div className="page-heading"><div><h1>Мои привычки</h1><p>Создавай свой ритм, день за днём.</p></div><button className="primary-button" type="button" onClick={openCreate}><Plus size={19} /> Новая привычка</button></div>
        <div className="habits-layout"><section className="panel habits-panel"><div className="section-header"><div><h2>Все привычки <span className="inline-count">{habits.length}</span></h2><p>Выбери привычку, чтобы увидеть историю</p></div></div>{habits.length > 0 && <label className="search-box"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти привычку" aria-label="Найти привычку" /></label>}
          {habits.length ? <div className="habit-list">{habits.filter(habit => habit.name.toLowerCase().includes(search.trim().toLowerCase())).map(habit => <div className={`habit-row ${selectedHabitId === habit.id ? 'selected' : ''}`} key={habit.id}><button type="button" className="habit-select" onClick={() => { setSelectedHabitId(habit.id); setMonthOffset(0) }}><IconBadge color={habit.color}><Sparkles size={18} /></IconBadge><span className="habit-row-copy"><strong>{habit.name}</strong><small>{habit.weekdays.length === 7 ? 'Каждый день' : WEEKDAYS.filter(day => habit.weekdays.includes(day)).map(day => WEEKDAY_SHORT[day]).join(', ')}</small></span><span className="habit-streak"><Flame size={15} /> {currentStreak(habit, today)}</span></button><div className="row-actions"><button type="button" aria-label={`Редактировать ${habit.name}`} title="Редактировать" onClick={() => openEdit(habit)}><Pencil size={16} /></button><button type="button" aria-label={`Удалить ${habit.name}`} title="Удалить" onClick={() => setDeleteTarget(habit)}><Trash2 size={16} /></button></div></div>)}</div> : <div className="empty-habits"><span className="empty-orb"><ListChecks size={27} /></span><strong>Здесь появятся твои привычки</strong><p>Добавь первую, чтобы начать отмечать прогресс.</p><button className="secondary-button" type="button" onClick={openCreate}><Plus size={17} /> Добавить привычку</button></div>}{habits.length > 0 && !habits.some(habit => habit.name.toLowerCase().includes(search.trim().toLowerCase())) && <p className="search-empty">По запросу ничего не найдено.</p>}</section>
          <section className="panel detail-panel">{selectedHabit ? <><div className="detail-heading"><div><IconBadge color={selectedHabit.color}><Sparkles size={19} /></IconBadge><div><h2>{selectedHabit.name}</h2><p>{selectedHabit.description || 'Твоя привычка'}</p></div></div><button type="button" className="icon-button" aria-label="Редактировать привычку" onClick={() => openEdit(selectedHabit)}><MoreHorizontal size={21} /></button></div><div className="detail-stats"><div><strong>{currentStreak(selectedHabit, today)}</strong><span>серия дней</span></div><div><strong>{completionRate(selectedHabit, recent, today)}%</strong><span>за 28 дней</span></div><div><strong>{selectedHabit.completions.length}</strong><span>всего отметок</span></div></div><div className="calendar-heading"><h3>История отметок</h3><div><button type="button" aria-label="Предыдущий месяц" onClick={() => setMonthOffset(value => value - 1)}><ChevronLeft size={18} /></button><span>{new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthStart)}</span><button type="button" aria-label="Следующий месяц" disabled={monthOffset >= 0} onClick={() => setMonthOffset(value => value + 1)}><ChevronRight size={18} /></button></div></div><div className="calendar-grid">{WEEKDAYS.map(day => <span className="calendar-weekday" key={day}>{WEEKDAY_SHORT[day]}</span>)}{calendarDays.map((date, index) => date ? <button key={dateKey(date)} type="button" className={`calendar-cell ${isComplete(selectedHabit, date) ? 'done' : ''} ${dateKey(date) === todayKey ? 'today' : ''}`} disabled={!isScheduled(selectedHabit, date) || dateKey(date) > todayKey} onClick={() => toggleCompletion(selectedHabit, date)} aria-label={`${date.getDate()} ${new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date)}: ${isComplete(selectedHabit, date) ? 'выполнено, отменить' : 'отметить выполнение'}`} style={{ '--habit-color': selectedHabit.color } as React.CSSProperties}>{isComplete(selectedHabit, date) ? <Check size={17} /> : date.getDate()}</button> : <span key={`empty-${index}`} />)}</div><p className="calendar-hint">Нажми на запланированный день, чтобы изменить отметку.</p></> : <div className="detail-placeholder"><CalendarDays size={34} /><strong>История привычки</strong><p>Выбери привычку из списка, чтобы посмотреть календарь и прогресс.</p></div>}</section></div></div>}

      {page === 'analytics' && <div className="page-content"><div className="page-heading"><div><h1>Аналитика</h1><p>Прогресс складывается из маленьких действий.</p></div><button className="primary-button" type="button" onClick={openCreate}><Plus size={19} /> Новая привычка</button></div><div className="analytics-summary"><div className="analytics-card"><span>Выполнено сегодня</span><strong>{doneToday}<small> / {todayHabits.length}</small></strong><p>запланированных привычек</p></div><div className="analytics-card"><span>Активных привычек</span><strong>{habits.length}</strong><p>в твоём расписании</p></div><div className="analytics-card"><span>Лучшая серия сейчас</span><strong>{longestStreak}<small> дн.</small></strong><p>без пропуска планового дня</p></div></div><section className="panel analytics-panel"><div className="section-header"><div><h2>Последние 28 дней</h2><p>Доля выполненных плановых дней для каждой привычки</p></div></div>{habits.length ? <div className="analytics-list">{habits.map(habit => { const rate = completionRate(habit, recent, today); return <div className="analytics-row" key={habit.id}><div><span className="small-color" style={{ background: habit.color }} /><strong>{habit.name}</strong><span>{rate}%</span></div><div className="analytics-track"><span style={{ width: `${rate}%`, background: habit.color }} /></div></div> })}</div> : <div className="empty-habits"><span className="empty-orb"><TrendingUp size={27} /></span><strong>Аналитика ждёт твоих первых шагов</strong><p>Создай привычку и отмечай её выполнение — здесь появится прогресс.</p><button className="secondary-button" type="button" onClick={openCreate}><Plus size={17} /> Добавить привычку</button></div>}</section></div>}
    </main>

    {mobileMenu && <button className="mobile-scrim" type="button" aria-label="Закрыть меню" onClick={() => setMobileMenu(false)} />}
    {isFormOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setFormOpen(false) }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-header"><div><h2 id="form-title">{editing ? 'Редактировать привычку' : 'Новая привычка'}</h2><p>Назови то, к чему хочется возвращаться.</p></div><button className="icon-button" type="button" aria-label="Закрыть" onClick={() => setFormOpen(false)}><X size={21} /></button></div><form onSubmit={submitForm}><label className="field-label">Название<input autoFocus maxLength={60} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Например, читать 10 минут" /></label><label className="field-label">Описание <span>необязательно</span><textarea maxLength={180} rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Что поможет не забыть о ней?" /></label><div className="form-group"><span className="field-title">Цвет привычки</span><div className="color-options">{COLORS.map(color => <button key={color} type="button" className={form.color === color ? 'selected' : ''} style={{ background: color }} aria-label={`Выбрать цвет ${color}`} aria-pressed={form.color === color} onClick={() => setForm({ ...form, color })}>{form.color === color && <Check size={17} />}</button>)}</div></div><div className="form-group"><span className="field-title">Расписание</span><button className={`daily-toggle ${form.weekdays.length === 7 ? 'selected' : ''}`} type="button" onClick={() => setForm({ ...form, weekdays: [0, 1, 2, 3, 4, 5, 6] })}>Каждый день</button><div className="weekday-options">{WEEKDAYS.map(day => <button key={day} className={form.weekdays.includes(day) ? 'selected' : ''} type="button" aria-pressed={form.weekdays.includes(day)} onClick={() => setForm({ ...form, weekdays: form.weekdays.includes(day) ? form.weekdays.filter(value => value !== day) : [...form.weekdays, day] })}>{WEEKDAY_SHORT[day]}</button>)}</div></div>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setFormOpen(false)}>Отмена</button><button className="primary-button" type="submit">{editing ? 'Сохранить' : 'Создать привычку'}</button></div></form></div></div>}
    {deleteTarget && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteTarget(null) }}><div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="modal-header"><div><h2 id="delete-title">Удалить привычку?</h2><p>«{deleteTarget.name}» и вся история отметок будут удалены.</p></div><button className="icon-button" type="button" aria-label="Закрыть" onClick={() => setDeleteTarget(null)}><X size={21} /></button></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)}>Отмена</button><button className="danger-button" type="button" onClick={removeHabit}>Удалить</button></div></div></div>}
  </div>
}

export default App
