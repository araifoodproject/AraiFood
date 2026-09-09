import { useState } from 'react'

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! 👋 How can we help you today?', sender: 'admin' }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    const newMessage = { id: Date.now(), text: input.trim(), sender: 'user' }
    setMessages([...messages, newMessage])
    setInput('')

    // Simulate admin response
    setTimeout(() => {
      const adminReply = { id: Date.now() + 1, text: 'Thank you for your message! Our team will get back to you shortly. 😊', sender: 'admin' }
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
            <div className="live-chat-avatar">👨‍💼</div>
            <div>
              <strong>Support Team</strong>
              <small>Online Now</small>
            </div>
          </div>

          <div className="live-chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="live-chat-input">
            <input
              type="text"
              placeholder="Type your message..."
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