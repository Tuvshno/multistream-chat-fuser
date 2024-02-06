// SetupScreen.js
import React, { useState, useEffect } from 'react';

const MainScreen = () => {

    useEffect(() => {
        console.log('starting server...')
        window.electronAPI.startServer();
    }, []);

    return (
        <div>
            MainScreen
        </div>
    );
};

export default MainScreen;
