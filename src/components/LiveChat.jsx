// ============================================================
// src/components/LiveChat.jsx
// FULLY REAL-TIME — all chat content from settings.liveChat
// Structure unchanged (fake reply; real backend later)
// ============================================================

import { useState, useEffect } from 'react'
import useSettings from '../hooks/useSettings'

function LiveChat() {
  const { settings } = useSettings()
  const chat = settings.liveChat || {}

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // ------------------------------------------------------------
  // Sync welcome message when settings load / change
  // ------------------------------------------------------------
  useEffect(() => {
    if (chat.welcomeMessage && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: chat.welcomeMessage,
          sender: 'admin',
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.welcomeMessage])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
    }
    setMessages((prev) => [...prev, newMessage])
    setInput('')

    // Simulate admin response with configured auto-reply
    setTimeout(() => {
      const adminReply = {
        id: Date.now() + 1,
        text: chat.autoReply || 'Thank you for your message!',
        sender: 'admin',
      }
      setMessages((prev) => [...prev, adminReply])
    }, 1000)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`live-chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div className="live-chat-box">
          <div className="live-chat-header">
            <div className="live-chat-avatar">
              {chat.avatarEmoji || '👨‍💼'}
            </div>
            <div>
              <strong>{chat.teamName}</strong>
              <small>{chat.statusText}</small>
            </div>
          </div>

          <div className="live-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="live-chat-input">
            <input
              type="text"
              placeholder={chat.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}

export default LiveChat