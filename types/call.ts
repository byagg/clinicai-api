export interface VapiCallCost {
  transport?: number
  stt?: number
  llm?: number
  tts?: number
  vapi?: number
  total?: number
  llmPromptTokens?: number
  llmCompletionTokens?: number
  ttsCharacters?: number
  analysisCostBreakdown?: {
    summary?: number
    summaryPromptTokens?: number
    summaryCompletionTokens?: number
    structuredData?: number
    structuredDataPromptTokens?: number
    structuredDataCompletionTokens?: number
    successEvaluation?: number
    successEvaluationPromptTokens?: number
    successEvaluationCompletionTokens?: number
  }
}

export interface VapiCallMessage {
  role?: string
  message?: string
  time?: number
  endTime?: number
  secondsFromStart?: number
  duration?: number
}

export interface VapiCallArtifact {
  messages?: VapiCallMessage[]
  messagesOpenAIFormatted?: any[]
  recording?: {
    stereoUrl?: string
    videoUrl?: string
    videoRecordingStartDelaySeconds?: number
  }
  transcript?: string
  pcapUrl?: string
  recordingUrl?: string
  stereoRecordingUrl?: string
  videoRecordingUrl?: string
  videoRecordingStartDelaySeconds?: number
}

export interface VapiCallAnalysis {
  summary?: string
  structuredData?: any
  structuredDataMulti?: any[]
  successEvaluation?: string
}

export interface VapiCall {
  id: string
  orgId?: string
  createdAt?: string
  updatedAt?: string
  type?: string
  costs?: any[]
  messages?: VapiCallMessage[]
  phoneCallTransport?: string
  status?: string
  endedReason?: string
  destination?: any
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: VapiCallCost
  artifactPlan?: any
  analysis?: VapiCallAnalysis
  monitor?: {
    listenUrl?: string
    controlUrl?: string
  }
  artifact?: VapiCallArtifact
  assistantId?: string
  assistant?: any
  assistantOverrides?: any
  squadId?: string
  squad?: any
  workflowId?: string
  workflow?: any
  phoneNumberId?: string
  phoneNumber?: any
  customerId?: string
  customer?: any
  name?: string
  schedulePlan?: any
  transport?: any
  phoneCallProvider?: string
  phoneCallProviderId?: string
}

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
  data: CallData | VapiCall | any
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
