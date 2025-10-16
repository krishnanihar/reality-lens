'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface MessageDisplayProps {
  messages: Message[];
}

export function MessageDisplay({ messages }: MessageDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Start a conversation by speaking or showing something to the camera</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-full">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-2xl p-4 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'gradient-ai text-white'
            } shadow-lg`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            <div className="flex items-center justify-between mt-2 space-x-2">
              <span className="text-xs opacity-70">
                {formatTimestamp(message.timestamp)}
              </span>
              {message.type !== 'text' && (
                <span className="text-xs opacity-70 capitalize">
                  {message.type}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
