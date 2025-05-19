"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Send } from "lucide-react"

export default function WebhookTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestPayload, setRequestPayload] = useState(
    JSON.stringify(
      {
        message: {
          type: "function-call",
          functionCall: {
            name: "getClinicInfo",
          },
        },
      },
      null,
      2,
    ),
  )

  const handleSendRequest = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Validate JSON
      const payload = JSON.parse(requestPayload)

      // Send request to the API endpoint
      const res = await fetch("/api/vapi-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Parse the response
      const data = await res.json()

      // Set the response
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nastala neočakávaná chyba")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalidRequest = () => {
    setRequestPayload(
      JSON.stringify(
        {
          message: {
            type: "function-call",
            functionCall: {
              name: "unknownFunction",
            },
          },
        },
        null,
        2,
      ),
    )
  }

  const handleValidRequest = () => {
    setRequestPayload(
      JSON.stringify(
        {
          message: {
            type: "function-call",
            functionCall: {
              name: "getClinicInfo",
            },
          },
        },
        null,
        2,
      ),
    )
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Tester Webhooku</CardTitle>
        <CardDescription>Otestujte API endpoint odoslaním požiadavky a sledovaním odpovede</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Požiadavka (JSON)</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={handleValidRequest}>
                  Platná požiadavka
                </Button>
                <Button variant="outline" size="sm" onClick={handleInvalidRequest}>
                  Neplatná požiadavka
                </Button>
              </div>
            </div>
            <Textarea
              value={requestPayload}
              onChange={(e) => setRequestPayload(e.target.value)}
              className="font-mono h-48"
              placeholder="Zadajte JSON požiadavku..."
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chyba</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Odpoveď</h3>
              <Tabs defaultValue="formatted">
                <TabsList className="mb-2">
                  <TabsTrigger value="formatted">Formátovaná</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-sm font-medium ${response.status < 400 ? "text-green-500" : "text-red-500"}`}
                      >
                        Status: {response.status} {response.statusText}
                      </span>
                      {response.status < 400 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      {Object.entries(response.data).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium mr-2">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="raw">
                  <pre className="p-4 bg-muted rounded-md overflow-auto text-sm">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSendRequest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Odosielam...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Odoslať požiadavku
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
