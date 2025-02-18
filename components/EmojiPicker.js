const EMOJI_LIST = ['👍', '❤️', '😄', '😮', '😢', '😡', '🎉', '🙏', '👀', '💯', '🔥', '💀'];

function EmojiPicker({ onSelect }) {
  return (
    <>
      {EMOJI_LIST.map(emoji => (
        <button 
          key={emoji}
          onClick={(e) => onSelect(emoji, e)}
        >
          {emoji}
        </button>
      ))}
    </>
  );
}