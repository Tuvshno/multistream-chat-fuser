const Version = () => {
  return (
    <div>
      <div className="setup-setting">
        <h2 className="setup-setting-title">Version</h2>
        <div className="setup-setting-description">
          <div>v1.3.8</div>
        </div>
      </div>

      <div className="setup-setting">
        <h2 className="setup-setting-title">Features</h2>
        <div className="setup-setting-description">
          <table>
            <thead>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul>
                    <li>Currently supports Twitch, Kick, and YouTube Chat fusion</li>
                    <li>Default Emotes</li>
                    <li>Customizable Messages</li>
                    <li>Subscription Notifications from Twitch</li>
                    <li>Highlighted Messages from Twitch</li>
                    <li>Reply Messages from Twitch</li>
                    <li>Send Chat Messages to Twitch Chat</li>
                  </ul>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      <div className="setup-setting">
        <h2 className="setup-setting-title">Future Features</h2>
        <div className="setup-setting-description">
          <table>
            <thead>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul>
                    <li>Instagram, Facebook, and Twitter</li>
                    <li>Hype Trains</li>
                    <li>Bits</li>
                    <li>7TV, BTTV, FFZ Emotes</li>
                    <li>Gifted Subs</li>
                    <li>Cash In Rewards</li>
                    <li>Send Chat Messages to other platforms</li>
                    <li>Logging into other platforms</li>
                    <li>@ Messages</li>
                    <li>Improved Lifecycle to reduce restarts needed</li>
                    <li>Custom Themes</li>
                    <li>YouTube Superchats</li>
                    <li>YouTube Memberships</li>
                    <li>YouTube Reactions</li>
                  </ul>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      <div className="setup-setting">
        <h2 className="setup-setting-title">Change Log</h2>
        <div className="setup-setting-description">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.3.8</td>
                <td>2024-03-04</td>
                <td>
                  <ul>
                    <li>Added Kick Support!</li>
                    <li>UX Improvments</li>

                  </ul>
                </td>
              </tr>

              <tr>
                <td>1.3.7</td>
                <td>2024-03-01</td>
                <td>
                  <ul>
                    <li>Full Refactor and UI/UX of Setup Screen.</li>
                    <li>Added Setting Synchronization</li>
                  </ul>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Version;
