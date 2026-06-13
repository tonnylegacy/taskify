import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

// GET /api/tasks — list all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: Record<string, string> = {}
    if (status && VALID_STATUSES.includes(status)) where.status = status
    if (priority && VALID_PRIORITIES.includes(priority)) where.priority = priority

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks — create a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, status, dueDate } = body

    // Validation
    const errors: Record<string, string> = {}
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Title is required'
    } else if (title.trim().length > 100) {
      errors.title = 'Title must be 100 characters or less'
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

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
