import CallsList from "@/components/calls-list"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">VAPI Hovory</h1>
      <p className="mb-8 text-center max-w-2xl">Rozhranie pre zobrazenie informácií o hovoroch prijatých z VAPI.</p>

      <CallsList />
    </main>
  )
}
