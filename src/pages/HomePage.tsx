import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBrain } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";
import { Button } from '@/components/ui/button';


const HTTP_BASE = import.meta.env.VITE_REACT_APP_HTTP_SERVER;

interface StoredSession {
    session_id: string;
    first_message: string;
    timestamp: number;
}

const HomePage = () => {
    const [sessions, setSesssions] = useState<StoredSession[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const raw = localStorage.getItem('chat_sessions');
        if (raw) {
            const parsed = JSON.parse(raw) as StoredSession[];
            const valid = parsed.filter((s) => Date.now() - s.timestamp < 86400000);
            setSesssions(valid);
        }
    }, []);

    const startNewChat = async () => {
        const res = await fetch(`${HTTP_BASE}/session`, { method: 'POST' });
        const data = await res.json();
        const session_id = data.session_id;

        navigate(`/chat/${session_id}`);
    };

    function convertTimestamp(timestamp: number) {
        const date = new Date(timestamp);

        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        return `${formattedDate} ${formattedTime}`;
    }


    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            <div className="w-full max-w-xl space-y-6">
                <h1 className="text-3xl font-bold flex items-center gap-4"> <FaBrain className='text-pink-500' /> Chat Session Selector</h1>
                <Button
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                    onClick={startNewChat}
                >
                    <FaPlus className='text-white hover:text-violet-500' /> Start New Chat
                </Button>

                <div className="bg-white p-4 rounded-xl shadow space-y-2">
                    <h2 className="text-xl font-semibold">Previous Sessions</h2>
                    {sessions.length === 0 && <p className="text-gray-500">No active sessions found.</p>}
                    {sessions.map((s) => (
                        <div
                            key={s.session_id}
                            className="border p-2 rounded hover:bg-gray-100 cursor-pointer flex items-baseline w-full justify-between gap-4"
                            onClick={() => navigate(`/chat/${s.session_id}`)}
                        >
                            <div className='flex flex-col gap-2'>
                                <p className="font-semibold text-sm text-gray-700">{s.first_message}</p>
                                <p className="text-xs text-gray-400">Session ID: {s.session_id.slice(0, 8)}...</p>
                            </div>
                            <div className='text-wrap'>
                                {convertTimestamp(s.timestamp)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default HomePage