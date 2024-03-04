import { MessageModel } from '../utils/models'
import YouTubeBadge from '../assets/YT_Badge_18.png'
import TwitchBadge from '../assets/Twitch_Badge_18.png'
import KickBadge from '../assets/Kick_Icon.png'

import { FaStar } from "react-icons/fa6";

import './css/ChatMessage.css'

type MessageProps = {
    messageInfo: MessageModel;
    style?: React.CSSProperties;
    enablePlatformIcons?: boolean;
    enableBadges?: boolean;
} & React.ComponentPropsWithRef<'div'>

const ChatMessage = ({
    messageInfo: { platform, messageType, authorName, message, imgSrcs, badgeSvgs, authorColor, replyingTo, subscriptionInfo },
    className,
    style,
    enablePlatformIcons,
    enableBadges
}: MessageProps) => {
    const Badges = (imgSrcs ?? []).concat(badgeSvgs ?? []).map((src, i) => {
        if (typeof src === 'string' && src.startsWith('<svg')) { // Assuming badgeSvgs contain SVG markup
            return <span key={i} className="message-badge" dangerouslySetInnerHTML={{ __html: src }}></span>;
        } else {
            return <img key={i} src={src} className="message-badge" alt="Badge" />;
        }
    });
    const Username = (
        <span className="message-username" style={{ color: authorColor }}>
            {authorName}
        </span>
    )
    const renderMessageContent = (message: string) => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        // Function to check if a URL points to an image, is from the Twitch CDN, or is a YouTube image URL
        const isImageUrl = (url: string) => {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'svg'];
            const isTwitchCdnUrl = url.startsWith('https://static-cdn.jtvnw.net');
            const isYoutubeImageUrl = url.startsWith('https://yt3.ggpht.com/');
            const isKickImageUrl = url.startsWith('https://files.kick.com');
            return isTwitchCdnUrl || isYoutubeImageUrl || isKickImageUrl || imageExtensions.some(extension => url.toLowerCase().endsWith(extension));
        };

        // Split message by URLs and keep the URLs in the output array
        const parts = message.split(urlRegex);

        return (
            <span className={`message ${messageType === 'Highlighted' && 'highlighted-message'}`}>
                {parts.map((part, index) => {
                    if (part.match(urlRegex)) {
                        // Check if the URL points to an image, is a Twitch CDN URL, or is a YouTube image URL
                        if (isImageUrl(part)) {
                            // Render it as an <img> tag
                            return <img key={index} className="message-emote" src={part} alt="" />;
                        } else {
                            // If the URL does not point to an image, render it as a clickable link
                            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="message-link">{part}</a>;
                        }
                    } else {
                        // If the part is text, render it as text
                        return part;
                    }
                })}
            </span>
        )
    };

    // Function to extract subscriber's name and message
    const renderSubscriptionInfo = (info: string) => {
        const [name, ...messageParts] = info.split(' ');
        const message = messageParts.join(' ');

        return (
            <div className="subscription-info">
                <div className="subscriber-name"><FaStar className='message-badge' /> {name}</div> {/* Adding the React star icon */}
                <div>{message}</div>
            </div>
        );
    };

    return (
        messageType === 'Subscription' ?
            <div className={`message-container subscription ${className}`} style={style}>
                {subscriptionInfo &&
                    renderSubscriptionInfo(subscriptionInfo) // Using the new function to render subscription info
                }
                {message &&
                    <div>
                        <div className="chat-message-info">
                            {
                                enablePlatformIcons && (
                                    platform === 'YouTube' ?
                                        <img src={YouTubeBadge} alt="YouTube Badge" className='message-badge' /> :
                                        (platform === 'Twitch' ?
                                            <img src={TwitchBadge} alt="Twitch Badge" className='message-badge' /> :
                                            <img src={KickBadge} alt="Kick Badge" className='message-badge' />
                                        )
                                )
                            }
                            {enableBadges && Badges}
                            {Username}
                        </div>
                        <span>:</span>
                        {renderMessageContent(message)}
                    </div>
                }
            </div>
            :
            <div
                className={
                    `message-container 
                    
                    ${className}`
                }
                style={style}
            >

                {replyingTo && (
                    <div className="replying-message" style={style}>
                        {replyingTo}
                    </div>
                )}

                <div className="chat-message-info">
                    {enablePlatformIcons && (platform === 'YouTube' ?
                        <img src={YouTubeBadge} alt="YouTube Badge" className='message-badge' /> :
                        (platform === 'Twitch' ?
                            <img src={TwitchBadge} alt="Twitch Badge" className='message-badge' /> :
                            <img src={KickBadge} alt="Kick Badge" className='message-badge' />
                        )
                    )}
                    {enableBadges && Badges}
                    {Username}
                </div>
                <span>:</span>
                {renderMessageContent(message)}
            </div>
    );
};


export default ChatMessage