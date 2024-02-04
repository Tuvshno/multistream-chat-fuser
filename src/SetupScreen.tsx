// SetupScreen.js
import React, { useState } from 'react';
const { ipcRenderer } = window.require('electron');

const SetupScreen = () => {
    const [inputData, setInputData] = useState('');

    const handleSubmit = () => {
        // Send the input data to the main process
        ipcRenderer.send('start-script', inputData);
    };

    return (
        <div>
            <input
                type="text"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
            />
            <button onClick={handleSubmit}>Begin Script</button>
        </div>
    );
};

export default SetupScreen;
