function ChannelsList({ channels, activeChannel, onSelectChannel, unreadChannels }) {
  return (
    <div className="channels-list">
      <div className="channels-header">
        <i className="ri-list-check"></i> Channels
      </div>
      <div className="channels">
        {channels.map(channel => (
          <div 
            key={channel.id} 
            className={`channel ${activeChannel.id === channel.id ? 'active' : ''}`}
            onClick={() => onSelectChannel(channel)}
          >
            <i className="ri-hash-line"></i>
            {channel.name}
            {unreadChannels.includes(channel.id) && (
              <div className="unread-indicator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}