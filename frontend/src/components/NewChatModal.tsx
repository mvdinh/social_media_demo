// ============================================
// FILE: frontend/src/components/NewChatModal.tsx
// ============================================
import React, { useState } from 'react';
import { X, Search, Circle } from 'lucide-react';
import { userAPI } from '../services/api';
import { UserStatus } from '../types';

interface NewChatModalProps {
  currentUserId: string;
  onClose: () => void;
  onSelectUser: (userId: string, username: string) => void;
  onlineUsers: UserStatus[];
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUserId,
  onClose,
  onSelectUser,
  onlineUsers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await userAPI.search(query);
      setSearchResults(res.data.filter(u => u.id !== currentUserId));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStatus = (userId: string) => {
    return onlineUsers.find(u => u.userId === userId)?.status || 'offline';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Tin nhắn mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading && (
            <div className="text-center text-gray-400 py-4">
              Đang tìm kiếm...
            </div>
          )}
          
          {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              Không tìm thấy người dùng
            </div>
          )}
          
          {searchResults.map((foundUser) => (
            <div
              key={foundUser.id}
              onClick={() => onSelectUser(foundUser.id, foundUser.username)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {foundUser.username[0].toUpperCase()}
                </div>
                {getUserStatus(foundUser.id) === 'online' && (
                  <Circle className="w-3 h-3 text-green-400 fill-green-400 absolute bottom-0 right-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{foundUser.username}</p>
                <p className="text-gray-400 text-sm truncate">{foundUser.email}</p>
              </div>
              {getUserStatus(foundUser.id) === 'online' && (
                <span className="text-green-400 text-xs font-semibold">Online</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;