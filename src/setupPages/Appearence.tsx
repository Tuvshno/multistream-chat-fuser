import { useEffect, useState } from "react";
import '../components/css/GeneralPage.css';
import ChatMessage from '../components/ChatMessage';
import { Emote } from "../utils/models";

const Appearence = () => {

  const [fontSize, setFontSize] = useState(14);
  const [enablePlatformIcons, setEnablePlatformIcons] = useState(true);
  const [enableBadges, setEnableBadges] = useState(true);
  const [enableToolbar, setEnableToolbar] = useState(true);

  const dummyInfo = {
    "id": "1",
    "platform": "Twitch",
    "messageType": "Message",
    "authorName": "Username",
    "message": "This is what a chat message will look like",
    "imgSrcs": ["https://static-cdn.jtvnw.net/badges/v1/4b76d5f2-91cc-4400-adf2-908a1e6cfd1e/1"],
    "authorColor": "rgb(218, 28, 0)"
  }

  const emotes: Emote[] = [];

  // Get Settings
  useEffect(() => {
    //Set Previous Font Size 
    window.electronAPI.getFontSize().then((fs) => {
      setFontSize(fs);
    });
    //Set Previous Platform Icons 
    window.electronAPI.getPlatformIconsEnabled().then((isEnabled) => {
      setEnablePlatformIcons(isEnabled);
    });
    //Set Previous Badges Icons 
    window.electronAPI.getBadgesEnabled().then((isEnabled) => {
      setEnableBadges(isEnabled);
    });
    //Set Previous Toolbar Setting 
    window.electronAPI.getToolbarEnabled().then((isEnabled) => {
      setEnableToolbar(isEnabled);
    });
  }, []);

  // Increase font size
  const increaseFontSize = () => {
    window.electronAPI.saveFontSize(fontSize + 1);
    setFontSize(fontSize + 1);

  };

  // Decrease font size
  const decreaseFontSize = () => {
    if (fontSize > 1) {
      window.electronAPI.saveFontSize(fontSize - 1);
      setFontSize(fontSize - 1);
    }
  };

  const togglePlatformIcons = () => {
    console.log('platform checkbox clicked')
    window.electronAPI.savePlatformIconsEnabled(!enablePlatformIcons);
    setEnablePlatformIcons(!enablePlatformIcons);
  };

  const toggleBadges = () => {
    console.log('badge checkbox clicked')
    window.electronAPI.saveBadgesEnabled(!enableBadges);
    setEnableBadges(!enableBadges);
  };

  const toggleToolbar = () => {
    console.log('toggleToolbar checkbox clicked')
    window.electronAPI.saveToolbarEnabled(!enableToolbar);
    setEnableToolbar(!enableToolbar);
  };

  return (
    <div>
      <div className="setup-setting">
        <h2 className="setup-setting-title">Appearence</h2>
        <div className="setup-setting-description">
          Controls appearence settings of your Chat.
        </div>
        <ChatMessage
          style={{
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            fontSize: `${fontSize}px`,

          }}
          messageInfo={dummyInfo}
          enablePlatformIcons={enablePlatformIcons}
          enableBadges={enableBadges}
          emotes={emotes}
        />
      </div>
      <div className="setup-setting">
        <h3 className="setup-setting-title">Font Size</h3>
        <div className="setup-setting-description">
          Controls font size of chat messages.
        </div>
        <span>Font Size: {fontSize}</span>
        <button onClick={decreaseFontSize} className='font-size-button negative'>-</button>
        <button onClick={increaseFontSize} className='font-size-button positive'>+</button>
      </div>
      <div className="setup-setting">
        <h3 className="setup-setting-title">Platform Icons</h3>
        <div className="setup-setting-description">
          Controls whether to show platform icons.
        </div>
        <div className="platform-icons-toggle">

          <input
            className="styled-checkbox"
            id="enablePlatformIcons"
            type="checkbox"
            checked={enablePlatformIcons}
            onChange={togglePlatformIcons}
          />
          <label htmlFor="enablePlatformIcons">Enable platform icons</label>

        </div>
      </div>
      <div className="setup-setting">
        <h3 className="setup-setting-title">Badges</h3>
        <div className="setup-setting-description">
          Controls whether to show badges.
        </div>
        <div className="platform-icons-toggle">

          <input
            className="styled-checkbox"
            id="enableBadges"
            type="checkbox"
            checked={enableBadges}
            onChange={toggleBadges}
          />
          <label htmlFor="enableBadges">Enable badges</label>

        </div>
      </div>
      <div className="setup-setting">
        <h3 className="setup-setting-title">Enable Developer Tools</h3>
        <div className="setup-setting-description">
          Controls whether to show Windows Toolbar
        </div>
        <div className="platform-icons-toggle">

          <input
            className="styled-checkbox"
            id="enableToolbar"
            type="checkbox"
            checked={enableToolbar}
            onChange={toggleToolbar}
          />
          <label htmlFor="enableToolbar">Enable Developer Tools</label>

        </div>
      </div>
    </div>
  );
};

export default Appearence;
