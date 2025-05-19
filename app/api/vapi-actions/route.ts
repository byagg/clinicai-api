Create an API endpoint called `vapi-actions` using Next.js 13+ App Router and TypeScript.
The endpoint should:
- Accept a POST request with a JSON body.
- Parse the JSON body to get a `message` object.
- If `message.type` is "function-call" and `message.functionCall.name` is "getClinicInfo", return JSON `{ result: "Clinic: NUSCH, Bratislava" }`
- Otherwise, return JSON `{ error: "Unknown function" }` with status 400.
