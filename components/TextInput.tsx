'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface TextInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function TextInput({ onSend, disabled = false }: TextInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-effect rounded-lg p-4 flex items-center space-x-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        placeholder="Type your message..."
        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className={`p-2 rounded-full transition-colors ${
          disabled || !input.trim()
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'gradient-ai text-white hover:opacity-90'
        }`}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
