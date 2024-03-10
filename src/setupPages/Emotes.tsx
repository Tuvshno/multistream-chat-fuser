import { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import { MdOutlineDownloadForOffline } from "react-icons/md";
import { Emote } from '../utils/models'

import '../components/css/GeneralPage.css';
import '../components/css/Emotes.css';


const Emotes = () => {
  const [urls, setUrls] = useState(['']);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isChanges, setIsChanges] = useState(false);
  const [ready, setReady] = useState(false);

  const [emotesReady, setEmotesReady] = useState(false);
  // const [emotes, setEmotes] = useState<Emote[]>([]);
  const [emotes, setEmotes] = useState<Emote[]>([]);

  // const [progressMessage, setProgressMessage] = useState('');
  // const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Get previous emote Links
    window.electronAPI.getEmoteUrls().then((fetchedUrls) => {
      console.log(fetchedUrls)
      setUrls(fetchedUrls.length ? fetchedUrls : ['']);
    });

    //Check if emotes already downloaded
    window.electronAPI.checkEmotesReady().then((isReady: boolean) => {
      setEmotesReady(isReady);

      if (isReady) {
        window.electronAPI.getEmoteFiles().then((fetchedEmotes: Emote[]) => {
          console.log(fetchedEmotes);
          setEmotes(fetchedEmotes);
        });
      }
    })

    // Listen for downlaod updates
    window.electronAPI.onEmoteDownloadUpdate((value: boolean) => {
      setEmotesReady(value);
      // If download was successfull
      if (value) {
        setIsChanges(false);
        // Replace new emotes
        window.electronAPI.getEmoteFiles().then((fetchedEmotes: Emote[]) => {
          console.log(fetchedEmotes);
          setEmotes(fetchedEmotes);
        });

        //Update checkers
      }
    })
  }, []);

  // Using JSOn
  // useEffect(() => {
  //   window.electronAPI.getEmotesJSON().then((json: Emote[]) => {
  //     console.log(json);
  //     setEmotes(json);
  //   })
  // }, [emotesReady])

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
        window.electronAPI.saveEmoteURLS(urls);
      }
    });
    window.electronAPI.setEmotesReady(false);
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

  const openTutorial = () => {
    console.log('clicked tut')
    window.electronAPI.openEmoteTutorial();
  }

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
        <span className="setting-tooltip underline" onClick={openTutorial}>Tutorial</span>

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
        {/* <button onClick={addNewUrlField} >Add 7TV Url</button> */}
        {(!emotesReady || isChanges) && <button onClick={downloadEmotes} className="setup-add-button">
          Download Emotes
          <MdOutlineDownloadForOffline className="setup-download-button" style={{ marginLeft: '10px' }} />
        </button>
        }

        {isChanges &&
          <div className="tooltip-warning">
            <FaInfoCircle style={{ marginRight: '10px' }} />
            <span>Redownload the your emotes for new link.</span>
          </div>
        }
        {(!isChanges && emotesReady) && <div className="ready-to-go">Emotes Linked!</div>}
      </div>

      <div className="setup-setting">
        <h3 className="setup-setting-title">Emotes</h3>
        <div className="setup-setting-description">
          All the emotes you currently have.
        </div>

        <div className="emotes-container">
          {emotes.map((emote, index) => (
            <div key={index} className="emote-item">
              <img src={emote.data} alt={emote.name} className="emote-image" />
              <div className="emote-title">{emote.name}</div>
            </div>
          ))}
        </div>

      </div>


    </div>
  );
};

export default Emotes;
