import { useState } from 'react'
import { GiPauseButton } from 'react-icons/gi'
import { ImArrowDown2 } from 'react-icons/im'
import './css/ChatPausedAlert.css'

const ChatPausedAlert = ({
    onClick: handleClick
}: {
    onClick: () => void
}) => {
    const [isHovered, setIsHovered] = useState(false)

    const label = isHovered ? (
        <span className="message-label">
            <ImArrowDown2 className="icon-style" />
            See new messages
        </span>
    ) : (
        <span className="message-label">
            <GiPauseButton className="icon-style" />
            Chat paused due to scroll
        </span>
    )

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            className={`chat-alert-container`}
        >
            {label}
        </div>
    )
}

export default ChatPausedAlert