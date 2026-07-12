import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { useAuth } from "@/components/authContext"
import { useNavigate } from "react-router"

function chat() {
  const { isAuthenticated, username } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Welcome to GoChat.", sender: "system", isMedia: false},
    { id: 2, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", sender: "system", isMedia: false},
    { id: 3, text: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", sender: "user", isMedia: false}
  ])
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const uploadFileRef = useRef< HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/api/chat`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Handle incoming msgs
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev, 
        { id: payload.Id, text: payload.Msg, sender: payload.Sender, isMedia: payload.IsMedia }
      ]);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = (text: string = "", isMedia: boolean = false) => { // both really shouldn't be set to anything. it's an XOR
      if (!text) return;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const payload = { 
          Msg: text, 
          IsMedia: isMedia 
        };
        socketRef.current.send(JSON.stringify(payload));
      }
  };

  const handleSend = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input)
    setInput("");
  };

  const handleFileUpload = async () => {
    var files = uploadFileRef.current?.files

    if (files == null || files == undefined) {
      return
    }
    var file = files[0]
    var fileName = file.name

    var presignedData = await fetch(`/api/upload?name=${fileName}`, {
      method: 'GET'
    }).then((response) => {
      if (!response.ok) {
        throw new Error("could not get the signed link")
      }
      return response.json()
    })

    const s3Response = await fetch(presignedData.URL, {
      method: presignedData.Method,
      headers: presignedData.SignedHeader,
      body: file
    });

    if (s3Response.ok) {
      alert("File uploaded directly to S3 successfully!");
    } else {
      alert("S3 rejected the file upload.");
    }
    sendMessage(presignedData.FinalPublicUrl,true)
  }
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
      <Card className="flex h-full max-h-125 w-full max-w-125 flex-col shadow-lg bg-white">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-lg font-semibold text-slate-800">GoChat Room</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
            <div className={`flex w-full mb-1 ${msg.sender === username ? "justify-end" : "justify-start"}`}>
              <span 
                className={`text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-1`}
              >
                {msg.sender}
              </span>
            </div>

              <div
                className={`flex ${msg.sender === username ? "justify-end" : "justify-start"}`}
              >
                  <div
                    className={`max-w-[75%] wrap-break-words rounded-lg px-3 py-2 text-sm ${
                      msg.sender === username
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                  {msg.isMedia ? (
                    <img 
                      src={msg.text} 
                      alt="Uploaded media" 
                      className="max-w-full h-auto rounded-md mt-1 cursor-pointer hover:opacity-90 transition-opacity"
                      loading="lazy" 
                      onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                    />
                  ) : (
                    msg.text
                  )}
                  </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-4">
          <form onSubmit={handleSend} className="flex w-full items-center space-x-2">
            <div className="relative flex items-center w-full">
              <Input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <label htmlFor="file-upload" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">
                  +
              </label>
              <input id="file-upload" type="file" accept=".png,.jpg" ref = {uploadFileRef} onChange={handleFileUpload} hidden/>
            </div>
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