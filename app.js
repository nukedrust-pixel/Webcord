const room = new WebsimSocket();
const { useState, useEffect, useRef } = React;

const DEFAULT_CHANNELS = [
  { id: 'general', name: 'general' },
  { id: 'random', name: 'random' },
  { id: 'introductions', name: 'introductions' }
];

const ACCENTS = ["OwO", "HaxorSpeak", "Irish", "Texan", "Drunkard"];

function App() {
  const [channels] = useState(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [showSettings, setShowSettings] = useState(false);

  const messages = React.useSyncExternalStore(
    room.collection('message').filter({ channel_id: activeChannel.id }).subscribe,
    () => room.collection('message').filter({ channel_id: activeChannel.id }).getList() || []
  );

  const reactions = React.useSyncExternalStore(
    room.collection('reaction').subscribe,
    () => room.collection('reaction').getList() || []
  );

  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const [theme, setTheme] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.theme || 'dark';
    }
    return 'dark';
  });

  const [challengeMode, setChallengeMode] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.challengeMode || false;
    }
    return false;
  });
  const [userSettings, setUserSettings] = React.useState({});

  const [unreadChannels, setUnreadChannels] = useState([]);
  const [lastSeenMessages, setLastSeenMessages] = useState(() => {
    const saved = localStorage.getItem('lastSeenMessages');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastVisitedTimes, setLastVisitedTimes] = useState(() => {
    const saved = localStorage.getItem('lastVisitedTimes');
    return saved ? JSON.parse(saved) : {};
  });

  const allMessages = React.useSyncExternalStore(
    room.collection('message').subscribe,
    () => room.collection('message').getList() || []
  );

  const isAtBottom = () => {
    const container = chatMessagesRef.current;
    if (!container) return true;
    
    const threshold = 100; 
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current && (shouldAutoScroll || force)) {
      messagesEndRef.current.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  };

  const handleScroll = () => {
    setShouldAutoScroll(isAtBottom());
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const { theme } = JSON.parse(savedSettings);
      setTheme(theme || 'dark');
      document.body.setAttribute('data-theme', theme || 'dark');
    }

    const handleStorageChange = (e) => {
      if (e.key === 'userSettings') {
        const newSettings = JSON.parse(e.newValue);
        setTheme(newSettings.theme);
        document.body.setAttribute('data-theme', newSettings.theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

    
  useEffect(() => {
      // Subscribe to user settings updates
    const settingsUnsubscribe = room.collection('user_settings').subscribe((settings) => {
      const newUserSettings = {};
      settings.forEach(setting => {
        newUserSettings[setting.username] = setting.settings;
        localStorage.setItem(`userSettings_${setting.username}`, JSON.stringify(setting.settings));
      });
      setUserSettings(newUserSettings);

      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setChallengeMode(settings.challengeMode || false);
      }

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
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setChallengeMode(settings.challengeMode || false);
      }

    };

      const handleStorageChange = (e) => {
      if (e.key === 'userSettings') {
        const newSettings = JSON.parse(e.newValue);
        setChallengeMode(newSettings.challengeMode || false);
      }
    };
      loadSettings();
      window.addEventListener('storage', handleStorageChange);
    return () => {
      settingsUnsubscribe();
      window.removeEventListener('storage', handleStorageChange);

    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPickers = document.querySelectorAll('.emoji-picker');
      let clickedInside = false;
      emojiPickers.forEach(picker => {
        if (picker.contains(event.target)) clickedInside = true;
      });
      const emojiButton = document.querySelector('.emoji-button');
      if (emojiButton && emojiButton.contains(event.target)) clickedInside = true;
      
      if (!clickedInside) {
        setActiveEmojiPicker(null);
        setShowInputEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    scrollToBottom(true); 
  }, []); 

  useEffect(() => {
    scrollToBottom(); 
  }, [messages]); 

  useEffect(() => {
    const container = chatMessagesRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const channelMessages = allMessages.filter(m => m.channel_id === activeChannel.id);
    if (channelMessages.length > 0) {
      const lastMessage = channelMessages[channelMessages.length - 1];
      setLastSeenMessages(prev => {
        const updated = {
          ...prev,
          [activeChannel.id]: lastMessage.created_at
        };
        localStorage.setItem('lastSeenMessages', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeChannel.id, messages]);

  useEffect(() => {
    setLastVisitedTimes(prev => {
      const updated = {
        ...prev,
        [activeChannel.id]: new Date().toISOString()
      };
      localStorage.setItem('lastVisitedTimes', JSON.stringify(updated));
      return updated;
    });
  }, [activeChannel.id]);

  useEffect(() => {
    const unread = new Set();
    
    allMessages.forEach(message => {
      if (message.channel_id === activeChannel.id) return;
      
      const lastSeen = lastSeenMessages[message.channel_id] || '1970-01-01T00:00:00.000Z';
      const lastVisited = lastVisitedTimes[message.channel_id] || '1970-01-01T00:00:00.000Z';
      
      if (new Date(message.created_at) > new Date(lastSeen) && 
          new Date(message.created_at) > new Date(lastVisited)) {
        unread.add(message.channel_id);
      }
    });

    setUnreadChannels(Array.from(unread));
  }, [allMessages, activeChannel.id, lastSeenMessages, lastVisitedTimes]);

  const processMessagesForGrouping = (messages) => {
    const sorted = [...messages].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    return sorted.map((message, index) => {
      const prevMessage = sorted[index - 1];
      const shouldGroup = prevMessage && 
        prevMessage.username === message.username &&
        (new Date(message.created_at) - new Date(prevMessage.created_at)) < 60000; 

      return {
        ...message,
        isGrouped: shouldGroup
      };
    });
  };

  const transformMessage = async (content, username) => {
    if(!userSettings[username]?.challengeMode){
        return content;
    }

    try {
        const accent = userSettings[username]?.accent || "OwO";
        const response = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
              prompt: `You are a text transformer that applies a specific accent or style to text. 
                      Apply the '${accent}' accent to the provided text.
          
          <typescript-interface>
          interface Response {
            transformedText: string;
          }
          </typescript-interface>
          <example>

          {
            "transformedText": "Hewwo, how awe you doing today?"
          }
          </example>
          `,

              data: content
            }),
          });
          const data = await response.json();
          return data.transformedText;

    } catch(e) {
        console.error("Error transforming with AI", e);
        return content;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await websim.upload(selectedImage);
      }

      const transformedContent = await transformMessage(newMessage.trim(), room.party.client.username);

      await room.collection('message').create({
        content: transformedContent, 
        imageUrl: imageUrl,
        channel_id: activeChannel.id  
      });

      setNewMessage('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      setUploadingImage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadingImage(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.username === room.party.client.username) {
        const transformedContent = await transformMessage(newContent, room.party.client.username);
        
        await room.collection('message').update(messageId, {
          content: transformedContent,
          edited_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddReaction = async (messageId, emoji, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const existingReaction = reactions.find(
        r => r.message_id === messageId && 
             r.emoji === emoji && 
             r.username === room.party.client.username
      );

      if (existingReaction) {
        await room.collection('reaction').delete(existingReaction.id);
      } else {
        await room.collection('reaction').create({
          message_id: messageId,
          emoji: emoji
        });
      }
    } catch (error) {
      console.error('Error managing reaction:', error);
    }
    setActiveEmojiPicker(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.username === room.party.client.username) {
        await room.collection('message').delete(messageId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getMessageReactions = (messageId) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    return messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.username);
      if (reaction.username === room.party.client.username) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {});
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  const sortedMessages = processMessagesForGrouping(messages);

  return (
    <div className="app" data-theme={theme}>
      <div className="sidebar">
        <ChannelsList 
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={setActiveChannel}
          unreadChannels={unreadChannels}
        />
      </div>
      <div className="main-content">
        <div className="chat-header">
          <div className="channel-info">
            <i className="ri-hash-line"></i> {activeChannel.name}
          </div>
          <button 
            className="settings-button"
            onClick={() => setShowSettings(true)}
          >
            <i className="ri-settings-3-line"></i>
          </button>
        </div>
        <div className="chat-messages" ref={chatMessagesRef}>
          {sortedMessages.map(message => (
            <Message
              key={message.id}
              message={message}
              reactions={getMessageReactions(message.id)}
              onReaction={handleAddReaction}
              activeEmojiPicker={activeEmojiPicker}
              onToggleEmojiPicker={(messageId, e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveEmojiPicker(activeEmojiPicker === messageId ? null : messageId);
              }}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSubmit={handleSendMessage}
          onFileSelect={handleFileSelect}
          uploadingImage={uploadingImage}
          selectedImagePreview={selectedImagePreview}
          onRemoveImage={() => {
            setSelectedImage(null);
            setSelectedImagePreview(null);
            fileInputRef.current.value = '';
          }}
          fileInputRef={fileInputRef}
          showEmojiPicker={showInputEmojiPicker}
          onToggleEmojiPicker={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
          onEmojiSelect={handleEmojiSelect}
        />
      </div>
      <PlayersList />

      <UserSettings 
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);