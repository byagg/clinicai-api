import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type { VapiCall } from "@/types/call"

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
  [key: string]: any
}

// In-memory storage for calls and conversations
let callsData: any[] = []
let conversationsData: any[] = []

// Get the secret from environment variables
const VAPI_SECRET = process.env.VAPI_SECRET || ""

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
