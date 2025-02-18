function UserSettings({ show, onClose }) {
  const [settings, setSettings] = useState({
    displayName: '',
    description: '',
    theme: 'dark',
    backgroundUrl: '',
    volume: 1,
    challengeMode: false,
    accent: 'OwO' // Default accent
  });
  const [tempTheme, setTempTheme] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const accents = ["OwO", "HaxorSpeak", "Irish", "Texan", "Drunkard"];


  // Load settings on initial mount and when show changes
  useEffect(() => {
    const loadSettings = async () => {
      // First try to get user's settings from collection
      const userSettings = await room.collection('user_settings')
        .filter({ username: room.party.client.username })
        .getList();
      
      if (userSettings && userSettings[0]?.settings) {
        const loadedSettings = userSettings[0].settings;
        setSettings({
          displayName: loadedSettings.displayName || '',
          description: loadedSettings.description || '',
          theme: loadedSettings.theme || 'dark',
          backgroundUrl: loadedSettings.backgroundUrl || '',
          volume: loadedSettings.volume ?? 1,
          challengeMode: loadedSettings.challengeMode ?? false,
          accent: loadedSettings.accent || 'OwO'
        });
        setTempTheme(loadedSettings.theme || 'dark');
        document.body.setAttribute('data-theme', loadedSettings.theme || 'dark');
      } else {
        // Fall back to localStorage if no settings found in collection
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({
            displayName: parsedSettings.displayName || '',
            description: parsedSettings.description || '',
            theme: parsedSettings.theme || 'dark',
            backgroundUrl: parsedSettings.backgroundUrl || '',
            volume: parsedSettings.volume ?? 1,
            challengeMode: parsedSettings.challengeMode ?? false,
            accent: parsedSettings.accent || 'OwO'

          });
          setTempTheme(parsedSettings.theme || 'dark');
          document.body.setAttribute('data-theme', parsedSettings.theme || 'dark');
        }
      }
    };

    if (show) {
      loadSettings();
    }
  }, [show]);

  const handleThemeChange = (newTheme) => {
    setTempTheme(newTheme);
    // Only preview the theme, don't persist it yet
    document.body.setAttribute('data-theme', newTheme);
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      let finalBackgroundUrl = settings.backgroundUrl;

      // Handle image upload if new image selected
      if (selectedImage) {
        finalBackgroundUrl = await websim.upload(selectedImage);
      }
      
      const finalSettings = {
        ...settings,
        theme: tempTheme,
        backgroundUrl: finalBackgroundUrl,
        description: settings.description.trim() // Ensure description is trimmed
      };

      // First delete any existing settings for this user
      const existingSettings = await room.collection('user_settings')
        .filter({ username: room.party.client.username })
        .getList();
        
      if (existingSettings.length > 0) {
        await room.collection('user_settings').delete(existingSettings[0].id);
      }

      // Create new settings record
      await room.collection('user_settings').create({
        username: room.party.client.username,
        settings: finalSettings
      });
      
      // Update localStorage
      localStorage.setItem('userSettings', JSON.stringify(finalSettings));
      
      // Persist theme change
      document.body.setAttribute('data-theme', finalSettings.theme);
      
      // Dispatch storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'userSettings',
        newValue: JSON.stringify(finalSettings)
      }));
      
      setSettings(finalSettings);
      setUploading(false);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Revert theme to saved settings
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      document.body.setAttribute('data-theme', parsedSettings.theme || 'dark');
    } else {
      document.body.setAttribute('data-theme', 'dark');
    }
    onClose();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>User Settings</h2>
          <button className="close-button" onClick={handleCancel}>
            <i className="ri-close-line"></i>
          </button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Profile</h3>
            <div className="setting-item">
              <label>Display Name</label>
              <input
                type="text"
                value={settings.displayName}
                onChange={e => setSettings(prev => ({...prev, displayName: e.target.value}))}
                placeholder="Enter display name"
              />
            </div>
            
            <div className="setting-item">
              <label>Description</label>
              <textarea
                value={settings.description}
                onChange={e => setSettings(prev => ({...prev, description: e.target.value}))}
                placeholder="Tell us about yourself"
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <label>Theme</label>
              <select 
                value={tempTheme}
                onChange={e => handleThemeChange(e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="sleek-black">Sleek Black</option>
                <option value="vaporwave">Vaporwave</option>
                <option value="pride">Pride</option>
                <option value="gay">Gay Pride</option>
                <option value="trans-pride">Trans Pride</option>
                <option value="lesbian-pride">Lesbian Pride</option>
                <option value="bi-pride">Bi Pride</option>
                <option value="windows-xp">Windows XP</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Profile Background</label>
              <div className="background-preview">
                {(previewUrl || settings.backgroundUrl) && (
                  <img src={previewUrl || settings.backgroundUrl} alt="Background preview" />
                )}
                <button onClick={() => fileInputRef.current.click()}>
                  Choose Image
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Sound</h3>
            <div className="setting-item">
              <label>Typing Sound Volume</label>
              <div className="volume-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={e => setSettings(prev => ({...prev, volume: parseFloat(e.target.value)}))}
                />
                <span className="volume-value">{Math.round(settings.volume * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Game Settings</h3>
            <div className="setting-item setting-toggle">
              <label>
                Challenge Mode: <span>{settings.accent}</span>
                <input
                  type="checkbox"
                  checked={settings.challengeMode}
                  onChange={e => {
                      const newChallengeMode = e.target.checked;
                      const newAccent = newChallengeMode ? settings.accent : 'OwO';
                      setSettings(prev => ({
                          ...prev,
                          challengeMode: newChallengeMode,
                          accent: newAccent
                      }));
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Messages will be {settings.challengeMode ? `accented with ${settings.accent}` : 'normal'} when Challenge Mode is active
              </div>
            </div>
            {settings.challengeMode && (
                <div className="setting-item">
                  <label>Accent</label>
                  <select
                    value={settings.accent}
                    onChange={e => setSettings(prev => ({ ...prev, accent: e.target.value }))}
                  >
                    {accents.map(accent => (
                      <option key={accent} value={accent}>{accent}</option>
                    ))}
                  </select>
                </div>
              )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="secondary-button" onClick={handleCancel}>Cancel</button>
          <button 
            className="primary-button" 
            onClick={handleSave}
            disabled={uploading}
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}