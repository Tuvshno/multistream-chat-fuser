import React, { useEffect, useState } from 'react'
import useChatLiveModeScrolling from '../hooks/useChatLiveModeScrolling'
import { MessageModel } from '../utils/models'
import ChatMessage from './ChatMessage'
import ChatPausedAlert from './ChatPausedAlert'
import SendMessageForm from './SendMessageForm'
import './css/Chat.css'

const Chat = () => {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const MAX_MESSAGES = 1000;
  const send = () => {
    console.log('sending message');
  }

  const { chatMessagesBoxRef, isLiveModeEnabled, scrollNewMessages } =
    useChatLiveModeScrolling<HTMLDivElement>(messages)

  useEffect(() => {
    window.electronAPI.setWindowSize(500, 900);
    console.log('starting server...');
    window.electronAPI.startServer();
  }, []);

  useEffect(() => {
    console.log('Starting Socket Connection...');

    const webSocket = new WebSocket('ws://localhost:8080');

    webSocket.onopen = () => {
      console.log("WebSocket is now open.");
    };

    // webSocket.onmessage = (event) => {
    //   console.log("Message from server:", event.data);
    //   const newMessages: MessageModel[] = JSON.parse(event.data);
    //   console.log(newMessages)
    //   setMessages((prevChat) => [...prevChat, ...newMessages]);
    // };

    webSocket.onmessage = (event) => {
      console.log("Message from server:", event.data);
      const newMessages: MessageModel[] = JSON.parse(event.data);
      setMessages((prevChat) => [
        ...prevChat,
        ...newMessages
      ].slice(-MAX_MESSAGES)); // Keep only the last MAX_MESSAGES messages
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
    <div className="Chat">
      <ChatMessagesBox ref={chatMessagesBoxRef} messages={messages} />
      {!isLiveModeEnabled && (
        <ChatPausedAlert
          onClick={scrollNewMessages}
        />
      )}
      <SendMessageForm onSend={send} />
    </div>
  )
}

const ChatMessagesBox = React.forwardRef<
  HTMLDivElement,
  { messages: MessageModel[] }
>(({ messages }, ref) => {
  const MessageList = messages.map((messageInfo) => (
    <ChatMessage key={messageInfo.id} className="chat-message" messageInfo={messageInfo} />
  ))

  return (
    <div ref={ref} className="chat-message-box">
      {MessageList}
    </div>
  )
})

export default Chat