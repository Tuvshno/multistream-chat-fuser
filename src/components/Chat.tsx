import React, { useEffect, useState } from 'react'
import useChatLiveModeScrolling from '../hooks/useChatLiveModeScrolling'
import { MessageModel } from '../utils/models'
import ChatMessage from './ChatMessage'
import ChatPausedAlert from './ChatPausedAlert'
import SendMessageForm from './SendMessageForm'
import './css/Chat.css'
import { GiNetworkBars } from "react-icons/gi";
import { MdError } from "react-icons/md";

const Chat = () => {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [connectedURLS, setConnectedURLS] = useState<string[]>([]);
  const [disconnectedURLS, setDisconnectedURLS] = useState<string[]>([]);

  const [showConnectedTooltip, setShowConnectedTooltip] = useState<boolean>(false);
  const [showErrorTooltip, setShowErrorTooltip] = useState<boolean>(false);

  const [socketError, setSocketError] = useState<boolean>(false);

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
      const message = JSON.parse(event.data); // Corrected from `JSON.parse(event)`

      switch (message.type) {
        case 'chatMessage':
          // eslint-disable-next-line no-case-declarations
          const newMessages: MessageModel[] = message.data;
          setMessages((prevChat) => [
            ...prevChat,
            ...newMessages
          ].slice(-MAX_MESSAGES)); // Keep only the last MAX_MESSAGES messages
          break;
        case 'error':
          console.log("Error loading chat for URL:", message.errorUrl);
          setError(true);
          setDisconnectedURLS(prevURLs => [...prevURLs, message.errorUrl]);
          break;
        case 'success':
          console.log('Successfully loaded all scripts:', message.urls);
          setConnected(true);
          setConnectedURLS(message.urls);

          break;
        default:
          console.error('Unknown message type:', message.type);
      }
    };


    webSocket.onerror = (event) => {
      console.error("WebSocket error observed:", event);
      setSocketError(true);
      webSocket.close();
    };

    webSocket.onclose = () => {
      console.log("WebSocket is closed now.");
    };

    return () => {
      webSocket.close();
    };
  }, []);

  const handleConnectedHover = (show: boolean | ((prevState: boolean) => boolean)) => {
    setShowConnectedTooltip(show);
  };

  const handleErrorHover = (show: boolean | ((prevState: boolean) => boolean)) => {
    setShowErrorTooltip(show);
  };

  return (
    <div className="Chat">
      <ChatMessagesBox ref={chatMessagesBoxRef} messages={messages} />
      {!isLiveModeEnabled && (
        <ChatPausedAlert
          onClick={scrollNewMessages}
        />
      )}
      <SendMessageForm onSend={send} />

      {error && <MdError
        className='error'
        onMouseEnter={() => handleErrorHover(true)}
        onMouseLeave={() => handleErrorHover(false)}
      />}

      {connected ?
        <GiNetworkBars
          className='connected'
          onMouseEnter={() => handleConnectedHover(true)}
          onMouseLeave={() => handleConnectedHover(false)}
        />
        :
        <div>
          <div className="spinner"></div>
          <div className="connected-message">Connecting to chats... </div>
        </div>
      }

      {showConnectedTooltip && (
        <div className="tooltip-connected">
          {`Connected to ${connectedURLS.length} chats!`}
        </div>
      )}

      {showErrorTooltip && (
        <div className="tooltip-disconnected">
          {`These URLs have not connected properly. Please Fix and Restart: ${disconnectedURLS.join(', ')}`}
        </div>
      )}

      {socketError && (
        <div className='tooltip-disconnected'>
          {`There has been a socket connection error.`}
        </div>
      )}

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