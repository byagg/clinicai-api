export interface LogEntry {
  timestamp: string
  type: "LOG" | "WARN" | "ERROR" | "CHECKPOINT"
  message: string
}

export interface LogSession {
  id: string
  timestamp: string
  entries: LogEntry[]
}
