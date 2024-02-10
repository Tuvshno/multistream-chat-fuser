import { MessageModel } from '../utils/models'
import YouTubeBadge from '../assets/YT_Badge_18.png'
import TwitchBadge from '../assets/Twitch_Badge_18.png'
import './css/ChatMessage.css'

type MessageProps = {
    messageInfo: MessageModel
} & React.ComponentPropsWithRef<'div'>

const ChatMessage = ({
    messageInfo: { platform, authorName, message, imgSrcs, authorColor },
    className,
}: MessageProps) => {
    const Badges = imgSrcs.map((bg, i) => (
        <img
            key={i}
            src={bg}
            className="message-badge"
        />
    ))

    const Username = (
        <span className="message-username" style={{ color: authorColor }}>
            {authorName}
        </span>
    )

    const renderMessageContent = (message: string) => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        // Split message by URLs and keep the URLs in the output array
        const parts = message.split(urlRegex);

        return (
            <span className="message">
                {parts.map((part, index) => {
                    if (part.match(urlRegex)) {
                        // If the part is a URL, render it as an image
                        return <img key={index} className="message-emote" src={part} />;
                    } else {
                        // If the part is text, render it as text
                        return part;
                    }
                })}
            </span>
        )
    };


    return (
        <div
            className={`message-container ${className}`}
        >
            <div className="chat-message-info">
                {platform === 'YouTube' ?
                    <img src={YouTubeBadge} alt="YouTube Badge" className='message-badge' /> :
                    <img src={TwitchBadge} alt="Twitch Badge" className='message-badge' />
                }
                {Badges}
                {Username}
            </div>
            <span>:</span>
            <span >{renderMessageContent(message)}</span>
        </div>
    )
}

export default ChatMessage