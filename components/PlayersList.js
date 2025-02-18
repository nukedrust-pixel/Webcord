function PlayersList() {
  const [peers, setPeers] = React.useState({});
  const [offlinePeers, setOfflinePeers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [userSettings, setUserSettings] = React.useState({});

  React.useEffect(() => {
    // Subscribe to peer updates
    const unsubscribe = room.party.subscribe((newPeers) => {
      setPeers(newPeers);
    });

    // Get offline users from message history
    const getOfflineUsers = async () => {
      const messages = await room.collection('message').getList();
      const onlineUsernames = Object.values(room.party.peers).map(p => p.username);
      const allUsernames = [...new Set(messages.map(m => m.username))];
      const offlineUsernames = allUsernames.filter(u => !onlineUsernames.includes(u));
      setOfflinePeers(offlineUsernames);
    };

    // Subscribe to user settings updates
    const settingsUnsubscribe = room.collection('user_settings').subscribe((settings) => {
      const newUserSettings = {};
      settings.forEach(setting => {
        newUserSettings[setting.username] = setting.settings;
        localStorage.setItem(`userSettings_${setting.username}`, JSON.stringify(setting.settings));
      });
      setUserSettings(newUserSettings);
    });

    // Load existing settings
    const loadSettings = async () => {
      const settings = await room.collection('user_settings').getList();
      const newUserSettings = {};
      settings.forEach(setting => {
        newUserSettings[setting.username] = setting.settings;
        localStorage.setItem(`userSettings_${setting.username}`, JSON.stringify(setting.settings));
      });
      setUserSettings(newUserSettings);
    };

    getOfflineUsers();
    loadSettings();

    return () => {
      unsubscribe();
      settingsUnsubscribe();
    };
  }, []);

  const getDisplayName = (username) => {
    return userSettings[username]?.displayName || username;
  };

  return (
    <div className="players-list">
      <div className="players-header">
        <i className="ri-user-line"></i> Users — {Object.keys(peers).length} online
      </div>
      <div className="players-sections">
        <div className="players-section">
          <div className="section-title">Online</div>
          {Object.values(peers).map(peer => (
            <div 
              key={peer.username} 
              className="player online"
              onClick={() => setSelectedUser(peer.username)}
            >
              <img 
                src={`https://images.websim.ai/avatar/${peer.username}`}
                alt={getDisplayName(peer.username)}
                className="player-avatar"
              />
              <span className="player-name">{getDisplayName(peer.username)}</span>
              <span className="status-indicator online"></span>
            </div>
          ))}
        </div>
        <div className="players-section">
          <div className="section-title">Offline</div>
          {offlinePeers.map(username => (
            <div 
              key={username} 
              className="player offline"
              onClick={() => setSelectedUser(username)}
            >
              <img 
                src={`https://images.websim.ai/avatar/${username}`}
                alt={getDisplayName(username)}
                className="player-avatar"
              />
              <span className="player-name">{getDisplayName(username)}</span>
              <span className="status-indicator offline"></span>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && (
        <UserProfile 
          username={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}