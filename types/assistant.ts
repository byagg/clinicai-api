export interface TranscriberConfig {
  provider?: string
  confidenceThreshold?: number
  disablePartialTranscripts?: boolean
  endUtteranceSilenceThreshold?: number
  fallbackPlan?: {
    transcribers?: Array<{
      provider: string
      confidenceThreshold?: number
    }>
  }
  language?: string
  realtimeUrl?: string
  wordBoost?: string[]
}

export interface ModelConfig {
  provider?: string
  model?: string
  emotionRecognitionEnabled?: boolean
  knowledgeBase?: {
    server?: {
      url?: string
      timeoutSeconds?: number
      backoffPlan?: {
        maxRetries?: number
        type?: any
        baseDelaySeconds?: number
      }
    }
  }
  knowledgeBaseId?: string
  maxTokens?: number
  messages?: Array<{
    role: string
    [key: string]: any
  }>
  numFastTurns?: number
  temperature?: number
  toolIds?: string[]
  tools?: Array<{
    type: string
    async?: boolean
    [key: string]: any
  }>
}

export interface VoiceConfig {
  provider?: string
  voiceId?: string
  cachingEnabled?: boolean
  chunkPlan?: {
    enabled?: boolean
    minCharacters?: number
    punctuationBoundaries?: string[]
    formatPlan?: {
      enabled?: boolean
      numberToDigitsCutoff?: number
    }
  }
  fallbackPlan?: {
    voices?: Array<{
      provider: string
      voiceId: string
      cachingEnabled?: boolean
    }>
  }
  speed?: number
}

export interface VoicemailDetectionConfig {
  provider?: string
  backoffPlan?: {
    startAtSeconds?: number
    frequencySeconds?: number
    maxRetries?: number
  }
  beepMaxAwaitSeconds?: number
}

export interface TransportConfig {
  provider: string
  timeout?: number
  record?: boolean
  recordingChannels?: string
}

export interface ObservabilityPlanConfig {
  provider?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CredentialConfig {
  provider: string
  apiKey: string
  name?: string
}

export interface HookConfig {
  on: string
  do: Array<{
    type: string
    [key: string]: any
  }>
  filters?: Array<{
    type: string
    key?: string
    oneOf?: string[]
    [key: string]: any
  }>
}

export interface CompliancePlanConfig {
  hipaaEnabled?: boolean
  pciEnabled?: boolean
}

export interface AnalysisPlanConfig {
  summaryPlan?: {
    messages?: Array<Record<string, any>>
    enabled?: boolean
    timeoutSeconds?: number
  }
  structuredDataPlan?: {
    messages?: Array<Record<string, any>>
    enabled?: boolean
    schema?: any
    timeoutSeconds?: number
  }
  structuredDataMultiPlan?: Array<{
    key: string
    plan: any
  }>
  successEvaluationPlan?: {
    rubric?: string
    messages?: Array<Record<string, any>>
    enabled?: boolean
    timeoutSeconds?: number
  }
}

export interface ArtifactPlanConfig {
  recordingEnabled?: boolean
  recordingFormat?: string
  videoRecordingEnabled?: boolean
  pcapEnabled?: boolean
  pcapS3PathPrefix?: string
  transcriptPlan?: {
    enabled?: boolean
    assistantName?: string
    userName?: string
  }
  recordingPath?: string
}

export interface MessagePlanConfig {
  idleMessages?: string[]
  idleMessageMaxSpokenCount?: number
  idleMessageResetCountOnUserSpeechEnabled?: boolean
  idleTimeoutSeconds?: number
  silenceTimeoutMessage?: string
}

export interface StartSpeakingPlanConfig {
  waitSeconds?: number
  smartEndpointingPlan?: {
    provider?: string
  }
  customEndpointingRules?: Array<{
    type: string
    regex?: string
    timeoutSeconds?: number
  }>
  transcriptionEndpointingPlan?: {
    onPunctuationSeconds?: number
    onNoPunctuationSeconds?: number
    onNumberSeconds?: number
  }
  smartEndpointingEnabled?: boolean
}

export interface StopSpeakingPlanConfig {
  numWords?: number
  voiceSeconds?: number
  backoffSeconds?: number
  acknowledgementPhrases?: string[]
  interruptionPhrases?: string[]
}

export interface MonitorPlanConfig {
  listenEnabled?: boolean
  controlEnabled?: boolean
}

export interface ServerConfig {
  url?: string
  timeoutSeconds?: number
  secret?: string
  headers?: Record<string, string>
  backoffPlan?: {
    maxRetries?: number
    type?: any
    baseDelaySeconds?: number
  }
}

export interface KeypadInputPlanConfig {
  enabled?: boolean
  timeoutSeconds?: number
  delimiters?: string
}

export interface VapiAssistant {
  id: string
  orgId?: string
  createdAt?: string
  updatedAt?: string
  transcriber?: TranscriberConfig
  model?: ModelConfig
  voice?: VoiceConfig
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  firstMessageMode?: string
  voicemailDetection?: VoicemailDetectionConfig
  clientMessages?: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: string
  backgroundDenoisingEnabled?: boolean
  modelOutputInMessagesEnabled?: boolean
  transportConfigurations?: TransportConfig[]
  observabilityPlan?: ObservabilityPlanConfig
  credentials?: CredentialConfig[]
  hooks?: HookConfig[]
  name?: string
  voicemailMessage?: string
  endCallMessage?: string
  endCallPhrases?: string[]
  compliancePlan?: CompliancePlanConfig
  metadata?: Record<string, any>
  analysisPlan?: AnalysisPlanConfig
  artifactPlan?: ArtifactPlanConfig
  messagePlan?: MessagePlanConfig
  startSpeakingPlan?: StartSpeakingPlanConfig
  stopSpeakingPlan?: StopSpeakingPlanConfig
  monitorPlan?: MonitorPlanConfig
  credentialIds?: string[]
  server?: ServerConfig
  keypadInputPlan?: KeypadInputPlanConfig
}
