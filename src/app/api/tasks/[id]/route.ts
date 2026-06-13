import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

// GET /api/tasks/[id] — get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return NextResponse.json({ task })
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

// PUT /api/tasks/[id] — update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, priority, status, dueDate } = body

    // Check exists
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Validation
    const errors: Record<string, string> = {}
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        errors.title = 'Title cannot be empty'
      } else if (title.trim().length > 100) {
        errors.title = 'Title must be 100 characters or less'
      }
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.priority = 'Priority must be LOW, MEDIUM, or HIGH'
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.status = 'Status must be PENDING, IN_PROGRESS, or COMPLETED'
    }
    if (dueDate && isNaN(Date.parse(dueDate))) {
      errors.dueDate = 'Due date must be a valid date'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
