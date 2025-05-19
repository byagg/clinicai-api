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
  message: Message
  [key: string]: any
}

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body: RequestBody = await request.json()

    // Extract the message object
    const { message } = body

    // Check if message.type is "function-call" and message.functionCall.name is "getClinicInfo"
    if (message.type === "function-call" && message.functionCall && message.functionCall.name === "getClinicInfo") {
      // Return the successful response
      return NextResponse.json({ result: "Clinic: NUSCH, Bratislava" })
    } else {
      // Return error for unknown function
      return NextResponse.json({ error: "Unknown function" }, { status: 400 })
    }
  } catch (error) {
    // Handle any parsing errors
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
