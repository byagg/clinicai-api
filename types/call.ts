export interface CallData {
  caller?: string
  recipient?: string
  duration?: number
  status?: string
  startTime?: string
  endTime?: string
  transcription?: string
  sentiment?: string
  topics?: string[]
  [key: string]: any
}

export interface Call {
  id: string
  timestamp: string
  data: CallData
}
