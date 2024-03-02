import { useEffect, useState } from "react";
import '../components/css/GeneralPage.css';
import '../components/css/Logins.css';

const Logins = () => {

  const [IsTwitchLoggedIn, setIsTwitchLoggedIn] = useState(false);

  // Get Settings
  useEffect(() => {
    //Check if logged in
    window.electronAPI.isTwitchLoggedIn().then((loggedIn) => {
      setIsTwitchLoggedIn(loggedIn)
    })
  }, []);

  const loginWithTwitch = () => {
    window.electronAPI.loginWithTwitch();
  }

  // const loginWithYouTube = () => {
  //     window.electronAPI.loginWithYouTube();
  // }

  const platforms = [
    { name: 'Twitch', supported: true },
    { name: 'YouTube', supported: false },
    { name: 'Kick', supported: false },
    { name: 'Twitter', supported: false },
    { name: 'Instagram', supported: false },
    { name: 'Facebook', supported: false },
  ];


  return (
    <div>
      <div className="setup-setting">
        <h2 className="setup-setting-title">Logins</h2>
        <div className="setup-setting-description">
          Controls the accounts you are logged into on each platform. Allowing you to chat to each platform with a specific account. Unfortunately, we only support Twitch for the moment.
        </div>

      </div>
      <div className="setup-setting">
        <div>
          <h3 className="setup-setting-title">Connected Platforms</h3>
          <table className="table">

            <tbody>
              {
                platforms.map((platform, index) => (
                  <tr key={index}>
                    <td>{platform.name}</td>
                    <td>
                      {
                        platform.name === 'Twitch' && IsTwitchLoggedIn
                          ? 'Connected'
                          : platform.supported
                            ? <button className="connect-button" onClick={() => platform.name === 'Twitch' && loginWithTwitch()}>Connect</button>
                            : 'Not supported'
                      }
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
};

export default Logins;
