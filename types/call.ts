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
  type: string
  data: CallData | any
}

export interface ConversationData {
  messages?: Array<{
    role: string
    content: string
  }>
  transcript?: string
  status?: string
  [key: string]: any
}

export interface Conversation {
  id: string
  timestamp: string
  type: string
  data: ConversationData | any
}
