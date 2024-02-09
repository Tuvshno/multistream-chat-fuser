import './ChatMessage.css'
import TwitchBadge from './assets/Twitch_Badge_18.png';
import YouTubeBadge from './assets/YT_Badge_18.png';

const ChatMessage = ({
  message: { platform, imgSrcs, authorName, message },
  className,
}) => {
  const Badges = author.badges.map((bg, i) => (
    <img
      key={i}
      src={`/badges/${bg}.png`}
      className="mr-2 w-4 h-4 self-center"
    />
  ))

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
  
  return (
    <div
      className={`text-[15px] py-1 px-2 rounded hover:bg-gray-500/30 leading-6 ${className}`}
    >
      <div className="inline-flex items-baseline">
        {Badges}
        {platform === 'YouTube' ? <div ><img src={YouTubeBadge} alt="YouTube Badge" /></div> : <div><img src={TwitchBadge} alt="Twitch Badge" /></div>}
        {imgSrcs.map((badge, badgeIndex) => (
          <div key={badgeIndex}>
            <img src={badge} alt="Chat Badge" />
          </div>
        ))}
        {authorName}
      </div>
      <span className="ml-3 break-words">{renderMessageContent(message)}</span>
    </div>
  )
}

export default ChatMessage