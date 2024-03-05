import { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import { MdOutlineDownloadForOffline } from "react-icons/md";

import '../components/css/GeneralPage.css';
import '../components/css/Emotes.css';

const Emotes = () => {
  const [urls, setUrls] = useState(['']);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isChanges, setIsChanges] = useState(false);
  const [ready, setReady] = useState(false);

  // Get previous emote Links
  // useEffect(() => {
  //   window.electronAPI.getUrls().then((fetchedUrls) => {
  //     setUrls(fetchedUrls.length ? fetchedUrls : ['']);
  //   });
  // }, []);

  useEffect(() => {
    // Check if all URLs are non-empty strings
    const allUrlsValid = urls.every(url => url.trim() !== '');
    setReady(allUrlsValid);
  }, [urls]);

  // Function to check and save URL changes
  const urlChanges = () => {
    window.electronAPI.getUrls().then((fetchedUrls) => {
      // Check if the current URLs have changed compared to the fetched URLs
      const hasChanged = urls.some((url, index) => url !== fetchedUrls[index]) || urls.length !== fetchedUrls.length;
      if (hasChanged) {
        setIsChanges(true);
        // Save the new URLs
        window.electronAPI.saveURLS(urls);
      }
    });
  };

  const downloadEmotes = () => {
    window.electronAPI.getEmotesFromURL(urls[0]);
  };

  const handleUrlChange = (newValue: string) => {
    const newUrls = urls.map((url, i) => (i === editIndex ? newValue : url));
    setUrls(newUrls);
    urlChanges();
  };

  const addNewUrlField = () => {
    const newUrls = [...urls, '']; // Add a new empty URL field
    setUrls(newUrls);
    setEditIndex(newUrls.length - 1);
    urlChanges();
  };

  const removeUrlField = (index: number) => {
    const filteredUrls = urls.filter((_, i) => i !== index);
    setUrls(filteredUrls);
    window.electronAPI.saveURLS(filteredUrls);
  };

  // Function to save the edited URL and exit edit mode
  const saveEdit = () => {
    setEditIndex(null); // Exit edit mode
    urlChanges();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit(); // Exit edit mode
      urlChanges();
    }
  };

  const getBorderColor = (url: string) => {
    if (url.includes("7tv")) return "#2C95ED"; // Twitch purple
    return "transparent"; // Default case if neither
  };

  // const openTutorial = () => {
  //   console.log('clicked tut')
  //   window.electronAPI.openTutorial();
  // }

  return (
    <div>
      <div className="setup-setting">
        <h3 className="setup-setting-title">7TV Emote Linking</h3>
        <div className="setup-setting-description">
          Controls which 7TV Account Emotes you want in your chat.
          {/* <span className="setting-tooltip underline" onClick={openTutorial}>Tutorial</span> */}
        </div>

        {urls.map((url, index) => (
          <div
            key={index}
            // ${index % 2 === 0 ? 'even' : 'odd'}
            className={`url-input-container `}
            style={{
              borderLeft: `4px solid ${getBorderColor(url)}`, // Apply dynamic border color
              marginBottom: '5px',
            }}
          >


            {editIndex === index ? (
              <>
                <input
                  type="text"
                  value={url}
                  className="setup-url-input"
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={saveEdit} // Save and exit edit mode when input loses focus
                  onKeyDown={(e) => handleKeyDown(e)}
                  placeholder="Add Chat Popout URL"
                  autoFocus
                />
              </>
            ) : (
              <div className="url-change">
                <div className="url">{url || ""}</div>
                <div className="url-change-button">
                  <MdOutlineEdit className=" remove-url-button edit" onClick={() => setEditIndex(index)} />
                  <IoClose onClick={() => removeUrlField(index)} className="remove-url-button" size="20px" />
                </div>

              </div>
            )}
          </div>
        ))}
        <button onClick={addNewUrlField} className="setup-add-button">Add 7TV Url</button>
        <MdOutlineDownloadForOffline onClick={downloadEmotes} className="setup-download-button" style={{ marginLeft: '10px' }} />
        {isChanges &&
          <div className="tooltip-warning">
            <FaInfoCircle style={{ marginRight: '10px' }} />
            <span>You must restart to apply any link changes.</span>
          </div>
        }
        {!isChanges && ready && <div className="ready-to-go">Emotes Linked!</div>}
      </div>

      <div className="setup-setting">
        <h3 className="setup-setting-title">Emotes</h3>
        <div className="setup-setting-description">
          All the emotes you currently have.
        </div>


      </div>


    </div>
  );
};

export default Emotes;
