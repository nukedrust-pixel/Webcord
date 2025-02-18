function MessageReactions({ messageId, reactions, onReaction, activeEmojiPicker, onToggleEmojiPicker }) {
  const emojiPickerRef = React.useRef(null);
  const [pickerPosition, setPickerPosition] = React.useState({ vertical: false, horizontal: false });

  React.useEffect(() => {
    if (activeEmojiPicker === messageId && emojiPickerRef.current) {
      const updatePosition = () => {
        const picker = emojiPickerRef.current;
        const rect = picker.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const newPosition = {
          vertical: false,
          horizontal: false
        };

        // Check vertical overflow
        if (rect.top < 0) {
          newPosition.vertical = true;
        } else if (rect.bottom > viewportHeight) {
          newPosition.vertical = true;
        }

        // Check horizontal overflow
        if (rect.right > viewportWidth) {
          newPosition.horizontal = true;
        }

        setPickerPosition(newPosition);
      };

      // Initial position check
      updatePosition();

      // Add resize listener
      window.addEventListener('resize', updatePosition);
      
      // Cleanup
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [activeEmojiPicker, messageId]);

  return (
    <div className="message-reactions">
      {Object.entries(reactions).map(([emoji, data]) => (
        <div 
          key={emoji}
          className={`reaction ${data.hasReacted ? 'active' : ''}`}
          onClick={(e) => onReaction(messageId, emoji, e)}
          title={data.users.join(', ')}
        >
          {emoji} {data.count}
        </div>
      ))}
      <span 
        className="add-reaction"
        onClick={(e) => onToggleEmojiPicker(messageId, e)}
      >
        <i className="ri-add-line"></i>
      </span>
      {activeEmojiPicker === messageId && (
        <div 
          ref={emojiPickerRef}
          className={`emoji-picker ${pickerPosition.vertical ? 'flip-vertical' : ''} ${pickerPosition.horizontal ? 'flip-horizontal' : ''}`}
        >
          {EMOJI_LIST.map(emoji => (
            <button 
              key={emoji}
              onClick={(e) => onReaction(messageId, emoji, e)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}