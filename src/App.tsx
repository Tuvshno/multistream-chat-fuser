import react, { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import MainScreen from './MainScreen';



const App = () => {
  // Storing first run for initial Setup
  const [setup, setSetup] = useState<boolean | null>(null);

  // Get the setup value for initialization
  useEffect(() => {
    window.electronAPI.setup().then(setSetup);
  }, []);


  // If firstRun is null, we're still waiting for the result
  if (setup === null) {
    return <div>Loading...</div>;
  }

  return setup ? <SetupScreen setSetup={setSetup} /> : <MainScreen />;
};

export default App