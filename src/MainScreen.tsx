import React, { useState, useEffect } from 'react';

interface Message {
    authorName: string;
    message: string;
}

const MainScreen: React.FC = () => {
    const [chat, setChat] = useState<Message[]>([]); // Update the state to hold an array of Message objects

    useEffect(() => {
        window.electronAPI.setWindowSize(500,900);
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
            setChat((prevChat) => [...prevChat, ...newMessages]); // Update the chat state by appending new messages
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

    return (
        <div>
            {chat.map((message, index) => ( // Use index as a key for each chat item
                <div key={index}>
                    <div>{message.authorName}</div>
                    <div>{message.message}</div>
                </div>
            ))}
        </div>
    );
};

export default MainScreen;
