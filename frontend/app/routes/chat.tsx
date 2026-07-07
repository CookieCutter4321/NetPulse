import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { useAuth } from "@/components/authContext"
import { useNavigate } from "react-router"

function chat() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [input, setInput] = useState("")

  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Welcome to GoChat.", sender: "system" },
    { id: 2, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", sender: "system" },
    { id: 3, text: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", sender: "user"}
  ])

const handleSend = (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages((prev) => [...prev, { id: Date.now(), text: input, sender: "user" }])
    setInput("")
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
      <Card className="flex h-full max-h-125 w-full max-w-125 flex-col shadow-lg bg-white">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-lg font-semibold text-slate-800">GoChat Room</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
            <div className={`flex w-full mb-1 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <span 
                className={`text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-1`}
              >
                {msg.sender}
              </span>
            </div>

              <div
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                  <div
                    className={`max-w-[75%] wrap-break-words rounded-lg px-3 py-2 text-sm ${
                      msg.sender === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {msg.text}
                  </div>
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

export default chat
