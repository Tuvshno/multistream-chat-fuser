import React from 'react';
import Chat from './components/Chat'
import './components/css/MainScreen.css'

const MainScreen: React.FC = () => {

    return (
        <main className='Chat-Component'>
            <Chat />
        </main>
    );
};

export default MainScreen;