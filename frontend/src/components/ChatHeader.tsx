import React from 'react';
import { Hash, Users, Settings, X, MessageCircle, Circle } from 'lucide-react';
import { ChatContext } from '../types';

interface ChatHeaderProps {
  currentChat: ChatContext;
  showSidebar: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  getUserStatus: (userId: string) => string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentChat,
  showSidebar,
  isMobile,
  onToggleSidebar,
  onOpenSettings,
  getUserStatus
}) => {
  const getOtherUserId = () => {
    if (currentChat.type === 'private' && currentChat.id) {
      const [id1, id2] = currentChat.id.split('_');
      return id1 !== currentChat.id ? id1 : id2;
    }
    return '';
  };

  return (
    <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {(isMobile || !showSidebar) && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
        
        {currentChat.type === 'global' && (
          <>
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chat toàn cầu</h2>
              <p className="text-gray-400 text-sm">Mọi người có thể xem</p>
            </div>
          </>
        )}
        
        {currentChat.type === 'private' && (
          <>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentChat.name?.[0].toUpperCase()}
              </div>
              {getUserStatus(getOtherUserId()) === 'online' && (
                <Circle className="w-3 h-3 text-green-400 fill-green-400 absolute bottom-0 right-0" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentChat.name}</h2>
              <p className="text-gray-400 text-sm">
                {getUserStatus(getOtherUserId()) === 'online' 
                  ? 'Đang hoạt động' 
                  : 'Không hoạt động'}
              </p>
            </div>
          </>
        )}
        
        {currentChat.type === 'group' && (
          <>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentChat.name}</h2>
              <p className="text-gray-400 text-sm">
                {currentChat.members?.length} thành viên
              </p>
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {currentChat.type === 'group' && (
          <button
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        
        {showSidebar && !isMobile && (
          <button
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;