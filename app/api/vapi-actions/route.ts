import { NextResponse } from "next/server"

// Define the expected request body structure
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
  [key: string]: any
}

// In-memory storage for calls (in a real app, this would be a database)
let callsData: any[] = []

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body: RequestBody = await request.json()

    // Check if this is a call data webhook from VAPI
    if (body.callId && body.callData) {
      // Store the call data
      const callInfo = {
        id: body.callId,
        timestamp: new Date().toISOString(),
        data: body.callData,
      }

      // Add to our in-memory storage
      callsData = [callInfo, ...callsData].slice(0, 100) // Keep only the last 100 calls

      return NextResponse.json({ success: true, message: "Call data received" })
    }

    // Handle function calls (original functionality)
    if (body.message?.type === "function-call" && body.message?.functionCall?.name === "getClinicInfo") {
      return NextResponse.json({ result: "Clinic: NUSCH, Bratislava" })
    } else if (body.message?.type === "function-call" && body.message?.functionCall?.name === "getCallsData") {
      // Return the stored calls data
      return NextResponse.json({ result: callsData })
    } else {
      // Return error for unknown function
      return NextResponse.json({ error: "Unknown function or invalid request" }, { status: 400 })
    }
  } catch (error) {
    // Handle any parsing errors
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
