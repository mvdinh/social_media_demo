import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Shield, Hash, CheckCircle, LogOut } from 'lucide-react';
import type { Message, User, BlockchainInfo } from '../types';
import socketService from '../services/socket';
import { messageAPI, blockchainAPI } from '../services/api';

interface ChatProps {
  user: User;
  onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [peers, setPeers] = useState(0);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Kết nối socket
    const socket = socketService.connect();

    // Load messages cũ
    loadMessages();

    // Load blockchain info
    loadBlockchainInfo();

    // Lắng nghe tin nhắn mới
    socketService.onNewMessage((message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Lắng nghe cập nhật peers
    socketService.onPeerUpdate((data: { peerCount: number }) => {
      setPeers(data.peerCount);
    });

    // Lắng nghe cập nhật blockchain
    socketService.onBlockchainUpdate((data: BlockchainInfo) => {
      setBlockchainInfo(data);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadBlockchainInfo = async () => {
    try {
      const response = await blockchainAPI.getInfo();
      setBlockchainInfo(response.data);
      setPeers(response.data.peers);
    } catch (error) {
      console.error('Error loading blockchain info:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      socketService.sendMessage(user.username, input);
      setInput('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-black/30 backdrop-blur-lg border-r border-white/10 p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">DChat</h1>
          </div>
          
          {/* User Info */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{user.username}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <p className="text-gray-400 text-xs mb-1">Wallet Address:</p>
              <p className="text-cyan-300 text-xs font-mono truncate">
                {user.walletAddress}
              </p>
            </div>
          </div>

          {/* Blockchain Info */}
          {blockchainInfo && (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-white font-semibold">Blockchain</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blocks:</span>
                    <span className="text-white font-semibold">
                      {blockchainInfo.chainLength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white font-semibold">
                      {blockchainInfo.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={`flex items-center gap-1 ${blockchainInfo.isValid ? 'text-green-400' : 'text-red-400'}`}>
                      <CheckCircle className="w-4 h-4" />
                      {blockchainInfo.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-white font-semibold">Network</h3>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Connected Peers:</span>
                  <span className="text-white font-semibold">{peers}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full mt-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
          <h2 className="text-xl font-bold text-white">Chat toàn cầu</h2>
          <p className="text-gray-400 text-sm">
            Tất cả tin nhắn được bảo mật bởi blockchain
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === user.username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md ${
                  message.sender === user.username
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    : 'bg-white/10 backdrop-blur-lg'
                } rounded-2xl p-4 shadow-lg`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-white font-semibold text-sm">
                    {message.sender}
                  </p>
                  {message.verified && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <p className="text-white mb-2">{message.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>{formatTime(message.timestamp)}</span>
                  <span className="font-mono">Block #{message.blockIndex}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-semibold"
            >
              <Send className="w-5 h-5" />
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;