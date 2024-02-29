import React, { useEffect, useState, useRef } from 'react'
import useChatLiveModeScrolling from '../hooks/useChatLiveModeScrolling'
import { MessageModel } from '../utils/models'
import ChatMessage from './ChatMessage'
import ChatPausedAlert from './ChatPausedAlert'
import SendMessageForm from './SendMessageForm'
import './css/Chat.css'
import { GiNetworkBars } from "react-icons/gi";
import { MdError } from "react-icons/md";

const Chat = () => {

  const webSocketRef = useRef<WebSocket | null>(null);

  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [fontSize, setFontSize] = useState<number>(14);

  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [connectedURLS, setConnectedURLS] = useState<string[]>([]);
  const [disconnectedURLS, setDisconnectedURLS] = useState<string[]>([]);

  const [showConnectedTooltip, setShowConnectedTooltip] = useState<boolean>(false);
  const [showErrorTooltip, setShowErrorTooltip] = useState<boolean>(false);

  const [socketError, setSocketError] = useState<boolean>(false);

  const [currentLink, setCurrentLink] = useState<number>(0);

  const MAX_MESSAGES = 1000;

  const { chatMessagesBoxRef, isLiveModeEnabled, scrollNewMessages } =
    useChatLiveModeScrolling<HTMLDivElement>(messages)

  useEffect(() => {
    window.electronAPI.setWindowSize(500, 900);
    console.log('starting server...');
    window.electronAPI.startServer();
    window.electronAPI.getFontSize().then((fs) => {
      setFontSize(fs);
    });

    return () => {
      window.electronAPI.closeServer();
    };

  }, []);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 2000; // 2 seconds

  // State to keep track of reconnection attempts
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {

    const connectWebSocket = () => {

      console.log('Starting Socket Connection...');
      webSocketRef.current = new WebSocket('ws://localhost:8080');

      webSocketRef.current.onopen = () => {
        console.log("WebSocket is now open.");
        setReconnectAttempts(0); // Reset reconnection attempts on successful connection
      };

      // webSocket.onmessage = (event) => {
      //   console.log("Message from server:", event.data);
      //   const newMessages: MessageModel[] = JSON.parse(event.data);
      //   console.log(newMessages)
      //   setMessages((prevChat) => [...prevChat, ...newMessages]);
      // };

      webSocketRef.current.onmessage = (event) => {
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
          case 'link':
            console.log('Working on next link:', message.linkNum);
            setCurrentLink(message.linkNum);
            break;
          default:
            console.error('Unknown message type:', message.type);
        }
      };
      webSocketRef.current.onerror = (event) => {
        console.error("WebSocket error observed:", event);
        setSocketError(true);
      };

      webSocketRef.current.onclose = () => {
        console.log("WebSocket is closed now.");
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts + 1})`);
            setReconnectAttempts(reconnectAttempts + 1);
            connectWebSocket(); // Attempt to reconnect
          }, RECONNECT_DELAY_MS);
        } else {
          console.error("Maximum reconnect attempts reached.");
        }
      };
    };

    connectWebSocket(); // Initial connection attempt

    return () => {
      webSocketRef.current?.close();
    };
  }, [reconnectAttempts]); // Depend on `reconnectAttempts` to trigger reconnection attempts

  const send = (message: string) => {
    // Check if the WebSocket is connected
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      // Convert the message to a string format if it's not already (e.g., JSON)
      const messageToSend = message
      webSocketRef.current.send(messageToSend);
    } else {
      console.log('WebSocket is not open. Cannot send message.');
    }
  };

  const handleConnectedHover = (show: boolean | ((prevState: boolean) => boolean)) => {
    setShowConnectedTooltip(show);
  };

  const handleErrorHover = (show: boolean | ((prevState: boolean) => boolean)) => {
    setShowErrorTooltip(show);
  };

  return (
    <div className="Chat">
      <ChatMessagesBox ref={chatMessagesBoxRef} messages={messages} fontSize={fontSize} />
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

      {currentLink > 0 &&
        <div className='connected-message-link'>
          Working on Link {currentLink}
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
  { messages: MessageModel[]; fontSize: number } // Include fontSize in the props
>(({ messages, fontSize }, ref) => {
  const MessageList = messages.map((messageInfo) => (
    <ChatMessage key={messageInfo.id} className="chat-message" messageInfo={messageInfo} style={{ fontSize: `${fontSize}px` }} />
  ))

  return (
    <div ref={ref} className="chat-message-box">
      {MessageList}
    </div>
  )
})

export default Chat