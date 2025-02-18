function ChatInput({ 
  newMessage, 
  onMessageChange, 
  onSubmit,
  onFileSelect,
  uploadingImage,
  selectedImagePreview,
  onRemoveImage,
  fileInputRef,
  showEmojiPicker,
  onToggleEmojiPicker,
  onEmojiSelect
}) {
  const typingSound = new Audio('194799__jim-ph__keyboard5.wav');
  const enterSound = new Audio('mech-keyboard-02-102918 (1).mp3');

  // Get volume from settings
  const getVolume = () => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.volume ?? 1;
    }
    return 1;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const sound = enterSound.cloneNode(true);
      sound.volume = getVolume();
      sound.play().catch(e => console.log('Sound play failed:', e));
    } else {
      const sound = typingSound.cloneNode(true);
      sound.volume = getVolume();
      sound.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  const handleSubmit = (e) => {
    const sound = enterSound.cloneNode(true);
    sound.volume = getVolume();
    sound.play().catch(e => console.log('Sound play failed:', e));
    onSubmit(e);
  };

  return (
    <div className="chat-input-container">
      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Send a message"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {showEmojiPicker && (
            <div className="emoji-picker input-emoji-picker">
              <EmojiPicker onSelect={onEmojiSelect} />
            </div>
          )}
        </div>
        <button 
          type="button" 
          className="upload-button emoji-button"
          onClick={onToggleEmojiPicker}
        >
          <i className="ri-emotion-line"></i>
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button 
          type="button" 
          className="upload-button"
          onClick={() => fileInputRef.current.click()}
        >
          <i className="ri-image-line"></i>
        </button>
        <button type="submit" className="upload-button">
          {uploadingImage ? (
            <div className="loading-indicator"></div>
          ) : (
            <i className="ri-send-plane-fill"></i>
          )}
        </button>
      </form>
      {selectedImagePreview && (
        <div className="image-upload-preview">
          <img src={selectedImagePreview} alt="Upload preview" />
          <span className="remove-image" onClick={onRemoveImage}>
            <i className="ri-close-line"></i>
          </span>
        </div>
      )}
    </div>
  );
}