'use client'

import { useState, useEffect, useCallback } from 'react'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'
import Toast from '@/components/Toast'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const
const PRIORITY_FILTERS = ['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [deleting, setDeleting] = useState(false)

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter)
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTasks(data.tasks)
    } catch {
      addToast('error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, addToast])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleCreate = async (data: Partial<Task>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw json
    setShowForm(false)
    addToast('success', '✓ Task created successfully!')
    fetchTasks()
  }

  const handleUpdate = async (data: Partial<Task>) => {
    if (!editTask) return
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw json
    setEditTask(null)
    addToast('success', '✓ Task updated successfully!')
    fetchTasks()
  }

  const handleDelete = async () => {
    if (!deleteTask) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${deleteTask.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteTask(null)
      addToast('info', 'Task deleted.')
      fetchTasks()
    } catch {
      addToast('error', 'Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusToggle = async (task: Task) => {
    const next = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    addToast('success', next === 'COMPLETED' ? '✓ Marked as completed!' : 'Marked as pending')
    fetchTasks()
  }

  // Stats
  const total = tasks.length
  const pending = tasks.filter(t => t.status === 'PENDING').length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completed = tasks.filter(t => t.status === 'COMPLETED').length

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-icon">✓</div>
          <span className="logo-text">Taskify</span>
        </div>
        <button
          id="btn-new-task"
          className="btn-new-task"
          onClick={() => { setEditTask(null); setShowForm(true) }}
        >
          + New Task
        </button>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card stat-total">
          <div className="stat-number">{total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-number">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-number">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-done">
          <div className="stat-number">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <span className="filters-label">Status:</span>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip ${statusFilter === f ? 'active' : ''}`}
            onClick={() => setStatusFilter(f)}
            id={`filter-status-${f}`}
          >
            {f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
        <span className="filters-label" style={{ marginLeft: 16 }}>Priority:</span>
        {PRIORITY_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip ${priorityFilter === f ? 'active' : ''}`}
            onClick={() => setPriorityFilter(f)}
            id={`filter-priority-${f}`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading tasks…</span>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No tasks found</div>
              <div className="empty-subtitle">
                {statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try changing your filters'
                  : "You're all caught up! Create a new task to get started."}
              </div>
              {statusFilter === 'ALL' && priorityFilter === 'ALL' && (
                <button
                  className="btn-new-task"
                  onClick={() => setShowForm(true)}
                >
                  + Create First Task
                </button>
              )}
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => { setEditTask(task); setShowForm(true) }}
                onDelete={() => setDeleteTask(task)}
                onToggleStatus={() => handleStatusToggle(task)}
              />
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <TaskForm
          task={editTask}
          onSubmit={editTask ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditTask(null) }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTask && (
        <div className="modal-overlay" onClick={() => setDeleteTask(null)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <div className="confirm-title">Delete Task?</div>
            <div className="confirm-message">
              Are you sure you want to delete <strong>&quot;{deleteTask.title}&quot;</strong>? This cannot be undone.
            </div>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDeleteTask(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                id="btn-confirm-delete"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </div>
  )
}
