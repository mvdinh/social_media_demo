import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';
import { 
  messageAPI, privateMessageAPI, groupAPI, 
  groupMessageAPI, blockchainAPI 
} from '../services/api';
import { 
  User, Message, PrivateMessage, GroupMessage, 
  Group, ChatContext, UserStatus, BlockchainInfo 
} from '../types';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import GroupSettingsModal from './GroupSettingsModal';

interface ChatProps {
  user: User;
  onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ user, onLogout }) => {
  const [currentChat, setCurrentChat] = useState<ChatContext>({ type: 'global' });
  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Map<string, PrivateMessage[]>>(new Map());
  const [groupMessages, setGroupMessages] = useState<Map<string, GroupMessage[]>>(new Map());
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [groups, setGroups] = useState<Group[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [peers, setPeers] = useState(0);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    socketService.connect(user.id, user.username);
    loadInitialData();
    setupSocketListeners();
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      socketService.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [messagesRes, groupsRes, conversationsRes, blockchainRes] = await Promise.all([
        messageAPI.getMessages(),
        groupAPI.getMyGroups(),
        privateMessageAPI.getConversations(),
        blockchainAPI.getInfo()
      ]);
      
      setGlobalMessages(messagesRes.data);
      setGroups(groupsRes.data);
      setConversations(conversationsRes.data);
      setBlockchainInfo(blockchainRes.data);
      setPeers(blockchainRes.data.peers);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewGlobalMessage((msg: Message) => {
      setGlobalMessages(prev => [...prev, msg]);
    });

    socketService.onNewPrivateMessage((msg: PrivateMessage) => {
      setPrivateMessages(prev => {
        const messages = prev.get(msg.conversationId) || [];
        return new Map(prev).set(msg.conversationId, [...messages, msg]);
      });
      loadConversations();
    });

    socketService.onNewGroupMessage((msg: GroupMessage) => {
      setGroupMessages(prev => {
        const messages = prev.get(msg.groupId) || [];
        return new Map(prev).set(msg.groupId, [...messages, msg]);
      });
    });

    socketService.onUserStatusUpdate((status: UserStatus) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== status.userId);
        return status.status === 'online' ? [...filtered, status] : filtered;
      });
    });

    socketService.onOnlineUsers((users: UserStatus[]) => {
      setOnlineUsers(users);
    });

    socketService.onUserTyping((data) => {
      setTypingUsers(prev => new Set(prev).add(data.username));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }, 3000);
    });

    socketService.onBlockchainUpdate((info: BlockchainInfo) => {
      setBlockchainInfo(info);
    });

    socketService.onPeerUpdate((data) => {
      setPeers(data.peerCount);
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });
  };

  const loadConversations = async () => {
    try {
      const res = await privateMessageAPI.getConversations();
      setConversations(res.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (currentChat.type === 'global') {
      socketService.sendGlobalMessage(input);
    } else if (currentChat.type === 'private' && currentChat.id) {
      const [, receiverId] = currentChat.id.split('_').filter(id => id !== user.id);
      socketService.sendPrivateMessage(receiverId, currentChat.name!, input);
    } else if (currentChat.type === 'group' && currentChat.id) {
      socketService.sendGroupMessage(currentChat.id, input);
    }

    setInput('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    
    if (currentChat.type === 'private') {
      socketService.startTyping(currentChat.id);
    } else if (currentChat.type === 'group') {
      socketService.startTyping(undefined, currentChat.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (currentChat.type === 'private') {
        socketService.stopTyping(currentChat.id);
      } else if (currentChat.type === 'group') {
        socketService.stopTyping(undefined, currentChat.id);
      }
    }, 1000);
  };

  const startPrivateChat = async (userId: string, username: string) => {
    const conversationId = [user.id, userId].sort().join('_');
    
    try {
      const res = await privateMessageAPI.getMessages(conversationId);
      setPrivateMessages(prev => new Map(prev).set(conversationId, res.data));
    } catch (error) {
      setPrivateMessages(prev => new Map(prev).set(conversationId, []));
    }

    setCurrentChat({
      type: 'private',
      id: conversationId,
      name: username
    });
    
    if (isMobile) setShowSidebar(false);
  };

  const openGroup = async (group: Group) => {
    try {
      const res = await groupMessageAPI.getMessages(group._id);
      setGroupMessages(prev => new Map(prev).set(group._id, res.data));
    } catch (error) {
      setGroupMessages(prev => new Map(prev).set(group._id, []));
    }

    socketService.joinGroup(group._id);
    setCurrentChat({
      type: 'group',
      id: group._id,
      name: group.name,
      members: group.members
    });
    
    if (isMobile) setShowSidebar(false);
  };

  const handleSelectGlobalChat = () => {
    setCurrentChat({ type: 'global' });
    if (isMobile) setShowSidebar(false);
  };

  const createGroup = async (name: string, description: string) => {
    try {
      const res = await groupAPI.create(name, description, false);
      setGroups(prev => [...prev, res.data]);
      openGroup(res.data);
      setShowNewGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Không thể tạo nhóm');
    }
  };

  const getCurrentMessages = () => {
    if (currentChat.type === 'global') return globalMessages;
    if (currentChat.type === 'private' && currentChat.id) {
      return privateMessages.get(currentChat.id) || [];
    }
    if (currentChat.type === 'group' && currentChat.id) {
      return groupMessages.get(currentChat.id) || [];
    }
    return [];
  };

  const getUserStatus = (userId: string) => {
    return onlineUsers.find(u => u.userId === userId)?.status || 'offline';
  };

  const getOtherUserId = (conversationId: string) => {
    const [id1, id2] = conversationId.split('_');
    return id1 === user.id ? id2 : id1;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex overflow-hidden">
      {showSidebar && (
        <Sidebar
          user={user}
          currentChat={currentChat}
          globalMessages={globalMessages}
          conversations={conversations}
          groups={groups}
          onlineUsers={onlineUsers}
          blockchainInfo={blockchainInfo}
          peers={peers}
          onSelectGlobalChat={handleSelectGlobalChat}
          onSelectConversation={startPrivateChat}
          onSelectGroup={openGroup}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowNewGroup(true)}
          onLogout={onLogout}
          getUserStatus={getUserStatus}
          getOtherUserId={getOtherUserId}
        />
      )}

      <div className="flex-1 flex flex-col">
        <ChatHeader
          currentChat={currentChat}
          showSidebar={showSidebar}
          isMobile={isMobile}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onOpenSettings={() => setShowGroupSettings(true)}
          getUserStatus={getUserStatus}
        />

        <MessageList
          messages={getCurrentMessages()}
          currentUser={user}
          currentChat={currentChat}
          typingUsers={typingUsers}
        />

        <MessageInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSendMessage}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          onClick={onSelectGlobalChat}
          className={`p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors ${
            currentChat.type === 'global' ? 'bg-white/10' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Chat toàn cầu</p>
              <p className="text-gray-400 text-sm">{globalMessages.length} tin nhắn</p>
            </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between bg-black/20">
          <p className="text-gray-400 text-sm font-semibold">Tin nhắn riêng tư</p>
          <button
            onClick={onNewChat}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Chưa có cuộc trò chuyện
          </div>
        ) : (
          conversations.map((conv) => {
            const otherUserId = getOtherUserId(conv._id);
            const otherUsername = conv.lastMessage.senderId === user.id 
              ? conv.lastMessage.receiverUsername 
              : conv.lastMessage.senderUsername;
            
            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(otherUserId, otherUsername)}
                className={`p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors ${
                  currentChat.id === conv._id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {otherUsername[0].toUpperCase()}
                    </div>
                    {getUserStatus(otherUserId) === 'online' && (
                      <Circle className="w-3 h-3 text-green-400 fill-green-400 absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{otherUsername}</p>
                    <p className="text-gray-400 text-sm truncate">
                      {conv.lastMessage.senderId === user.id && 'Bạn: '}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-cyan-500 rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 text-white text-xs font-bold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="p-3 flex items-center justify-between bg-black/20 mt-4">
          <p className="text-gray-400 text-sm font-semibold">Nhóm chat</p>
          <button
            onClick={onNewGroup}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {groups.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Chưa có nhóm nào
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group._id}
              onClick={() => onSelectGroup(group)}
              className={`p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors ${
                currentChat.id === group._id ? 'bg-white/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{group.name}</p>
                  <p className="text-gray-400 text-sm">{group.members.length} thành viên</p>
                </div>
                {group.members.find(m => m.userId === user.id)?.role === 'admin' && (
                  <Crown className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {blockchainInfo && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <p className="text-white text-sm font-semibold">Blockchain</p>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Blocks:</span>
              <span className="text-white font-semibold">{blockchainInfo.chainLength}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Peers:</span>
              <span className="text-white font-semibold">{peers}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {blockchainInfo.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
