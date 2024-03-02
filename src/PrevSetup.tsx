import { useState, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import './setup.css'
import { IoMdRemoveCircle } from "react-icons/io";
import { GiReturnArrow } from "react-icons/gi";

type SetSetupFunction = (value: boolean) => void; // Example function type that takes a boolean and returns void

// Define the props for the SetupScreen component
interface SetupScreenProps {
    setSetup: SetSetupFunction;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ setSetup }) => {
    const [urls, setUrls] = useState(['']);
    const [fontSize, setFontSize] = useState(14);
    const [IsTwitchLoggedIn, setIsTwitchLoggedIn] = useState(false);
    const dummyInfo = {
        "id": "1",
        "platform": "Twitch",
        "messageType": "Message",
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

        //Check if logged in
        window.electronAPI.isTwitchLoggedIn().then((loggedIn) => {
            setIsTwitchLoggedIn(loggedIn)
        })


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

    const loginWithTwitch = () => {
        window.electronAPI.loginWithTwitch();
    }

    // const loginWithYouTube = () => {
    //     window.electronAPI.loginWithYouTube();
    // }



    const removeUrlField = (index: number) => {
        // Remove the URL at the specified index
        const filteredUrls = urls.filter((_, i) => i !== index);
        setUrls(filteredUrls);
    };

    return (
        <div className='setup-container' >
            <h2 className='setup-header'>Setup</h2>
            <div className='setup-login-auth'>
                {
                    IsTwitchLoggedIn ?
                        <div> Twitch Connected </div>
                        :
                        <div className='login-card twitch' onClick={loginWithTwitch}>
                            {/* <img src={TwitchBadge} alt="Twitch" className='login-badge' /> */}
                            <span>Login with Twitch</span>
                        </div>
                }

                {/* <div className='login-card youtube' onClick={loginWithYouTube}>
                    <span>Login with YouTube</span>
                </div> */}
            </div>
            {urls.map((url, index) => (
                <div key={index} className='url-input-container'>
                    <input
                        type="text"
                        value={url}
                        className='setup-url-input'
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                    />
                    <IoMdRemoveCircle onClick={() => removeUrlField(index)} className='remove-url-button' size="20px" />
                </div>
            ))
            }
            <button onClick={addNewUrlField} className='setup-button'>Add Another URL</button>

            < div className='font-size-controls' >
                <button onClick={decreaseFontSize} className='font-size-button negative'>-</button>
                <span>Font Size: {fontSize}</span>
                <button onClick={increaseFontSize} className='font-size-button positive'>+</button>
            </div >
            <ChatMessage style={{ fontSize: `${fontSize}px` }} messageInfo={dummyInfo} />
            <GiReturnArrow onClick={goToMain} className='return' />
            <button onClick={handleSubmit} className='setup-button save'>Save</button>

            <div className='restart-highlight'>Highly Recommended to Restart App to Apply URL Changes</div>
            <div className='version'>Version 1.3.4</div>

        </div >
    );
};

export default SetupScreen;
