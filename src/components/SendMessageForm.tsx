import { useState } from 'react';
import './css/SendMessageForm.css';
import { IoSettingsOutline } from "react-icons/io5";

type SendMessageFormProps = {
    onSend: (message: string) => void;
    className?: string;
};

const SendMessageForm = ({ onSend, className }: SendMessageFormProps) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const filteredMessage = message;
        if (filteredMessage) {
            onSend(filteredMessage);
        }
        setMessage('');
    };

    const openSettingsWindow = () => {
        console.log('Sending message to open settings');
        window.electronAPI.openSettingsWindow();
    };

    return (
        <form className={`send-message-form ${className || ''}`} onSubmit={handleSubmit}>
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
                <button type="button" className='settings-button' onClick={openSettingsWindow}>
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
    );
};

export default SendMessageForm;
