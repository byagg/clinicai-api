"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { FileText, RefreshCw, Clock, AlertCircle, Info, Send, Download } from "lucide-react"
import type { LogSession } from "@/types/logs"
import { formatDistanceToNow } from "date-fns"
import { sk } from "date-fns/locale"

export default function LogsList() {
  const [logSessions, setLogSessions] = useState<LogSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<LogSession | null>(null)
  const [newLogs, setNewLogs] = useState("")
  const [submittingLogs, setSubmittingLogs] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchLogSessions = async () => {
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
              name: "getLogSessions",
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setLogSessions(data.result)

        // If we have sessions but no selected session, select the first one
        if (data.result.length > 0 && !selectedSession) {
          setSelectedSession(data.result[0])
        }
      } else {
        setError("Nepodarilo sa načítať údaje o logoch")
      }
    } catch (err) {
      setError("Nastala chyba pri komunikácii so serverom")
    } finally {
      setLoading(false)
    }
  }

  const fetchLogSession = async (sessionId: string) => {
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
              name: "getLogSession",
              sessionId,
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setSelectedSession(data.result)

        // Update the session in the list
        setLogSessions((prev) => prev.map((session) => (session.id === data.result.id ? data.result : session)))
      }
    } catch (err) {
      console.error("Error fetching log session:", err)
    }
  }

  const submitLogs = async () => {
    if (!newLogs.trim()) return

    setSubmittingLogs(true)
    setError(null)

    try {
      const sessionId = selectedSession?.id || `session-${Date.now()}`

      const response = await fetch("/api/vapi-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.VAPI_SECRET ? { "X-VAPI-SECRET": process.env.VAPI_SECRET } : {}),
        },
        body: JSON.stringify({
          sessionId,
          message: newLogs,
        }),
      })

      if (response.ok) {
        setNewLogs("")
        await fetchLogSessions()

        // If we submitted to an existing session, refresh it
        if (selectedSession) {
          await fetchLogSession(sessionId)
        }
      } else {
        setError("Nepodarilo sa odoslať logy")
      }
    } catch (err) {
      setError("Nastala chyba pri odosielaní logov")
    } finally {
      setSubmittingLogs(false)
    }
  }

  // Fetch log sessions on component mount
  useEffect(() => {
    fetchLogSessions()

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchLogSessions, 30000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Scroll to bottom when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [selectedSession])

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "ERROR":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "WARN":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "CHECKPOINT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "LOG":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const downloadLogs = () => {
    if (!selectedSession) return

    const logText = selectedSession.entries
      .map((entry) => `${entry.timestamp} [${entry.type}] ${entry.message}`)
      .join("\n")

    const blob = new Blob([logText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vapi-logs-${selectedSession.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Logy VAPI</h2>
        <div className="flex gap-2">
          <Button onClick={fetchLogSessions} variant="outline" disabled={loading}>
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
              <CardTitle className="text-lg">Zoznam logov</CardTitle>
              <CardDescription>
                {logSessions.length > 0 ? `${logSessions.length} relácií logov` : "Žiadne logy"}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {loading && logSessions.length === 0 ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-20 w-full rounded-md" />
                    </div>
                  ))
              ) : logSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Žiadne logy neboli nájdené</p>
                  <p className="text-sm">Čakám na dáta z VAPI webhooku</p>
                </div>
              ) : (
                logSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`mb-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedSession?.id === session.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">Relácia {session.id.substring(0, 8)}</span>
                      </div>
                      <Badge variant="outline">{session.entries.length} záznamov</Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true, locale: sk })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedSession ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail logov</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(selectedSession.timestamp), { addSuffix: true, locale: sk })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadLogs}>
                      <Download className="h-4 w-4 mr-2" />
                      Stiahnuť
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 mb-4">
                  <div className="flex items-start mb-2">
                    <FileText className="h-4 w-4 mr-2 mt-1" />
                    <h4 className="font-medium">Logy relácie</h4>
                  </div>
                  <div
                    ref={logContainerRef}
                    className="font-mono text-xs overflow-auto max-h-[400px] whitespace-pre-wrap"
                  >
                    {selectedSession.entries.map((entry, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500">{entry.timestamp}</span>{" "}
                        <Badge className={`${getLogTypeColor(entry.type)} font-mono`}>{entry.type}</Badge>{" "}
                        <span>{entry.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pridať nové logy</h4>
                  <Textarea
                    value={newLogs}
                    onChange={(e) => setNewLogs(e.target.value)}
                    placeholder="Vložte logy vo formáte: HH:MM:SS:MMM [TYP] Správa"
                    className="font-mono h-32"
                  />
                  <div className="flex justify-end">
                    <Button onClick={submitLogs} disabled={submittingLogs || !newLogs.trim()}>
                      {submittingLogs ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Odosielam...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Odoslať logy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium mb-2">Žiadna relácia logov nie je vybraná</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Vyberte reláciu zo zoznamu pre zobrazenie detailov alebo pridajte nové logy.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {logSessions.length === 0 && !loading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
              <div>
                <h3 className="font-medium mb-2">Ako pridať logy</h3>
                <p className="text-muted-foreground mb-4">
                  Môžete pridať logy manuálne pomocou formulára alebo nastaviť VAPI webhook URL na:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm mb-4">
                  https://vaša-doména/api/vapi-actions
                </div>
                <p className="text-muted-foreground mb-2">
                  Logy by mali byť vo formáte: <code>HH:MM:SS:MMM [TYP] Správa</code>
                </p>
                <p className="text-muted-foreground">Podporované typy: LOG, WARN, ERROR, CHECKPOINT</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
