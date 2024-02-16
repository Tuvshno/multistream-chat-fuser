import { useState, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import './setup.css'

type SetSetupFunction = (value: boolean) => void; // Example function type that takes a boolean and returns void

// Define the props for the SetupScreen component
interface SetupScreenProps {
    setSetup: SetSetupFunction;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ setSetup }) => {
    const [urls, setUrls] = useState(['']);
    const [fontSize, setFontSize] = useState(14);
    const dummyInfo = {
        "id": "1",
        "platform": "Twitch",
        "authorName": "Username",
        "message": "This is a chat message",
        "imgSrcs": ["https://static-cdn.jtvnw.net/badges/v1/4b76d5f2-91cc-4400-adf2-908a1e6cfd1e/1"],
        "authorColor": "rgb(218, 28, 0)"
    }

    // Set up urls 
    useEffect(() => {
        window.electronAPI.getUrls().then((fetchedUrls) => {
            if (fetchedUrls.length === 0) {
                setUrls(['']); // Set default empty input if fetched list is empty
            } else {
                setUrls(fetchedUrls);
            }
        });

        //Set Previous Font Size 
        window.electronAPI.getFontSize().then((fs) => {
            setFontSize(fs);
        });


    }, []);

    // Handle Input Change
    const handleUrlChange = (index: number, newValue: string) => {
        // Update the specific URL at the index
        const newUrls = urls.map((url, i) => (i === index ? newValue : url));
        setUrls(newUrls);
    };

    //Adding new URL
    const addNewUrlField = () => {
        // Add a new empty URL field
        setUrls([...urls, '']);
    };

    // Save Button
    const handleSubmit = () => {
        window.electronAPI.saveURLS(urls);
        window.electronAPI.saveFontSize(fontSize);
    };

    // Switch View to Main
    const goToMain = () => {
        window.electronAPI.setSetup(false);
        setSetup(false);
        // window.electronAPI.restartApp();
    }

    // Increase font size
    const increaseFontSize = () => {
        setFontSize(fontSize + 1);
    };

    // Decrease font size
    const decreaseFontSize = () => {
        if (fontSize > 1) {
            setFontSize(fontSize - 1);
        }
    };

    return (
        <div className='setup-container' >
            <h2 className='setup-header'>Setup</h2>
            {urls.map((url, index) => (
                <input
                    key={index}
                    type="text"
                    value={url}
                    className='setup-url-input'
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                />
            ))
            }
            < div className='font-size-controls' >
                <button onClick={decreaseFontSize} className='font-size-button negative'>-</button>
                <span>Font Size: {fontSize}</span>
                <button onClick={increaseFontSize} className='font-size-button positive'>+</button>
            </div >
            <ChatMessage style={{ fontSize: `${fontSize}px` }} messageInfo={dummyInfo} />
            <button onClick={addNewUrlField} className='setup-button'>Add Another URL</button>
            <button onClick={goToMain} className='setup-button'>Go to Main Screen</button>
            <button onClick={handleSubmit} className='setup-button save'>Save</button>
        </div >
    );
};

export default SetupScreen;
