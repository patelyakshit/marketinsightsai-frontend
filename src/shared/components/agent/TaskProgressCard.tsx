import * as React from "react"
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  ExternalLink,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { Button } from "@/shared/components/ui/button"

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled"

export interface TaskOutput {
  type: "file" | "link" | "text"
  label: string
  value: string
  url?: string
}

export interface TaskInfo {
  id: string
  title: string
  description?: string
  status: TaskStatus
  progress: number
  startedAt?: Date
  completedAt?: Date
  estimatedTime?: number // in seconds
  error?: string
  outputs?: TaskOutput[]
}

interface TaskProgressCardProps {
  task: TaskInfo
  onCancel?: (taskId: string) => void
  onRetry?: (taskId: string) => void
  onDismiss?: (taskId: string) => void
  showDetails?: boolean
  className?: string
}

const statusConfig: Record<TaskStatus, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badgeVariant: "secondary" | "default" | "success" | "destructive" | "outline"
  color: string
}> = {
  queued: {
    icon: Clock,
    label: "Queued",
    badgeVariant: "secondary",
    color: "text-muted-foreground",
  },
  running: {
    icon: Loader2,
    label: "Running",
    badgeVariant: "default",
    color: "text-blue-600",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    badgeVariant: "success",
    color: "text-green-600",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    badgeVariant: "destructive",
    color: "text-red-600",
  },
  cancelled: {
    icon: X,
    label: "Cancelled",
    badgeVariant: "outline",
    color: "text-muted-foreground",
  },
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `~${seconds}s remaining`
  const minutes = Math.ceil(seconds / 60)
  return `~${minutes}m remaining`
}

function TaskProgressCard({
  task,
  onCancel,
  onRetry,
  onDismiss,
  showDetails = true,
  className,
}: TaskProgressCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const config = statusConfig[task.status]
  const StatusIcon = config.icon

  const duration = task.startedAt
    ? task.completedAt
      ? task.completedAt.getTime() - task.startedAt.getTime()
      : Date.now() - task.startedAt.getTime()
    : 0

  const timeRemaining = task.estimatedTime && task.status === "running"
    ? Math.max(0, task.estimatedTime - Math.floor(duration / 1000))
    : null

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("mt-0.5", config.color)}>
            <StatusIcon
              className={cn(
                "h-5 w-5",
                task.status === "running" && "animate-spin"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{task.title}</h4>
              <Badge variant={config.badgeVariant} size="sm">
                {config.label}
              </Badge>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {task.status === "running" && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(task.id)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {task.status === "failed" && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(task.id)}
              className="h-7 w-7 p-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          {(task.status === "completed" || task.status === "failed" || task.status === "cancelled") && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(task.id)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {(task.status === "running" || task.status === "queued") && (
        <div className="mt-3 space-y-1.5">
          <Progress
            value={task.progress}
            size="sm"
            variant={task.status === "running" ? "default" : "default"}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(task.progress)}%</span>
            {timeRemaining !== null && (
              <span>{formatTimeRemaining(timeRemaining)}</span>
            )}
            {task.startedAt && !timeRemaining && (
              <span>{formatDuration(duration)}</span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {task.status === "failed" && task.error && (
        <div className="mt-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-xs text-destructive">{task.error}</p>
        </div>
      )}

      {/* Outputs */}
      {task.status === "completed" && task.outputs && task.outputs.length > 0 && (
        <div className="mt-3 space-y-2">
          {showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span>{task.outputs.length} output{task.outputs.length > 1 ? "s" : ""}</span>
            </button>
          )}

          {(isExpanded || !showDetails) && (
            <div className="space-y-1.5">
              {task.outputs.map((output, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                >
                  {output.type === "file" && (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  {output.type === "link" && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}

                  <span className="text-xs flex-1 truncate">{output.label}</span>

                  {output.url && (
                    <a
                      href={output.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {output.type === "file" ? (
                          <Download className="h-3 w-3" />
                        ) : (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duration for completed tasks */}
      {task.status === "completed" && task.startedAt && task.completedAt && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Completed in {formatDuration(duration)}</span>
        </div>
      )}
    </div>
  )
}

interface TaskProgressListProps {
  tasks: TaskInfo[]
  onCancel?: (taskId: string) => void
  onRetry?: (taskId: string) => void
  onDismiss?: (taskId: string) => void
  onClearCompleted?: () => void
  className?: string
}

function TaskProgressList({
  tasks,
  onCancel,
  onRetry,
  onDismiss,
  onClearCompleted,
  className,
}: TaskProgressListProps) {
  const hasCompletedTasks = tasks.some(
    (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled"
  )

  if (tasks.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Background Tasks</h3>
        {hasCompletedTasks && onClearCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompleted}
            className="text-xs h-7"
          >
            Clear completed
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskProgressCard
            key={task.id}
            task={task}
            onCancel={onCancel}
            onRetry={onRetry}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  )
}

export { TaskProgressCard, TaskProgressList }
