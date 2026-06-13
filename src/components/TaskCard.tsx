'use client'

import { Task } from '@/app/page'

interface Props {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const isOverdue = date < now
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { formatted, isOverdue }
}

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus }: Props) {
  const due = formatDate(task.dueDate)
  const isCompleted = task.status === 'COMPLETED'

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  }

  const priorityLabels: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  }

  return (
    <article className={`task-card priority-${task.priority}`} id={`task-card-${task.id}`}>
      <div className="task-card-header">
        <h3 className={`task-title ${isCompleted ? 'completed' : ''}`}>
          {task.title}
        </h3>
        <div className="task-actions">
          <button
            className="btn-icon"
            onClick={onToggleStatus}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            id={`btn-toggle-${task.id}`}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted ? '↩' : '✓'}
          </button>
          <button
            className="btn-icon"
            onClick={onEdit}
            title="Edit task"
            id={`btn-edit-${task.id}`}
            aria-label="Edit task"
          >
            ✎
          </button>
          <button
            className="btn-icon delete"
            onClick={onDelete}
            title="Delete task"
            id={`btn-delete-${task.id}`}
            aria-label="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <span className={`badge badge-priority-${task.priority}`}>
          {priorityLabels[task.priority]}
        </span>
        <span className={`badge badge-status-${task.status}`}>
          {statusLabels[task.status]}
        </span>
        {due && (
          <span className={`task-due ${due.isOverdue && !isCompleted ? 'overdue' : ''}`}>
            📅 {due.formatted}
            {due.isOverdue && !isCompleted && ' (overdue)'}
          </span>
        )}
      </div>
    </article>
  )
}
