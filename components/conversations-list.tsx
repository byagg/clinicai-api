"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, RefreshCw, Clock, AlertCircle, Info } from "lucide-react"
import type { Conversation } from "@/types/call"
import { formatDistanceToNow } from "date-fns"
import { sk } from "date-fns/locale"

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const fetchConversations = async () => {
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
              name: "getConversationsData",
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setConversations(data.result)

        // If we have conversations but no selected conversation, select the first one
        if (data.result.length > 0 && !selectedConversation) {
          setSelectedConversation(data.result[0])
        }
      } else {
        setError("Nepodarilo sa načítať údaje o konverzáciách")
      }
    } catch (err) {
      setError("Nastala chyba pri komunikácii so serverom")
    } finally {
      setLoading(false)
    }
  }

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()

    // Set up polling every 15 seconds
    const intervalId = setInterval(fetchConversations, 15000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "conversation-update":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "speech-update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "status-update":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "conversation-update":
        return "Konverzácia"
      case "speech-update":
        return "Reč"
      case "status-update":
        return "Status"
      default:
        return type || "Neznámy"
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Konverzácie z VAPI</h2>
        <div className="flex gap-2">
          <Button onClick={fetchConversations} variant="outline" disabled={loading}>
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
              <CardTitle className="text-lg">Zoznam konverzácií</CardTitle>
              <CardDescription>
                {conversations.length > 0 ? `${conversations.length} aktualizácií prijatých` : "Žiadne konverzácie"}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {loading && conversations.length === 0 ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-20 w-full rounded-md" />
                    </div>
                  ))
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Žiadne konverzácie neboli nájdené</p>
                  <p className="text-sm">Čakám na dáta z VAPI webhooku</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`mb-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedConversation?.id === conversation.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[120px]">
                          {conversation.type === "conversation-update" && conversation.data.messages
                            ? conversation.data.messages[conversation.data.messages.length - 1]?.content?.substring(
                                0,
                                20,
                              ) + "..."
                            : getTypeLabel(conversation.type)}
                        </span>
                      </div>
                      <Badge className={getTypeColor(conversation.type)}>{getTypeLabel(conversation.type)}</Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true, locale: sk })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedConversation ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail konverzácie</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(selectedConversation.timestamp), { addSuffix: true, locale: sk })}
                    </CardDescription>
                  </div>
                  <Badge className={getTypeColor(selectedConversation.type)}>
                    {getTypeLabel(selectedConversation.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-3">Dáta</h3>
                  <pre className="text-xs overflow-auto max-h-[400px]">
                    {JSON.stringify(selectedConversation.data, null, 2)}
                  </pre>
                </div>

                {selectedConversation.type === "conversation-update" && selectedConversation.data.messages && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-3">Konverzácia</h3>
                    <div className="space-y-3">
                      {selectedConversation.data.messages.map((message: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            message.role === "assistant"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <div className="font-medium mb-1 text-xs">
                            {message.role === "assistant" ? "Asistent" : "Používateľ"}
                          </div>
                          <div>{message.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium mb-2">Žiadna konverzácia nie je vybraná</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Vyberte konverzáciu zo zoznamu pre zobrazenie detailov alebo počkajte na prijatie dát z VAPI.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {conversations.length === 0 && !loading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
              <div>
                <h3 className="font-medium mb-2">Ako nastaviť VAPI webhook</h3>
                <p className="text-muted-foreground mb-4">
                  Pre prijímanie dát o konverzáciách z VAPI je potrebné nastaviť webhook URL na:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm mb-4">
                  https://vaša-doména/api/vapi-actions
                </div>
                <p className="text-muted-foreground mb-2">
                  VAPI posiela rôzne typy webhookov: speech-update, status-update, conversation-update
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
