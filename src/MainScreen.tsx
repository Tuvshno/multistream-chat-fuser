import React, { useState, useEffect, useRef } from 'react';
import './MainScreen.css';
import TwitchBadge from './assets/Twitch_Badge_18.png';
import YouTubeBadge from './assets/YT_Badge_18.png';

interface Message {
    platform: string;
    id: string;
    authorName: string;
    message: string;
    imgSrcs: string[];
    authorColor: string;
}

const MainScreen: React.FC = () => {
    const [chat, setChat] = useState<Message[]>([]);
    const chatEndRef = useRef<null | HTMLDivElement>(null);
    const chatContainerRef = useRef<null | HTMLDivElement>(null);

    const renderMessageContent = (message: string) => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        // Split message by URLs and keep the URLs in the output array
        const parts = message.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                // If the part is a URL, render it as an image
                return <img key={index} src={part} className='badge' alt="Embedded Content" style={{ width: '32px', height: '32px' }} />;
            } else {
                // If the part is text, render it as text
                return part;
            }
        });
    };
    // Function to check if the user is at the bottom of the chat
    const isScrolledToBottom = () => {
        if (!chatContainerRef.current) return false;

        const { scrollTop, clientHeight, scrollHeight } = chatContainerRef.current;
        // Check if the user is at the bottom of the chat (with some tolerance for better UX)
        return scrollTop + clientHeight + 200 >= scrollHeight;
    };

    const scrollToBottom = () => {
        if (isScrolledToBottom()) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
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
            console.log(newMessages)
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
        scrollToBottom(); // Scroll to the bottom conditionally
    }, [chat]);

    return (
        <div className='chat-container'>
            <div ref={chatContainerRef} className='chat-message-container'>
                {chat.map((message, index) => (
                    <div key={index} className="message">
                        <div className='message-info'>
                            {message.platform === 'YouTube' ? <div className='badge'><img src={YouTubeBadge} alt="YouTube Badge" /></div> : <div className='badge'><img src={TwitchBadge} alt="Twitch Badge" /></div>}
                            {message?.imgSrcs.map((badge, badgeIndex) => (
                                <div key={badgeIndex} className="badge">
                                    <img src={badge} alt="Chat Badge" />
                                </div>
                            ))}
                            <div className="authorName" style={{ color: message.authorColor }}>{message.authorName}</div>
                            <span>:</span>
                        </div>
                        <span className="messageContent">{renderMessageContent(message.message)}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className='message-input-container'>
                <input className='message-input' />
            </div>
            <div className='undermessage-container'>
                <button className='message-send-button'>Chat</button>
            </div>
        </div>
    );
};

export default MainScreen;