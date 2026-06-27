import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function App() {
  const [input, setInput] = useState("")

  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Welcome to GoChat.", sender: "system" },
    { id: 2, text: "Type a message below to test the layout.", sender: "system" },
  ])

const handleSend = (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages((prev) => [...prev, { id: Date.now(), text: input, sender: "user" }])
    setInput("")
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
      <Card className="flex h-[500px] w-[500px] flex-col shadow-lg bg-white">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-lg font-semibold text-slate-800">GoChat Room</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="border-t p-4">
          <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
              Send
            </Button>
          </form>
        </CardFooter>

      </Card>

    </div>
  )

}

export default App
