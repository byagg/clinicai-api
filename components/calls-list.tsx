"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Phone,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  MessageSquare,
  Info,
  FileText,
  Headphones,
  DollarSign,
} from "lucide-react"
import type { Call, VapiCall } from "@/types/call"
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
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-"
    return new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(amount)
  }

  const getCallName = (call: Call) => {
    if (call.type === "vapi-call") {
      const vapiCall = call.data as VapiCall
      return vapiCall.name || `Hovor ${vapiCall.id.substring(0, 8)}`
    } else if (call.data.caller) {
      return call.data.caller
    } else {
      return `Hovor ${call.id.substring(0, 8)}`
    }
  }

  const getCallStatus = (call: Call) => {
    if (call.type === "vapi-call") {
      return call.data.status
    } else {
      return call.data.status
    }
  }

  const getCallTime = (call: Call) => {
    if (call.type === "vapi-call") {
      return call.data.startedAt || call.data.createdAt
    } else {
      return call.data.startTime
    }
  }

  const getCallDuration = (call: Call) => {
    if (call.type === "vapi-call") {
      if (call.data.startedAt && call.data.endedAt) {
        const start = new Date(call.data.startedAt).getTime()
        const end = new Date(call.data.endedAt).getTime()
        return Math.floor((end - start) / 1000)
      }
      return 0
    } else {
      return call.data.duration
    }
  }

  const isVapiCall = (call: Call) => {
    return call.type === "vapi-call"
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
                        <span className="font-medium">{getCallName(call)}</span>
                      </div>
                      <Badge className={getStatusColor(getCallStatus(call))}>
                        {getCallStatus(call) === "completed"
                          ? "Dokončený"
                          : getCallStatus(call) === "missed"
                            ? "Zmeškaný"
                            : getCallStatus(call) === "failed"
                              ? "Neúspešný"
                              : getCallStatus(call) === "scheduled"
                                ? "Naplánovaný"
                                : getCallStatus(call)}
                      </Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(getCallTime(call))}
                      </div>
                      <div>{getCallDuration(call) ? `${formatDuration(getCallDuration(call))}` : ""}</div>
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
                  <Badge className={getStatusColor(getCallStatus(selectedCall))}>
                    {getCallStatus(selectedCall) === "completed"
                      ? "Dokončený"
                      : getCallStatus(selectedCall) === "missed"
                        ? "Zmeškaný"
                        : getCallStatus(selectedCall) === "failed"
                          ? "Neúspešný"
                          : getCallStatus(selectedCall) === "scheduled"
                            ? "Naplánovaný"
                            : getCallStatus(selectedCall)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informácie</TabsTrigger>
                    {isVapiCall(selectedCall) && selectedCall.data.artifact?.transcript && (
                      <TabsTrigger value="transcript">Transkripcia</TabsTrigger>
                    )}
                    {!isVapiCall(selectedCall) && selectedCall.data.transcription && (
                      <TabsTrigger value="transcript">Transkripcia</TabsTrigger>
                    )}
                    {isVapiCall(selectedCall) && selectedCall.data.analysis && (
                      <TabsTrigger value="analysis">Analýza</TabsTrigger>
                    )}
                    {isVapiCall(selectedCall) && selectedCall.data.costBreakdown && (
                      <TabsTrigger value="costs">Náklady</TabsTrigger>
                    )}
                    {isVapiCall(selectedCall) && <TabsTrigger value="raw">Raw Data</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        {isVapiCall(selectedCall) ? (
                          <>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">ID hovoru</h4>
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                <span>{selectedCall.data.id}</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Typ hovoru</h4>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                <span>
                                  {selectedCall.data.type === "inboundPhoneCall"
                                    ? "Prichádzajúci hovor"
                                    : selectedCall.data.type === "outboundPhoneCall"
                                      ? "Odchádzajúci hovor"
                                      : selectedCall.data.type}
                                </span>
                              </div>
                            </div>
                            {selectedCall.data.endedReason && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Dôvod ukončenia</h4>
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  <span>{selectedCall.data.endedReason}</span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        {isVapiCall(selectedCall) ? (
                          <>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Čas začiatku</h4>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>
                                  {selectedCall.data.startedAt
                                    ? new Date(selectedCall.data.startedAt).toLocaleString("sk-SK")
                                    : "Neznámy"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Čas ukončenia</h4>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>
                                  {selectedCall.data.endedAt
                                    ? new Date(selectedCall.data.endedAt).toLocaleString("sk-SK")
                                    : "Neznámy"}
                                </span>
                              </div>
                            </div>

                            {selectedCall.data.artifact?.recordingUrl && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Nahrávka</h4>
                                <div className="flex items-center">
                                  <Headphones className="h-4 w-4 mr-2" />
                                  <a
                                    href={selectedCall.data.artifact.recordingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Prehrať nahrávku
                                  </a>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
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
                                  {selectedCall.data.topics.map((topic: string, index: number) => (
                                    <Badge key={index} variant="outline">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transcript">
                    {isVapiCall(selectedCall) && selectedCall.data.artifact?.transcript ? (
                      <div className="p-4 bg-muted rounded-md">
                        <div className="flex items-start mb-2">
                          <MessageSquare className="h-4 w-4 mr-2 mt-1" />
                          <h4 className="font-medium">Transkripcia hovoru</h4>
                        </div>
                        <p className="whitespace-pre-line">{selectedCall.data.artifact.transcript}</p>
                      </div>
                    ) : !isVapiCall(selectedCall) && selectedCall.data.transcription ? (
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

                  <TabsContent value="analysis">
                    {isVapiCall(selectedCall) && selectedCall.data.analysis ? (
                      <div className="space-y-4">
                        {selectedCall.data.analysis.summary && (
                          <div className="p-4 bg-muted rounded-md">
                            <div className="flex items-start mb-2">
                              <FileText className="h-4 w-4 mr-2 mt-1" />
                              <h4 className="font-medium">Zhrnutie hovoru</h4>
                            </div>
                            <p className="whitespace-pre-line">{selectedCall.data.analysis.summary}</p>
                          </div>
                        )}

                        {selectedCall.data.analysis.structuredData && (
                          <div className="p-4 bg-muted rounded-md">
                            <div className="flex items-start mb-2">
                              <FileText className="h-4 w-4 mr-2 mt-1" />
                              <h4 className="font-medium">Štruktúrované dáta</h4>
                            </div>
                            <pre className="text-xs overflow-auto max-h-[200px]">
                              {JSON.stringify(selectedCall.data.analysis.structuredData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {selectedCall.data.analysis.successEvaluation && (
                          <div className="p-4 bg-muted rounded-md">
                            <div className="flex items-start mb-2">
                              <FileText className="h-4 w-4 mr-2 mt-1" />
                              <h4 className="font-medium">Vyhodnotenie úspešnosti</h4>
                            </div>
                            <p className="whitespace-pre-line">{selectedCall.data.analysis.successEvaluation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Analýza nie je k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="costs">
                    {isVapiCall(selectedCall) && selectedCall.data.costBreakdown ? (
                      <div className="p-4 bg-muted rounded-md">
                        <div className="flex items-start mb-4">
                          <DollarSign className="h-4 w-4 mr-2 mt-1" />
                          <h4 className="font-medium">Náklady na hovor</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Základné náklady</h5>
                            <table className="w-full text-sm">
                              <tbody>
                                <tr>
                                  <td className="py-1">Transport:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.transport)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">STT (Speech-to-Text):</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.stt)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">LLM:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.llm)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">TTS (Text-to-Speech):</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.tts)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">VAPI:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.vapi)}
                                  </td>
                                </tr>
                                <tr className="font-medium border-t">
                                  <td className="py-1">Celkom:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.total)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium mb-2">Detaily využitia</h5>
                            <table className="w-full text-sm">
                              <tbody>
                                <tr>
                                  <td className="py-1">LLM prompt tokeny:</td>
                                  <td className="py-1 text-right">
                                    {selectedCall.data.costBreakdown.llmPromptTokens?.toLocaleString() || "-"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">LLM completion tokeny:</td>
                                  <td className="py-1 text-right">
                                    {selectedCall.data.costBreakdown.llmCompletionTokens?.toLocaleString() || "-"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">TTS znaky:</td>
                                  <td className="py-1 text-right">
                                    {selectedCall.data.costBreakdown.ttsCharacters?.toLocaleString() || "-"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {selectedCall.data.costBreakdown.analysisCostBreakdown && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Náklady na analýzu</h5>
                            <table className="w-full text-sm">
                              <tbody>
                                <tr>
                                  <td className="py-1">Zhrnutie:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(selectedCall.data.costBreakdown.analysisCostBreakdown.summary)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">Štruktúrované dáta:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(
                                      selectedCall.data.costBreakdown.analysisCostBreakdown.structuredData,
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1">Vyhodnotenie úspešnosti:</td>
                                  <td className="py-1 text-right">
                                    {formatCurrency(
                                      selectedCall.data.costBreakdown.analysisCostBreakdown.successEvaluation,
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Informácie o nákladoch nie sú k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw">
                    {isVapiCall(selectedCall) ? (
                      <div className="p-4 bg-muted rounded-md">
                        <div className="flex items-start mb-2">
                          <FileText className="h-4 w-4 mr-2 mt-1" />
                          <h4 className="font-medium">Raw dáta hovoru</h4>
                        </div>
                        <pre className="text-xs overflow-auto max-h-[400px]">
                          {JSON.stringify(selectedCall.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Raw dáta nie sú k dispozícii</p>
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
                <p className="text-muted-foreground mb-2">
                  VAPI posiela rôzne typy dát, vrátane kompletných záznamov o hovoroch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
