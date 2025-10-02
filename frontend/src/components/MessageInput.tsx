// ============================================
// FILE: frontend/src/components/MessageInput.tsx
// ============================================
import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit
}) => {
  return (
    <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-semibold"
        >
          <Send className="w-5 h-5" />
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;