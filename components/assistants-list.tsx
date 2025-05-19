"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bot,
  RefreshCw,
  Clock,
  AlertCircle,
  Info,
  FileText,
  Mic,
  Settings,
  MessageSquare,
  Headphones,
  Server,
} from "lucide-react"
import type { VapiAssistant } from "@/types/assistant"
import { formatDistanceToNow } from "date-fns"
import { sk } from "date-fns/locale"

interface AssistantData {
  id: string
  timestamp: string
  type: string
  data: VapiAssistant
}

export default function AssistantsList() {
  const [assistants, setAssistants] = useState<AssistantData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantData | null>(null)

  const fetchAssistants = async () => {
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
              name: "getAssistantsData",
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.result) {
        setAssistants(data.result)

        // If we have assistants but no selected assistant, select the first one
        if (data.result.length > 0 && !selectedAssistant) {
          setSelectedAssistant(data.result[0])
        }
      } else {
        setError("Nepodarilo sa načítať údaje o asistentoch")
      }
    } catch (err) {
      setError("Nastala chyba pri komunikácii so serverom")
    } finally {
      setLoading(false)
    }
  }

  // Fetch assistants on component mount
  useEffect(() => {
    fetchAssistants()

    // Set up polling every 60 seconds
    const intervalId = setInterval(fetchAssistants, 60000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Asistenti VAPI</h2>
        <div className="flex gap-2">
          <Button onClick={fetchAssistants} variant="outline" disabled={loading}>
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
              <CardTitle className="text-lg">Zoznam asistentov</CardTitle>
              <CardDescription>
                {assistants.length > 0 ? `${assistants.length} asistentov prijatých` : "Žiadni asistenti"}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {loading && assistants.length === 0 ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-3">
                      <Skeleton className="h-20 w-full rounded-md" />
                    </div>
                  ))
              ) : assistants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Žiadni asistenti neboli nájdení</p>
                  <p className="text-sm">Čakám na dáta z VAPI webhooku</p>
                </div>
              ) : (
                assistants.map((assistant) => (
                  <div
                    key={assistant.id}
                    className={`mb-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedAssistant?.id === assistant.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => setSelectedAssistant(assistant)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">
                          {assistant.data.name || `Asistent ${assistant.id.substring(0, 8)}`}
                        </span>
                      </div>
                      <Badge variant="outline">{assistant.data.model?.provider || "Neznámy"}</Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(assistant.timestamp), { addSuffix: true, locale: sk })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedAssistant ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail asistenta</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(selectedAssistant.timestamp), { addSuffix: true, locale: sk })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {selectedAssistant.data.model?.provider || "Neznámy"} /{" "}
                    {selectedAssistant.data.model?.model || "Neznámy model"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Základné</TabsTrigger>
                    <TabsTrigger value="model">Model</TabsTrigger>
                    <TabsTrigger value="voice">Hlas</TabsTrigger>
                    <TabsTrigger value="transcriber">Prepis</TabsTrigger>
                    <TabsTrigger value="advanced">Pokročilé</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">ID asistenta</h4>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>{selectedAssistant.data.id}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Názov</h4>
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-2" />
                          <span>{selectedAssistant.data.name || "Nepomenovaný asistent"}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Prvá správa</h4>
                        <div className="flex items-start">
                          <MessageSquare className="h-4 w-4 mr-2 mt-1" />
                          <span>{selectedAssistant.data.firstMessage || "Žiadna prvá správa"}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Režim prvej správy</h4>
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>{selectedAssistant.data.firstMessageMode || "Neznámy"}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Časové limity</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Ticho: {selectedAssistant.data.silenceTimeoutSeconds || 0}s</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Max. trvanie: {selectedAssistant.data.maxDurationSeconds || 0}s</span>
                          </div>
                        </div>
                      </div>

                      {selectedAssistant.data.compliancePlan && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Súlad</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedAssistant.data.compliancePlan.hipaaEnabled && <Badge>HIPAA</Badge>}
                            {selectedAssistant.data.compliancePlan.pciEnabled && <Badge>PCI</Badge>}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="model">
                    {selectedAssistant.data.model ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Poskytovateľ a model</h4>
                          <div className="flex items-center">
                            <Server className="h-4 w-4 mr-2" />
                            <span>
                              {selectedAssistant.data.model.provider || "Neznámy"} /{" "}
                              {selectedAssistant.data.model.model || "Neznámy model"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Nastavenia modelu</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Teplota:{" "}
                                {selectedAssistant.data.model.temperature !== undefined
                                  ? selectedAssistant.data.model.temperature
                                  : "Predvolená"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Max. tokenov:{" "}
                                {selectedAssistant.data.model.maxTokens !== undefined
                                  ? selectedAssistant.data.model.maxTokens
                                  : "Predvolené"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedAssistant.data.model.tools && selectedAssistant.data.model.tools.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Nástroje</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAssistant.data.model.tools.map((tool, index) => (
                                <Badge key={index} variant="outline">
                                  {tool.type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedAssistant.data.model.emotionRecognitionEnabled && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Rozpoznávanie emócií</h4>
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            >
                              Povolené
                            </Badge>
                          </div>
                        )}

                        {selectedAssistant.data.model.knowledgeBase && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Znalostná báza</h4>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>ID: {selectedAssistant.data.model.knowledgeBaseId || "Neznáme"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Informácie o modeli nie sú k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="voice">
                    {selectedAssistant.data.voice ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Poskytovateľ a hlas</h4>
                          <div className="flex items-center">
                            <Headphones className="h-4 w-4 mr-2" />
                            <span>
                              {selectedAssistant.data.voice.provider || "Neznámy"} /{" "}
                              {selectedAssistant.data.voice.voiceId || "Neznámy hlas"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Nastavenia hlasu</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Rýchlosť:{" "}
                                {selectedAssistant.data.voice.speed !== undefined
                                  ? selectedAssistant.data.voice.speed
                                  : "Predvolená"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Cachovanie: {selectedAssistant.data.voice.cachingEnabled ? "Povolené" : "Zakázané"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedAssistant.data.voice.chunkPlan && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Plán chunkovania</h4>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                {selectedAssistant.data.voice.chunkPlan.enabled ? "Povolené" : "Zakázané"}
                                {selectedAssistant.data.voice.chunkPlan.minCharacters !== undefined
                                  ? ` (min. ${selectedAssistant.data.voice.chunkPlan.minCharacters} znakov)`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        )}

                        {selectedAssistant.data.voice.fallbackPlan &&
                          selectedAssistant.data.voice.fallbackPlan.voices && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Záložné hlasy</h4>
                              <div className="space-y-2">
                                {selectedAssistant.data.voice.fallbackPlan.voices.map((voice, index) => (
                                  <div key={index} className="flex items-center">
                                    <Headphones className="h-4 w-4 mr-2" />
                                    <span>
                                      {voice.provider} / {voice.voiceId}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Headphones className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Informácie o hlase nie sú k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="transcriber">
                    {selectedAssistant.data.transcriber ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Poskytovateľ prepisu</h4>
                          <div className="flex items-center">
                            <Mic className="h-4 w-4 mr-2" />
                            <span>{selectedAssistant.data.transcriber.provider || "Neznámy"}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Nastavenia prepisu</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>Jazyk: {selectedAssistant.data.transcriber.language || "Predvolený"}</span>
                            </div>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Prah spoľahlivosti:{" "}
                                {selectedAssistant.data.transcriber.confidenceThreshold !== undefined
                                  ? selectedAssistant.data.transcriber.confidenceThreshold
                                  : "Predvolený"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Ďalšie nastavenia</h4>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Čiastočné prepisy:{" "}
                                {selectedAssistant.data.transcriber.disablePartialTranscripts ? "Zakázané" : "Povolené"}
                              </span>
                            </div>
                            {selectedAssistant.data.transcriber.endUtteranceSilenceThreshold !== undefined && (
                              <div className="flex items-center">
                                <Settings className="h-4 w-4 mr-2" />
                                <span>
                                  Prah ticha na konci výpovede:{" "}
                                  {selectedAssistant.data.transcriber.endUtteranceSilenceThreshold}s
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedAssistant.data.transcriber.wordBoost &&
                          selectedAssistant.data.transcriber.wordBoost.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Zvýraznené slová</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedAssistant.data.transcriber.wordBoost.map((word, index) => (
                                  <Badge key={index} variant="outline">
                                    {word}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Informácie o prepise nie sú k dispozícii</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced">
                    <div className="space-y-4">
                      {selectedAssistant.data.artifactPlan && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Plán artefaktov</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Nahrávanie:{" "}
                                {selectedAssistant.data.artifactPlan.recordingEnabled ? "Povolené" : "Zakázané"}
                              </span>
                            </div>
                            {selectedAssistant.data.artifactPlan.recordingFormat && (
                              <div className="flex items-center">
                                <Settings className="h-4 w-4 mr-2" />
                                <span>Formát: {selectedAssistant.data.artifactPlan.recordingFormat}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Video nahrávanie:{" "}
                                {selectedAssistant.data.artifactPlan.videoRecordingEnabled ? "Povolené" : "Zakázané"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                PCAP: {selectedAssistant.data.artifactPlan.pcapEnabled ? "Povolené" : "Zakázané"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedAssistant.data.messagePlan && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Plán správ</h4>
                          {selectedAssistant.data.messagePlan.idleTimeoutSeconds && (
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              <span>
                                Časový limit nečinnosti: {selectedAssistant.data.messagePlan.idleTimeoutSeconds}s
                              </span>
                            </div>
                          )}
                          {selectedAssistant.data.messagePlan.idleMessages &&
                            selectedAssistant.data.messagePlan.idleMessages.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                  Správy pri nečinnosti:
                                </h5>
                                <ul className="list-disc list-inside text-sm">
                                  {selectedAssistant.data.messagePlan.idleMessages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      )}

                      {selectedAssistant.data.server && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Server</h4>
                          {selectedAssistant.data.server.url && (
                            <div className="flex items-center">
                              <Server className="h-4 w-4 mr-2" />
                              <span>URL: {selectedAssistant.data.server.url}</span>
                            </div>
                          )}
                          {selectedAssistant.data.server.timeoutSeconds && (
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Timeout: {selectedAssistant.data.server.timeoutSeconds}s</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAssistant.data.hooks && selectedAssistant.data.hooks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Hooks</h4>
                          <div className="space-y-2">
                            {selectedAssistant.data.hooks.map((hook, index) => (
                              <div key={index} className="p-2 border rounded-md">
                                <div className="flex items-center">
                                  <Settings className="h-4 w-4 mr-2" />
                                  <span>On: {hook.on}</span>
                                </div>
                                <div className="mt-1 text-sm">
                                  <span className="font-medium">Akcie:</span>
                                  <ul className="list-disc list-inside">
                                    {hook.do.map((action, actionIndex) => (
                                      <li key={actionIndex}>{action.type}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw">
                    <div className="p-4 bg-muted rounded-md">
                      <div className="flex items-start mb-2">
                        <FileText className="h-4 w-4 mr-2 mt-1" />
                        <h4 className="font-medium">Raw dáta asistenta</h4>
                      </div>
                      <pre className="text-xs overflow-auto max-h-[400px]">
                        {JSON.stringify(selectedAssistant.data, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium mb-2">Žiadny asistent nie je vybraný</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Vyberte asistenta zo zoznamu pre zobrazenie detailov alebo počkajte na prijatie dát z VAPI.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {assistants.length === 0 && !loading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
              <div>
                <h3 className="font-medium mb-2">Ako nastaviť VAPI webhook</h3>
                <p className="text-muted-foreground mb-4">
                  Pre prijímanie dát o asistentoch z VAPI je potrebné nastaviť webhook URL na:
                </p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm mb-4">
                  https://vaša-doména/api/vapi-actions
                </div>
                <p className="text-muted-foreground mb-2">
                  VAPI posiela rôzne typy dát, vrátane konfigurácií asistentov.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
