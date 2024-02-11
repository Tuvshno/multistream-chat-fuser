import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import MainScreen from './MainScreen';

const App = () => {
  const [setup, setSetup] = useState<boolean | null>(null);

  useEffect(() => {
    // Get the initial setup state
    window.electronAPI.setup().then(setSetup);

    // Define a function to handle updates to the setup state
    const handleSetupUpdate = (updatedSetup: boolean) => {
      setSetup(updatedSetup);
    };

    // Listen for 'setup-updated' messages from the main process
    window.electronAPI.onSetupUpdated(handleSetupUpdate);

    // Cleanup the listener when the component unmounts
    return () => {
      window.electronAPI.removeSetupUpdatedListener(handleSetupUpdate);
    };
  }, []);

  if (setup === null) {
    return <div>Loading...</div>;
  }

  return setup ? <SetupScreen setSetup={setSetup} /> : <MainScreen />;
};

export default App;
