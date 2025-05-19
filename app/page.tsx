import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CallsList from "@/components/calls-list"
import ConversationsList from "@/components/conversations-list"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">VAPI Dashboard</h1>
      <p className="mb-8 text-center max-w-2xl">Rozhranie pre zobrazenie informácií prijatých z VAPI.</p>

      <Tabs defaultValue="conversations" className="w-full max-w-4xl">
        <TabsList className="mb-4">
          <TabsTrigger value="conversations">Konverzácie</TabsTrigger>
          <TabsTrigger value="calls">Hovory</TabsTrigger>
        </TabsList>
        <TabsContent value="conversations">
          <ConversationsList />
        </TabsContent>
        <TabsContent value="calls">
          <CallsList />
        </TabsContent>
      </Tabs>
    </main>
  )
}
