import { useState, useEffect } from 'react';
import './setup.css'

const SetupScreen = ({ setSetup }) => {
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
    }

    return (
        <div>
            <h2>Setup</h2>
            {urls.map((url, index) => (
                <input
                    key={index}
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                />
            ))}
            <button onClick={addNewUrlField}>Add Another URL</button>
            <button onClick={handleSubmit}>Save</button>
            <button onClick={goToMain}>Go to Main Screen</button>

        </div>
    );
};

export default SetupScreen;
