import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBrain } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const WS_BASE = import.meta.env.VITE_REACT_APP_SOCKET_SERVER;
const HTTP_BASE = import.meta.env.VITE_REACT_APP_HTTP_SERVER;

interface Message {
  role: "user" | "bot";
  message: string;
}

interface StoredSession {
  session_id: string;
  first_message: string;
  timestamp: number;
}

export default function ChatPage() {
  const { session_id } = useParams();
  const sessionId = session_id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session_id) return;

    ws.current = new WebSocket(`${WS_BASE}/${session_id}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages((prev) => [...prev, { role: data.role, message: data.message }]);
      }
    };

    ws.current.onclose = () => {
      fetchHistoryFromHttp();
    };

    return () => {
      ws.current?.close();
    };
  }, [session_id]);

  const fetchHistoryFromHttp = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${HTTP_BASE}/history/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.history);
      } else {
        console.error("Failed to fetch chat history:", res.status);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !sessionId) return;

    const newMsg: Message = { role: "user", message: input };
    setMessages((prev) => [...prev, newMsg]);

    if (messages.length === 0 && sessionId) {
      const sessions = JSON.parse(localStorage.getItem("chat_sessions") || "[]");
      const exists = sessions.find((s: any) => s.session_id === sessionId);
      if (!exists) {
        sessions.push({
          session_id: sessionId,
          first_message: input,
          timestamp: Date.now(),
        });
        localStorage.setItem("chat_sessions", JSON.stringify(sessions));
      }
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(input);
    } else {
      fetch(`${HTTP_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query: input }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages((prev) => [...prev, { role: "bot", message: data.answer }]);
        });
    }

    setInput("");
  };

  const resetSession = async () => {
    if (session_id) {
      await fetch(`${HTTP_BASE}/session/${session_id}`, { method: "DELETE" });
      const raw = localStorage.getItem("chat_sessions");
      if (raw) {
        const sessions: StoredSession[] = JSON.parse(raw);
        const updated = sessions.filter((s) => s.session_id !== session_id);
        localStorage.setItem("chat_sessions", JSON.stringify(updated));
      }
      navigate("/");
    }
  };

  const navigateback = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-4"> <FaBrain className='text-pink-500' /> Chat with Bot</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={resetSession} className="text-sm text-red-500 hover:underline shadow-none bg-transparent hover:bg-transparent">
              Reset Session
            </Button>
            <Button onClick={navigateback} className="text-sm text-black hover:underline shadow-none bg-transparent hover:bg-transparent">
              Exit
            </Button>
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto space-y-2 border p-2 rounded-md bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg ${msg.role === "user" ? "bg-blue-100 self-end text-right" : "bg-green-100 self-start"}`}
            >
              <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.message}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow border rounded-xl px-4 py-2"
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
