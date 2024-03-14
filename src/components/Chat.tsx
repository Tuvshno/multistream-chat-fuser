import React, { useEffect, useState, useRef } from 'react'
import useChatLiveModeScrolling from '../hooks/useChatLiveModeScrolling'
import { MessageModel, Emote, DonationModel } from '../utils/models'
import ChatMessage from './ChatMessage'
import ChatPausedAlert from './ChatPausedAlert'
import SendMessageForm from './SendMessageForm'
import './css/Chat.css'
import { GiNetworkBars } from "react-icons/gi";
import { MdError } from "react-icons/md";

const Chat = () => {

  const webSocketRef = useRef<WebSocket | null>(null);

  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [donations, setDonations] = useState<DonationModel[]>([]);

  const [fontSize, setFontSize] = useState<number>(14);
  const [enablePlatformIcons, setEnablePlatformIcons] = useState(true);
  const [enableBadges, setEnableBadges] = useState(true);
  const [enableTimestamps, setEnableTimestamps] = useState(false);

  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [connectedURLS, setConnectedURLS] = useState<string[]>([]);
  const [disconnectedURLS, setDisconnectedURLS] = useState<string[]>([]);

  const [showConnectedTooltip, setShowConnectedTooltip] = useState<boolean>(false);
  const [showErrorTooltip, setShowErrorTooltip] = useState<boolean>(false);

  const [socketError, setSocketError] = useState<boolean>(false);

  const [currentLink, setCurrentLink] = useState<number>(0);

  const [emotes, setEmotes] = useState<Emote[]>([]);


  const MAX_MESSAGES = 1000;
  const MAX_DONATIONS = 500;

  const { chatMessagesBoxRef, isLiveModeEnabled, scrollNewMessages } =
    useChatLiveModeScrolling<HTMLDivElement>(messages)

  useEffect(() => {
    window.electronAPI.getChatWindowSize().then(({ width, height }) => {
      console.log(width, height)
      window.electronAPI.setWindowSize(width, height).then(() => {
        window.electronAPI.center();

      });
    })

    console.log('starting server...');
    window.electronAPI.startServer();

    //Get User Settings
    window.electronAPI.getFontSize().then((fs) => {
      console.log(`Chat Font Size is ${fs}`)
      setFontSize(fs);
    });

    window.electronAPI.getPlatformIconsEnabled().then((isEnabled) => {
      console.log(`Chat Platfrom Icons are ${isEnabled}`)
      setEnablePlatformIcons(isEnabled);
    })

    window.electronAPI.getBadgesEnabled().then((isEnabled) => {
      console.log(`Chat Badges are ${isEnabled}`)
      setEnableBadges(isEnabled);
    })

    window.electronAPI.getTimestampsEnabled().then((isEnabled) => {
      console.log(`Chat Timestamps are ${isEnabled}`)
      setEnableTimestamps(isEnabled);
    })

    // Get Emotes
    window.electronAPI.getEmoteFiles().then((fetchedEmotes: Emote[]) => {
      console.log('Fetched Emotes:', fetchedEmotes);
      setEmotes(fetchedEmotes);
    });


    return () => {
      window.electronAPI.closeServer();
      window.electronAPI.changeChatWindowSize();
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
            const newMessages: MessageModel[] = message.data.map((msg: MessageModel) => ({
              ...msg,
              timestamp: new Date(), // Add the current timestamp to each message
            }));

            setMessages((prevChat) => [
              ...prevChat,
              ...newMessages
            ].slice(-MAX_MESSAGES)); // Keep only the last MAX_MESSAGES messages
            break;
          case 'SuperChat':
            // eslint-disable-next-line no-case-declarations
            const newDonations: DonationModel[] = message.data.map((donation: DonationModel) => ({
              ...donation,
            }));

            setDonations((prevDonation) => [
              ...prevDonation,
              ...newDonations
            ].slice(-MAX_DONATIONS)); // Keep only the last MAX_MESSAGES messages
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
      <ChatMessagesBox
        ref={chatMessagesBoxRef}
        messages={messages}
        donations={donations}
        fontSize={fontSize}
        enablePlatformIcons={enablePlatformIcons}
        enableBadges={enableBadges}
        enableTimestamps={enableTimestamps}
        emotes={emotes}
      />
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
          <div>There has been a socket connection error. </div>
          <div>Restart to fix.</div>
        </div>
      )}

    </div>
  )
}

const ChatMessagesBox = React.forwardRef<
  HTMLDivElement,
  {
    messages: MessageModel[];
    donations: DonationModel[];
    fontSize: number;
    enablePlatformIcons: boolean;
    enableBadges: boolean;
    enableTimestamps: boolean;
    emotes: Emote[];
  }
>(({ messages, donations, fontSize, enablePlatformIcons, enableBadges, enableTimestamps, emotes }, ref) => {

  const MessageList = messages.map((messageInfo) => (
    <ChatMessage
      key={messageInfo.id}
      className="chat-message"
      messageInfo={messageInfo}
      enablePlatformIcons={enablePlatformIcons}
      enableBadges={enableBadges}
      enableTimestamps={enableTimestamps}
      style={{ fontSize: `${fontSize}px` }}
      emotes={emotes}
    />
  ))

  // const DonationCards = donations.map((donation) => (
  //   <div key={donation.timestamp} className="donation-card">
  //     <span className="author-name">{donation.authorName}</span>
  //     <span className="purchase-amount">{donation.purchaseAmount}</span>
  //   </div>
  // ))

  return (
    <div ref={ref} className="chat-message-box">
      {/* <div className="donations-list">
        {DonationCards}
      </div> */}
      {MessageList}
    </div>
  )
})

export default Chat