import { NextResponse } from "next/server"

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
  [key: string]: any
}

// In-memory storage for calls and conversations
let callsData: any[] = []
let conversationsData: any[] = []

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body: RequestBody = await request.json()

    // Log the incoming webhook for debugging
    console.log("Received webhook:", JSON.stringify(body, null, 2))

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
