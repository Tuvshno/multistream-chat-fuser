import { useState, useEffect } from 'react';
import './setup.css'

type SetSetupFunction = (value: boolean) => void; // Example function type that takes a boolean and returns void

// Define the props for the SetupScreen component
interface SetupScreenProps {
    setSetup: SetSetupFunction;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ setSetup }) => {
    const [urls, setUrls] = useState(['']);

    // Set up urls 
    useEffect(() => {
        window.electronAPI.getUrls().then((fetchedUrls) => {
            if (fetchedUrls.length === 0) {
                setUrls(['']); // Set default empty input if fetched list is empty
            } else {
                setUrls(fetchedUrls);
            }
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

    // Handling submit
    const handleSubmit = () => {
        window.electronAPI.saveURLS(urls);
    };

    // Switch View to Main
    const goToMain = () => {
        window.electronAPI.setSetup(false);
        setSetup(false);
        // window.electronAPI.restartApp();
    }

    return (
        <div className='setup-container'>
            <h2 className='setup-header'>Setup</h2>
            {urls.map((url, index) => (
                <input
                    key={index}
                    type="text"
                    value={url}
                    className='setup-url-input'
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                />
            ))}
            <button onClick={addNewUrlField} className='setup-button'>Add Another URL</button>
            <button onClick={goToMain} className='setup-button'>Go to Main Screen</button>
            <button onClick={handleSubmit} className='setup-button save'>Save</button>
        </div>
    );
};

export default SetupScreen;
