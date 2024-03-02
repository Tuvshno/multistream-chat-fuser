import { useState, useEffect } from 'react';
import './setup.css'
import { IoMdClose } from "react-icons/io";
import General from './setupPages/General';
import Appearence from './setupPages/Appearence';
import Logins from './setupPages/Logins';
import Version from './setupPages/Version';

type SetSetupFunction = (value: boolean) => void; // Example function type that takes a boolean and returns void

// Define the props for the SetupScreen component
interface SetupScreenProps {
    setSetup: SetSetupFunction;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ setSetup }) => {
    const [page, setPage] = useState('General');

    useEffect(() => {
        async function fetchAndSetWindowSize() {
            const size = await window.electronAPI.getSetupWindowSize(); // Assume electronAPI is set up via contextBridge
            if (size) {
                window.electronAPI.setWindowSize(size.width, size.height).then(() => {
                    window.electronAPI.center();
                });
            }
        }

        fetchAndSetWindowSize();

        return () => {
            window.electronAPI.changeSetupWindowSize()
        }
    }, []);


    const switchPage = (page: string) => {
        setPage(page);
    }

    const goToMain = () => {
        window.electronAPI.setSetup(false);
        setSetup(false);
    }

    return (
        <div className='setup-container' >
            <div className='setup-main'>
                <div className='setup-main-top'>
                    <div>User</div>
                    <div>Synced</div>
                </div>
                <div className='setup-main-settings'>
                    <div className='setup-nav-bar'>
                        <button onClick={() => switchPage('General')}>General</button>
                        <button onClick={() => switchPage('Appearence')}>Appearence</button>
                        <button onClick={() => switchPage('Logins')}>Logins</button>
                        <button onClick={() => switchPage('Version')}>Version</button>

                    </div>

                    <div className='setup-details'>
                        {page === 'General' && <General />}
                        {page === 'Appearence' && <Appearence />}
                        {page === 'Logins' && <Logins />}
                        {page === 'Version' && <Version />}

                    </div>
                </div>

            </div>
            <IoMdClose onClick={goToMain} className='return' />
        </div >
    );
};

export default SetupScreen;
