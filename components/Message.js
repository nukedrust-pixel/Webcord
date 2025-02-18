function Message({ message, reactions, onReaction, activeEmojiPicker, onToggleEmojiPicker, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(message.content);
  const [timeDisplay, setTimeDisplay] = React.useState('');
  const editInputRef = React.createRef(null);
  const [userSettings, setUserSettings] = React.useState({});

  React.useEffect(() => {
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

    loadSettings();
    return () => settingsUnsubscribe();
  }, []);

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  React.useEffect(() => {
    const updateTime = () => {
      const messageDate = new Date(message.created_at);
      setTimeDisplay(formatRelativeTime(messageDate));
    };

    // Initial update
    updateTime();

    // Update time every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [message.created_at]);

  React.useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      // Position cursor at end of text
      editInputRef.current?.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  const handleSubmitEdit = () => {
    if (editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const getDisplayName = (username) => {
    return userSettings[username]?.displayName || username;
  };

  const isOwnMessage = message.username === room.party.client.username;

  return (
    <div key={message.id} className={`message ${message.isGrouped ? 'grouped' : ''}`}>
      {!message.isGrouped && (
        <img 
          className="message-avatar" 
          src={`https://images.websim.ai/avatar/${message.username}`}
          alt={getDisplayName(message.username)} 
        />
      )}
      {message.isGrouped && <div className="message-avatar-placeholder"></div>}
      <div className="message-content">
        {!message.isGrouped && (
          <div className="message-header">
            <span className="message-author">{getDisplayName(message.username)}</span>
            <span className="message-time" title={new Date(message.created_at).toLocaleString()}>
              {timeDisplay}
            </span>
            {message.edited_at && (
              <span className="message-edited" title={`Edited ${formatRelativeTime(new Date(message.edited_at))}`}>
                (edited)
              </span>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="message-edit">
            <input
              ref={editInputRef}
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="message-edit-input"
            />
            <div className="message-edit-actions">
              <button onClick={handleSubmitEdit} className="edit-button">
                Save
              </button>
              <button onClick={() => {
                setIsEditing(false);
                setEditedContent(message.content);
              }} className="edit-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.content && <div className="message-text">
              {message.content}
              {isOwnMessage && (
                <div className="message-actions">
                  <button onClick={() => setIsEditing(true)} className="action-button">
                    <i className="ri-edit-line"></i>
                  </button>
                  <button onClick={() => onDelete(message.id)} className="action-button">
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              )}
            </div>}
          </>
        )}
        
        {message.imageUrl && (
          <img 
            className="message-image" 
            src={message.imageUrl} 
            alt="Uploaded content"
            onClick={() => window.open(message.imageUrl, '_blank')}
          />
        )}
        <MessageReactions 
          messageId={message.id}
          reactions={reactions}
          onReaction={onReaction}
          activeEmojiPicker={activeEmojiPicker}
          onToggleEmojiPicker={onToggleEmojiPicker}
        />
      </div>
    </div>
  );
}