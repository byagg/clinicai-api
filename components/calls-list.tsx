"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Phone, RefreshCw, Clock, User, AlertCircle, MessageSquare, Info } from "lucide-react"
import type { Call } from "@/types/call"
import { formatDistanceToNow } from "date-fns"
import { sk } from "date-fns/locale"

export default function CallsList() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  const fetchCalls = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vapi-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            type: "function-call",
            functionCall: {
              name: "getCallsData",
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setCalls(data.result)

        // If we have calls but no selected call, select the first one
        if (data.result.length > 0 && !selectedCall) {
          setSelectedCall(data.result[0])
        }
      } else {
        setError("Nepodarilo sa načítať údaje o hovoroch")
      }
    } catch (err) {
      setError("Nastala chyba pri komunikácii so serverom")
    } finally {
      setLoading(false)
    }
  }

  // Fetch calls on component mount
  useEffect(() => {
    fetchCalls()

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchCalls, 30000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "missed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "neutral":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    return date.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Hovory z VAPI</h2>
        <div className="flex gap-2">
          <Button onClick={fetchCalls} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Zoznam hovorov</CardTitle>
              <CardDescription>
                {calls.length > 0 ? `${calls.length} hovorov prijatých` : "Žiadne hovory"}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {loading && calls.length === 0 ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-20 w-full rounded-md" />
                    </div>
                  ))
              ) : calls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Žiadne hovory neboli nájdené</p>
                  <p className="text-sm">Čakám na dáta z VAPI webhooku</p>
                </div>
              ) : (
                calls.map((call) => (
                  <div
                    key={call.id}
                    className={`mb-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedCall?.id === call.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{call.data.caller}</span>
                      </div>
                      <Badge className={getStatusColor(call.data.status)}>
                        {call.data.status === "completed"
                          ? "Dokončený"
                          : call.data.status === "missed"
                            ? "Zmeškaný"
                            : call.data.status === "failed"
                              ? "Neúspešný"
                              : call.data.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(call.data.startTime)}
                      </div>
                      <div>{call.data.duration ? `${formatDuration(call.data.duration)}` : ""}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedCall ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail hovoru</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(selectedCall.timestamp), { addSuffix: true, locale: sk })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedCall.data.status)}>
                    {selectedCall.data.status === "completed"
                      ? "Dokončený"
                      : selectedCall.data.status === "missed"
                        ? "Zmeškaný"
                        : selectedCall.data.status === "failed"
                          ? "Neúspešný"
                          : selectedCall.data.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informácie</TabsTrigger>
                    <TabsTrigger value="transcript" disabled={!selectedCall.data.transcription}>
                      Transkripcia
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Volajúci</h4>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>{selectedCall.data.caller || "Neznámy"}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Prijímateľ</h4>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>{selectedCall.data.recipient || "Neznámy"}</span>
                          </div>
                        </div>

                        {selectedCall.data.sentiment && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Sentiment</h4>
                            <Badge className={getSentimentColor(selectedCall.data.sentiment)}>
                              {selectedCall.data.sentiment === "positive"
                                ? "Pozitívny"
                                : selectedCall.data.sentiment === "neutral"
                                  ? "Neutrálny"
                                  : selectedCall.data.sentiment === "negative"
                                    ? "Negatívny"
                                    : selectedCall.data.sentiment}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Čas začiatku</h4>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {selectedCall.data.startTime
                                ? new Date(selectedCall.data.startTime).toLocaleString("sk-SK")
                                : "Neznámy"}
                            </span>
                          </div>
                        </div>

                        {selectedCall.data.duration > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Trvanie</h4>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{formatDuration(selectedCall.data.duration)}</span>
                            </div>
                          </div>
                        )}

                        {selectedCall.data.topics && selectedCall.data.topics.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Témy</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedCall.data.topics.map((topic, index) => (
                                <Badge key={index} variant="outline">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transcript">
                    {selectedCall.data.transcription ? (
                      <div className="p-4 bg-muted rounded-md">
                        <div className="flex items-start mb-2">
                          <MessageSquare className="h-4 w-4 mr-2 mt-1" />
                          <h4 className="font-medium">Transkripcia hovoru</h4>
                        </div>
                        <p className="whitespace-pre-line">{selectedCall.data.transcription}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Transkripcia nie je k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium mb-2">Žiadny hovor nie je vybraný</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Vyberte hovor zo zoznamu pre zobrazenie detailov alebo počkajte na prijatie dát z VAPI.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {calls.length === 0 && !loading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
              <div>
                <h3 className="font-medium mb-2">Ako nastaviť VAPI webhook</h3>
                <p className="text-muted-foreground mb-4">
                  Pre prijímanie dát o hovoroch z VAPI je potrebné nastaviť webhook URL na:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm mb-4">
                  https://vaša-doména/api/vapi-actions
                </div>
                <p className="text-muted-foreground mb-2">VAPI by malo posielať dáta v tomto formáte:</p>
                <pre className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto">
                  {JSON.stringify(
                    {
                      callId: "unikátne-id-hovoru",
                      callData: {
                        caller: "+421xxxxxxxxx",
                        recipient: "+421xxxxxxxxx",
                        duration: 120,
                        status: "completed",
                        startTime: "2023-12-01T12:00:00Z",
                        endTime: "2023-12-01T12:02:00Z",
                        transcription: "Text transkripcie hovoru...",
                        sentiment: "positive",
                        topics: ["appointment", "prescription"],
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
