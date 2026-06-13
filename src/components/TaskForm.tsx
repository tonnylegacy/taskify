'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/app/page'

interface Props {
  task: Task | null
  onSubmit: (data: Partial<Task>) => Promise<void>
  onClose: () => void
}

interface FormErrors {
  title?: string
  priority?: string
  status?: string
  dueDate?: string
}

export default function TaskForm({ task, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<string>(task?.priority || 'MEDIUM')
  const [status, setStatus] = useState<string>(task?.status || 'PENDING')
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!title.trim()) {
      errs.title = 'Title is required'
    } else if (title.trim().length > 100) {
      errs.title = 'Title must be 100 characters or less'
    }
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      errs.priority = 'Please select a valid priority'
    }
    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      errs.status = 'Please select a valid status'
    }
    if (dueDate && isNaN(Date.parse(dueDate))) {
      errs.dueDate = 'Please enter a valid date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as Task['priority'],
        status: status as Task['status'],
        dueDate: dueDate || null,
      })
    } catch (err: unknown) {
      // Server validation errors
      if (err && typeof err === 'object' && 'errors' in err) {
        setErrors(err.errors as FormErrors)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const titleLen = title.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'Create task'}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? '✎ Edit Task' : '+ New Task'}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="What needs to be done?"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })) }}
              maxLength={105}
              autoFocus
              aria-required="true"
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <div className={`char-counter ${titleLen > 90 ? 'warning' : ''} ${titleLen > 100 ? 'danger' : ''}`}>
              {titleLen}/100
            </div>
            {errors.title && (
              <div className="field-error" id="title-error" role="alert">⚠ {errors.title}</div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              className="form-textarea"
              placeholder="Add more details (optional)…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">
                Priority <span className="required">*</span>
              </label>
              <select
                id="task-priority"
                className={`form-select ${errors.priority ? 'error' : ''}`}
                value={priority}
                onChange={e => { setPriority(e.target.value); setErrors(prev => ({ ...prev, priority: undefined })) }}
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🔴 High</option>
              </select>
              {errors.priority && (
                <div className="field-error" role="alert">⚠ {errors.priority}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select
                id="task-status"
                className={`form-select ${errors.status ? 'error' : ''}`}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="PENDING">⏳ Pending</option>
                <option value="IN_PROGRESS">🔵 In Progress</option>
                <option value="COMPLETED">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              type="date"
              className={`form-input ${errors.dueDate ? 'error' : ''}`}
              value={dueDate}
              onChange={e => { setDueDate(e.target.value); setErrors(prev => ({ ...prev, dueDate: undefined })) }}
              style={{ colorScheme: 'dark' }}
            />
            {errors.dueDate && (
              <div className="field-error" role="alert">⚠ {errors.dueDate}</div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              id="btn-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              id="btn-form-submit"
            >
              {submitting ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
