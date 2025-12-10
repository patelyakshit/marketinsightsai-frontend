import * as React from "react"
import {
  Brain,
  Cpu,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  Database,
  X,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Badge } from "@/shared/components/ui/badge"
import { Progress, IndeterminateProgress } from "@/shared/components/ui/progress"

// Agent execution step types
export type AgentStepStatus = "pending" | "thinking" | "executing" | "completed" | "error"

export interface AgentStep {
  id: string
  type: "plan" | "search" | "analyze" | "generate" | "verify" | "execute"
  title: string
  description?: string
  status: AgentStepStatus
  progress?: number
  startTime?: number
  endTime?: number
  details?: string[]
  output?: string
}

export interface AgentTask {
  id: string
  title: string
  status: AgentStepStatus
  steps: AgentStep[]
  totalProgress: number
  currentStepIndex: number
}

interface AgentWorkspacePanelProps {
  task?: AgentTask | null
  isOpen: boolean
  onClose: () => void
  className?: string
}

const stepIcons = {
  plan: Brain,
  search: Search,
  analyze: Database,
  generate: Sparkles,
  verify: CheckCircle,
  execute: Cpu,
}

const statusConfig = {
  pending: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Pending",
  },
  thinking: {
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    label: "Thinking",
  },
  executing: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Executing",
  },
  completed: {
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed",
  },
  error: {
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Error",
  },
}

function StepItem({ step, isExpanded, onToggle }: {
  step: AgentStep
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = stepIcons[step.type]
  const config = statusConfig[step.status]
  const duration = step.startTime && step.endTime
    ? ((step.endTime - step.startTime) / 1000).toFixed(1)
    : null

  return (
    <div className="border-l-2 border-border pl-4 pb-4 last:pb-0 relative">
      {/* Status dot */}
      <div
        className={cn(
          "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-background",
          config.bgColor
        )}
      >
        {step.status === "thinking" || step.status === "executing" ? (
          <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-current" />
        ) : null}
      </div>

      <button
        onClick={onToggle}
        className="flex items-start gap-3 w-full text-left hover:bg-muted/50 rounded-md p-2 -ml-2 transition-colors"
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{step.title}</span>
            <Badge variant={step.status === "completed" ? "success" : step.status === "error" ? "destructive" : "secondary"} size="sm">
              {config.label}
            </Badge>
            {duration && (
              <span className="text-xs text-muted-foreground">{duration}s</span>
            )}
          </div>

          {step.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {step.description}
            </p>
          )}

          {(step.status === "thinking" || step.status === "executing") && (
            <div className="mt-2">
              {step.progress !== undefined ? (
                <Progress value={step.progress} size="sm" className="w-full" />
              ) : (
                <IndeterminateProgress size="sm" className="w-full" />
              )}
            </div>
          )}
        </div>

        {step.details && step.details.length > 0 && (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && step.details && step.details.length > 0 && (
        <div className="mt-2 ml-7 space-y-1">
          {step.details.map((detail, idx) => (
            <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/50">-</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output preview */}
      {step.output && step.status === "completed" && (
        <div className="mt-2 ml-7 p-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground line-clamp-3">{step.output}</p>
        </div>
      )}
    </div>
  )
}

function AgentWorkspacePanel({
  task,
  isOpen,
  onClose,
  className,
}: AgentWorkspacePanelProps) {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set())

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border-l",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold">Agent Workspace</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {task ? (
          <div className="space-y-4">
            {/* Task header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h4 className="font-medium">{task.title}</h4>
              </div>

              {/* Overall progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{Math.round(task.totalProgress)}%</span>
                </div>
                <Progress value={task.totalProgress} size="sm" variant="default" />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-0 mt-6">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Execution Steps
              </h5>
              {task.steps.map((step) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              No active task
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Agent steps will appear here when processing
            </p>
          </div>
        )}
      </div>

      {/* Footer with agent status */}
      {task && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.status === "thinking" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                <span>Agent is thinking...</span>
              </>
            )}
            {task.status === "executing" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span>Executing step {task.currentStepIndex + 1} of {task.steps.length}</span>
              </>
            )}
            {task.status === "completed" && (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Task completed successfully</span>
              </>
            )}
            {task.status === "error" && (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span>Task encountered an error</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { AgentWorkspacePanel }
