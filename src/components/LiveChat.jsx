// ============================================================
// src/components/LiveChat.jsx — V2 (Real Firestore Chat)
// Live chat with admin. Requires logged-in user.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { toast } from 'react-toastify'
import useSettings from '../hooks/useSettings'

function LiveChat() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const chatSettings = settings.liveChat || {}

  const [user, setUser] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatDoc, setChatDoc] = useState(null)

  const messagesEndRef = useRef(null)
  const messagesRef = useRef(null)

  // ============ AUTH ============
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (cu) => {
      setUser(cu)
    })
    return () => unsub()
  }, [])

  // ============ LOAD CHAT DOC ============
  useEffect(() => {
    if (!user?.uid) {
      setChatDoc(null)
      setMessages([])
      setUnreadCount(0)
      return
    }

    const chatRef = doc(db, 'chats', user.uid)
    const unsub = onSnapshot(
      chatRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setChatDoc(data)
          setUnreadCount(data.unreadForUser || 0)
        } else {
          setChatDoc(null)
          setUnreadCount(0)
        }
      },
      (err) => console.error('Chat doc error:', err)
    )
    return () => unsub()
  }, [user?.uid])

  // ============ LOAD MESSAGES ============
  useEffect(() => {
    if (!user?.uid) {
      setMessages([])
      return
    }

    const msgsRef = collection(db, 'chats', user.uid, 'messages')
    const msgsQuery = query(msgsRef, orderBy('createdAt', 'asc'))

    const unsub = onSnapshot(
      msgsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setMessages(list)
      },
      (err) => console.error('Messages error:', err)
    )
    return () => unsub()
  }, [user?.uid])

  // ============ AUTO SCROLL ============
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // ============ MARK AS READ (when open) ============
  useEffect(() => {
    if (!isOpen || !user?.uid) return
    if (unreadCount === 0) return

    const markRead = async () => {
      try {
        await updateDoc(doc(db, 'chats', user.uid), {
          unreadForUser: 0,
        })
      } catch (err) {
        console.error('Mark read error:', err)
      }
    }
    // Small delay so user sees the badge change
    const t = setTimeout(markRead, 800)
    return () => clearTimeout(t)
  }, [isOpen, user?.uid, unreadCount])

  // ============ CREATE CHAT DOC IF NOT EXISTS ============
  const ensureChatDoc = async () => {
    if (!user?.uid) return
    try {
      const chatRef = doc(db, 'chats', user.uid)
      const snap = await getDoc(chatRef)
      if (!snap.exists()) {
        await setDoc(chatRef, {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          userEmail: user.email || '',
          userPhoto: user.photoURL || '',
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          lastMessageBy: '',
          unreadForAdmin: 0,
          unreadForUser: 0,
          status: 'open',
          createdAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('Create chat error:', err)
    }
  }

  // ============ HANDLE SEND ============
  const handleSend = async () => {
    if (!input.trim() || !user?.uid || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    try {
      // Ensure chat doc exists
      await ensureChatDoc()

      // Add message
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        text,
        senderId: user.uid,
        senderName:
          user.displayName || user.email?.split('@')[0] || 'User',
        senderRole: 'user',
        createdAt: serverTimestamp(),
        read: false,
      })

      // Update chat meta — increment unreadForAdmin
      const chatRef = doc(db, 'chats', user.uid)
      const snap = await getDoc(chatRef)
      const existingUnread = snap.data()?.unreadForAdmin || 0

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: 'user',
        unreadForAdmin: existingUnread + 1,
        status: 'open',
      })
    } catch (err) {
      console.error('Send message error:', err)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // ============ OPEN CHAT ============
  const handleOpen = async () => {
    if (!user) {
      toast.info('Please login to chat with support')
      navigate('/login')
      return
    }
    setIsOpen(true)
    await ensureChatDoc()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Filter out empty welcome messages, but show settings welcome as first bubble if no messages
  const showWelcomeBubble =
    messages.length === 0 && chatSettings.welcomeMessage

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`live-chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        aria-label="Live chat"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && unreadCount > 0 && (
          <span className="live-chat-unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Box */}
      {isOpen && user && (
        <div className="live-chat-box">
          {/* Header */}
          <div className="live-chat-header">
            <div className="live-chat-avatar">
              {chatSettings.avatarEmoji || '👨‍💼'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{chatSettings.teamName || 'Support Team'}</strong>
              <small>{chatSettings.statusText || 'Online Now'}</small>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="live-chat-messages" ref={messagesRef}>
            {showWelcomeBubble && (
              <div className="chat-message admin">
                {chatSettings.welcomeMessage}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${
                  msg.senderRole === 'admin' ? 'admin' : 'user'
                }`}
              >
                <div className="chat-message-text">{msg.text}</div>
                <div className="chat-message-time">
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="live-chat-input">
            <input
              type="text"
              placeholder={
                chatSettings.inputPlaceholder || 'Type your message...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send"
            >
              {sending ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default LiveChat