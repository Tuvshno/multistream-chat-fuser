import React, { useState, useEffect, useRef } from 'react';
import './MainScreen.css';

interface Message {
    id: string; // Assuming each message has a unique ID
    authorName: string;
    message: string;
}

const MainScreen: React.FC = () => {
    const [chat, setChat] = useState<Message[]>([]);
    const chatEndRef = useRef<null | HTMLDivElement>(null); // Ref for the dummy div at the end of the chat

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        window.electronAPI.setWindowSize(500, 900);
        console.log('starting server...');
        window.electronAPI.startServer();
    }, []);

    useEffect(() => {
        const webSocket = new WebSocket('ws://localhost:8080');

        webSocket.onopen = () => {
            console.log("WebSocket is now open.");
        };

        webSocket.onmessage = (event) => {
            console.log("Message from server:", event.data);
            const newMessages: Message[] = JSON.parse(event.data);
            setChat((prevChat) => [...prevChat, ...newMessages]);
        };

        webSocket.onerror = (event) => {
            console.error("WebSocket error observed:", event);
            webSocket.close();
        };

        webSocket.onclose = () => {
            console.log("WebSocket is closed now.");
        };

        return () => {
            webSocket.close();
        };
    }, []);
    useEffect(() => {
        scrollToBottom(); // Scroll to the bottom every time the chat array changes
    }, [chat]);

    return (
        <div className='chat-container'>
            {chat.map((message) => (
                <div key={message.id} className="message">
                    <div className="authorName">{message.authorName}</div>
                    <div className="messageContent">{message.message}</div>
                </div>
            ))}
            <div ref={chatEndRef} /> {/* Dummy div to act as the scroll target */}
        </div>
    );
};

export default MainScreen;
