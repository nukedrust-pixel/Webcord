function ChatHeader({ activeChannel }) {
  if (!activeChannel) return null; 

  return (
    <div className="chat-header">
      <i className="ri-hash-line"></i> {activeChannel.name}
    </div>
  );
}