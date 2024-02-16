import { useState } from 'react'
import './css/SendMessageForm.css'
import { IoSettingsOutline } from "react-icons/io5";

type SendMessageFormProps = {
    onSend: (message: string) => void
    className?: string
}

const MAX_MESSAGE_LENGTH = 300

const SendMessageForm = ({ onSend  }: SendMessageFormProps) => {
    const [message, setMessage] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const filteredMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH)

        if (filteredMessage) {
            onSend(filteredMessage)
        }

        setMessage('')
    }

const openSettingsWindow = () => {
    console.log('sending message to open settings');
    // onCloseWebSocket();
    window.electronAPI.openSettingsWindow();
}

    return (
        <form className="send-message-form" onSubmit={handleSubmit}>
            <div className="send-message-form-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="send-message-form-input"
                    placeholder="Send a chat message"
                />
            </div>
            <div className='buttons'>
                <button className='settings-button' onClick={openSettingsWindow}>
                    <IoSettingsOutline />
                    </button>

                <button
                    className="send-message-form-button"
                    type="submit"
                >
                    Chat
                </button>
            </div>

        </form>
    )
}

export default SendMessageForm