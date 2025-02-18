function UserProfile({ username, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      const settings = await room.collection('user_settings').filter({ username }).getList();
      const userSettings = settings[0]?.settings;

      setUserInfo({
        username,
        avatarUrl: `https://images.websim.ai/avatar/${username}`,
        displayName: userSettings?.displayName || username,
        description: userSettings?.description || "No description set",
        backgroundUrl: userSettings?.backgroundUrl
      });
      setLoading(false);
    };

    loadUserInfo();
  }, [username]);

  if (loading) return null;

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <button className="close-button" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="profile-content">
          {userInfo.backgroundUrl && (
            <div className="profile-background">
              <img src={userInfo.backgroundUrl} alt="Profile background" />
            </div>
          )}

          <div className="profile-info">
            <img 
              src={userInfo.avatarUrl} 
              alt={userInfo.username} 
              className="profile-avatar"
            />
            
            <div className="profile-details">
              <h2>{userInfo.displayName || userInfo.username}</h2>
              <div className="username">@{userInfo.username}</div>
              <p className="description">{userInfo.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}