// ============================================
// FILE: frontend/src/components/NewGroupModal.tsx
// ============================================
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate(name, description);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Tạo nhóm mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              Tên nhóm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Nhập tên nhóm..."
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-semibold">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
              placeholder="Mô tả về nhóm (tùy chọn)..."
            />
            <p className="text-gray-500 text-xs mt-1">
              {description.length}/200 ký tự
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
            >
              {loading ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
