import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type { VapiCall } from "@/types/call"
import type { VapiAssistant } from "@/types/assistant"
import type { LogEntry, LogSession } from "@/types/logs"

// Define the expected request body structures
interface FunctionCall {
  name: string
  [key: string]: any
}

interface Message {
  type: string
  functionCall?: FunctionCall
  [key: string]: any
}

interface RequestBody {
  message?: Message
  callId?: string
  callData?: any
  type?: string // Webhook type: speech-update, status-update, conversation-update
  conversation?: any
  speech?: any
  status?: any
  logs?: LogEntry[] // New field for logs
  sessionId?: string // New field for log session ID
  // VAPI Call fields
  id?: string
  orgId?: string
  createdAt?: string
  updatedAt?: string
  costs?: any[]
  messages?: any[]
  phoneCallTransport?: string
  status?: string
  endedReason?: string
  destination?: any
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: any
  artifactPlan?: any
  analysis?: any
  monitor?: any
  artifact?: any
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
  // VAPI Assistant fields
  transcriber?: any
  model?: any
  voice?: any
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  firstMessageMode?: string
  voicemailDetection?: any
  clientMessages?: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: string
  backgroundDenoisingEnabled?: boolean
  modelOutputInMessagesEnabled?: boolean
  transportConfigurations?: any[]
  observabilityPlan?: any
  credentials?: any[]
  hooks?: any[]
  compliancePlan?: any
  metadata?: any
  analysisPlan?: any
  messagePlan?: any
  startSpeakingPlan?: any
  stopSpeakingPlan?: any
  monitorPlan?: any
  credentialIds?: string[]
  server?: any
  keypadInputPlan?: any
  [key: string]: any
}

// In-memory storage for calls, conversations, assistants, and logs
let callsData: any[] = []
let conversationsData: any[] = []
let assistantsData: any[] = []
let logSessions: LogSession[] = []

// Get the secret from environment variables
const VAPI_SECRET = process.env.VAPI_SECRET || ""

// Parse log string into structured log entries
function parseLogString(logString: string): LogEntry[] {
  const lines = logString.trim().split("\n")
  const entries: LogEntry[] = []

  for (const line of lines) {
    // Try to match the format: timestamp [TYPE] message
    const match = line.match(/^(\d{2}:\d{2}:\d{2}:\d{3})\s+\[([A-Z]+)\]\s+(.+)$/)
    if (match) {
      entries.push({
        timestamp: match[1],
        type: match[2] as "LOG" | "WARN" | "ERROR" | "CHECKPOINT",
        message: match[3],
      })
    } else {
      // If it doesn't match the format, add it as a raw LOG entry
      entries.push({
        timestamp: new Date().toISOString(),
        type: "LOG",
        message: line,
      })
    }
  }

  return entries
}

export async function POST(request: Request) {
  try {
    // Get headers
    const headersList = headers()
    const secretHeader = headersList.get("X-VAPI-SECRET")

    // Parse the JSON body
    const body: RequestBody = await request.json()

    // Check if this is a function call (which doesn't need secret validation)
    const isFunctionCall = body.message?.type === "function-call"

    // Validate the secret for webhook requests (not for function calls)
    if (!isFunctionCall && VAPI_SECRET) {
      // If a secret is configured but not provided or doesn't match
      if (!secretHeader || secretHeader !== VAPI_SECRET) {
        console.error("Invalid or missing X-VAPI-SECRET header")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Log the incoming webhook for debugging (remove sensitive data in production)
    console.log("Received webhook:", JSON.stringify(body, null, 2))

    // Check if this is a log submission
    if (body.logs || (typeof body.message === "string" && body.sessionId)) {
      let logEntries: LogEntry[] = []

      // If logs are provided as an array, use them directly
      if (Array.isArray(body.logs)) {
        logEntries = body.logs
      }
      // If message is a string, try to parse it as logs
      else if (typeof body.message === "string") {
        logEntries = parseLogString(body.message)
      }

      if (logEntries.length > 0) {
        const sessionId = body.sessionId || `session-${Date.now()}`

        // Check if we already have this session
        const existingSessionIndex = logSessions.findIndex((session) => session.id === sessionId)

        if (existingSessionIndex >= 0) {
          // Update existing session
          logSessions[existingSessionIndex].entries = [...logSessions[existingSessionIndex].entries, ...logEntries]
        } else {
          // Create new session
          logSessions.push({
            id: sessionId,
            timestamp: new Date().toISOString(),
            entries: logEntries,
          })
        }

        // Keep only the last 20 sessions
        logSessions = logSessions.slice(0, 20)

        return NextResponse.json({ success: true, message: "Logs received" })
      }
    }

    // Check if this is a VAPI assistant configuration
    if (body.id && body.transcriber && body.model && body.voice) {
      // This is a VAPI assistant configuration
      const assistant: VapiAssistant = body as VapiAssistant

      // Store the assistant data
      const assistantInfo = {
        id: assistant.id,
        timestamp: assistant.updatedAt || assistant.createdAt || new Date().toISOString(),
        type: "vapi-assistant",
        data: assistant,
      }

      // Check if we already have this assistant
      const existingIndex = assistantsData.findIndex((a) => a.id === assistant.id)
      if (existingIndex >= 0) {
        // Update existing assistant
        assistantsData[existingIndex] = assistantInfo
      } else {
        // Add new assistant
        assistantsData = [assistantInfo, ...assistantsData].slice(0, 100) // Keep only the last 100 assistants
      }

      return NextResponse.json({ success: true, message: "VAPI assistant configuration received" })
    }

    // Check if this is a complete VAPI call record
    if (body.id && body.type && (body.type === "inboundPhoneCall" || body.type === "outboundPhoneCall")) {
      // This is a complete VAPI call record
      const vapiCall: VapiCall = body as VapiCall

      // Store the call data
      const callInfo = {
        id: vapiCall.id,
        timestamp: vapiCall.createdAt || new Date().toISOString(),
        type: "vapi-call",
        data: vapiCall,
      }

      // Add to our in-memory storage
      callsData = [callInfo, ...callsData].slice(0, 100) // Keep only the last 100 calls

      return NextResponse.json({ success: true, message: "VAPI call data received" })
    }

    // Handle different webhook types
    if (body.type) {
      switch (body.type) {
        case "speech-update":
          if (body.speech) {
            // Store speech update
            const speechUpdate = {
              id: `speech-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: "speech-update",
              data: body.speech,
            }

            // Add to conversations data
            conversationsData = [speechUpdate, ...conversationsData].slice(0, 100)
            return NextResponse.json({ success: true, message: "Speech update received" })
          }
          break

        case "status-update":
          if (body.status) {
            // Store status update
            const statusUpdate = {
              id: `status-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: "status-update",
              data: body.status,
            }

            // Add to conversations data
            conversationsData = [statusUpdate, ...conversationsData].slice(0, 100)
            return NextResponse.json({ success: true, message: "Status update received" })
          }
          break

        case "conversation-update":
          if (body.conversation) {
            // Store conversation update
            const conversationUpdate = {
              id: `conv-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: "conversation-update",
              data: body.conversation,
            }

            // Add to conversations data
            conversationsData = [conversationUpdate, ...conversationsData].slice(0, 100)
            return NextResponse.json({ success: true, message: "Conversation update received" })
          }
          break
      }
    }

    // Check if this is a call data webhook from VAPI
    if (body.callId && body.callData) {
      // Store the call data
      const callInfo = {
        id: body.callId,
        timestamp: new Date().toISOString(),
        type: "call-data",
        data: body.callData,
      }

      // Add to our in-memory storage
      callsData = [callInfo, ...callsData].slice(0, 100) // Keep only the last 100 calls

      return NextResponse.json({ success: true, message: "Call data received" })
    }

    // Handle function calls (original functionality)
    if (body.message?.type === "function-call") {
      if (body.message?.functionCall?.name === "getClinicInfo") {
        return NextResponse.json({ result: "Clinic: NUSCH, Bratislava" })
      } else if (body.message?.functionCall?.name === "getCallsData") {
        // Return the stored calls data
        return NextResponse.json({ result: callsData })
      } else if (body.message?.functionCall?.name === "getConversationsData") {
        // Return the stored conversations data
        return NextResponse.json({ result: conversationsData })
      } else if (body.message?.functionCall?.name === "getAssistantsData") {
        // Return the stored assistants data
        return NextResponse.json({ result: assistantsData })
      } else if (body.message?.functionCall?.name === "getLogSessions") {
        // Return the stored log sessions
        return NextResponse.json({ result: logSessions })
      } else if (body.message?.functionCall?.name === "getLogSession") {
        // Return a specific log session
        const sessionId = body.message?.functionCall?.sessionId
        if (sessionId) {
          const session = logSessions.find((s) => s.id === sessionId)
          return NextResponse.json({ result: session || null })
        }
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
      }
    }

    // If we reach here, we couldn't handle the request
    return NextResponse.json({
      success: true,
      message: "Webhook received but not processed specifically",
      receivedData: body,
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    // Handle any parsing errors
    return NextResponse.json(
      {
        error: "Invalid request body",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}
