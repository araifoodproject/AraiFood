// ============================================================
// src/pages/admin/AdminSupportPage.jsx — V2 (Real Live Chat)
// Admin chat inbox — reply to customer messages
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import { db } from '../../firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Send,
  Trash2,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react'

function AdminSupportPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat'

  const messagesEndRef = useRef(null)

  // ============ LOAD CHATS ============
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'chats'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          chatId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aT = a.lastMessageAt?.toDate?.()?.getTime() || 0
          const bT = b.lastMessageAt?.toDate?.()?.getTime() || 0
          return bT - aT
        })
        setChats(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // ============ LOAD MESSAGES OF SELECTED CHAT ============
  useEffect(() => {
    if (!selectedChat?.chatId) {
      setMessages([])
      return
    }
    const msgsRef = collection(db, 'chats', selectedChat.chatId, 'messages')
    const msgsQuery = query(msgsRef, orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(msgsQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setMessages(list)
    })
    return () => unsub()
  }, [selectedChat?.chatId])

  // ============ AUTO SCROLL ============
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ============ MARK CHAT AS READ FOR ADMIN ============
  useEffect(() => {
    if (!selectedChat?.chatId) return
    const markRead = async () => {
      try {
        await updateDoc(doc(db, 'chats', selectedChat.chatId), {
          unreadForAdmin: 0,
        })
      } catch (err) {
        console.error('Mark read error:', err)
      }
    }
    // Small delay
    const t = setTimeout(markRead, 500)
    return () => clearTimeout(t)
  }, [selectedChat?.chatId, selectedChat?.unreadForAdmin])

  // ============ FILTERED CHATS ============
  const filteredChats = useMemo(() => {
    let result = [...chats]

    if (statusFilter === 'unread') {
      result = result.filter((c) => (c.unreadForAdmin || 0) > 0)
    } else if (statusFilter === 'open') {
      result = result.filter((c) => c.status !== 'resolved')
    } else if (statusFilter === 'resolved') {
      result = result.filter((c) => c.status === 'resolved')
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        `${c.userName || ''} ${c.userEmail || ''} ${c.lastMessage || ''}`
          .toLowerCase()
          .includes(q)
      )
    }

    return result
  }, [chats, statusFilter, search])

  // ============ STATS ============
  const stats = useMemo(() => {
    return {
      total: chats.length,
      unread: chats.filter((c) => (c.unreadForAdmin || 0) > 0).length,
      open: chats.filter((c) => c.status !== 'resolved').length,
      resolved: chats.filter((c) => c.status === 'resolved').length,
    }
  }, [chats])

  // ============ SEND REPLY ============
  const sendReply = async () => {
    if (!replyText.trim() || !selectedChat?.chatId) return

    setSendingReply(true)
    const text = replyText.trim()
    setReplyText('')

    try {
      // Add admin message
      await addDoc(
        collection(db, 'chats', selectedChat.chatId, 'messages'),
        {
          text,
          senderId: 'admin',
          senderName: 'Support Team',
          senderRole: 'admin',
          createdAt: serverTimestamp(),
          read: false,
        }
      )

      // Update chat meta
      const chatRef = doc(db, 'chats', selectedChat.chatId)
      const snap = await getDoc(chatRef)
      const existingUnread = snap.data()?.unreadForUser || 0

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: 'admin',
        unreadForUser: existingUnread + 1,
        status: 'open',
      })

      toast.success('Reply sent!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  // ============ MARK RESOLVED ============
  const toggleResolved = async (chatId, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved'
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        status: newStatus,
      })
      toast.success(
        newStatus === 'resolved' ? 'Marked as resolved' : 'Reopened'
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  // ============ DELETE CHAT ============
  const deleteChat = async (chatId) => {
    if (!window.confirm('Delete this entire conversation?')) return
    try {
      await deleteDoc(doc(db, 'chats', chatId))
      toast.success('Conversation deleted')
      if (selectedChat?.chatId === chatId) {
        setSelectedChat(null)
        setMobileView('list')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return d.toLocaleDateString()
  }

  const formatMsgTime = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="admin-main-content">
        <header className="admin-topbar">
          <button
            className="admin-topbar-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">👑</div>
            <div className="admin-topbar-profile-info">
              <strong>Admin</strong>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        <div className="admin-page-header">
          <div>
            <span className="admin-page-label">ADMIN PANEL</span>
            <h1 className="admin-page-title">Support Chat</h1>
            <p className="admin-page-sub">
              Live chat with customers. Replies appear instantly.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <MessageSquare size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Chats</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">🔔</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Unread</span>
              <strong className="admin-stat-value">{stats.unread}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">💬</div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Open</span>
              <strong className="admin-stat-value">{stats.open}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Resolved</span>
              <strong className="admin-stat-value">{stats.resolved}</strong>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="admin-section" style={{ padding: '16px 20px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={18} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search by customer name, email, message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  minWidth: 0,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'var(--surface)',
                    border: 'none',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'unread', label: `🔔 Unread (${stats.unread})` },
                { value: 'open', label: '💬 Open' },
                { value: 'resolved', label: '✅ Resolved' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      statusFilter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      statusFilter === opt.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    border:
                      statusFilter === opt.value
                        ? 'none'
                        : '1px solid var(--border-strong)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============ TWO-COLUMN LAYOUT ============ */}
        <div
          className="admin-section"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 380px) 1fr',
            minHeight: '600px',
            maxHeight: '75vh',
          }}
        >
          {/* LEFT: Chats list */}
          <div
            style={{
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
              background: 'var(--surface-soft)',
            }}
          >
            {loading ? (
              <div className="panel-loading" style={{ padding: '40px' }}>
                <div className="panel-loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  💬
                </div>
                <p style={{ fontWeight: 700, fontSize: '13.5px' }}>
                  No chats
                </p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  {search || statusFilter !== 'all'
                    ? 'Try different filter'
                    : 'Customer messages will appear here'}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.chatId === chat.chatId
                const unread = chat.unreadForAdmin || 0
                const isResolved = chat.status === 'resolved'

                return (
                  <div
                    key={chat.chatId}
                    onClick={() => {
                      setSelectedChat(chat)
                      setMobileView('chat')
                    }}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(5,150,105,0.1), rgba(16,185,129,0.05))'
                        : 'transparent',
                      borderLeft: isSelected
                        ? '3px solid #059669'
                        : '3px solid transparent',
                      transition: 'all 0.15s',
                      opacity: isResolved ? 0.65 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 900,
                          color: '#047857',
                          fontFamily: 'var(--font-heading)',
                          flexShrink: 0,
                        }}
                      >
                        {(chat.userName || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <strong
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {chat.userName || 'User'}
                          </strong>
                          <span
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--text-tertiary)',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {formatTime(chat.lastMessageAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                            }}
                          >
                            {chat.lastMessageBy === 'admin' && '👑 '}
                            {chat.lastMessage || 'No messages yet'}
                          </span>
                          {unread > 0 && (
                            <span
                              style={{
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 5px',
                                borderRadius: '999px',
                                background: '#F97316',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* RIGHT: Chat messages */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
            }}
          >
            {!selectedChat ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  color: 'var(--text-tertiary)',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '64px', opacity: 0.6 }}>💬</div>
                <p style={{ fontSize: '15px', fontWeight: 700 }}>
                  Select a chat to start
                </p>
                <p style={{ fontSize: '13px' }}>
                  Choose a conversation from the left
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--surface-soft)',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#047857',
                      fontFamily: 'var(--font-heading)',
                      flexShrink: 0,
                    }}
                  >
                    {(selectedChat.userName || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedChat.userName || 'User'}
                    </strong>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {selectedChat.userEmail}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      toggleResolved(selectedChat.chatId, selectedChat.status)
                    }
                    title={
                      selectedChat.status === 'resolved'
                        ? 'Reopen'
                        : 'Mark resolved'
                    }
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background:
                        selectedChat.status === 'resolved'
                          ? 'rgba(22,163,74,0.15)'
                          : 'var(--surface)',
                      border:
                        selectedChat.status === 'resolved'
                          ? '1px solid rgba(22,163,74,0.3)'
                          : '1px solid var(--border-strong)',
                      color:
                        selectedChat.status === 'resolved'
                          ? '#16a34a'
                          : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {selectedChat.status === 'resolved'
                      ? '✅ Resolved'
                      : 'Mark Done'}
                  </button>
                  <button
                    onClick={() => deleteChat(selectedChat.chatId)}
                    title="Delete"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'var(--bg-base)',
                  }}
                >
                  {messages.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--text-tertiary)',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin'
                      return (
                        <div
                          key={msg.id}
                          style={{
                            maxWidth: '75%',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                            padding: '10px 14px',
                            borderRadius: isAdmin
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            background: isAdmin
                              ? 'linear-gradient(135deg, #059669, #047857)'
                              : 'var(--surface)',
                            color: isAdmin
                              ? '#FFFFFF'
                              : 'var(--text-primary)',
                            border: isAdmin
                              ? 'none'
                              : '1px solid var(--border)',
                            boxShadow: isAdmin
                              ? '0 4px 12px rgba(5,150,105,0.25)'
                              : '0 2px 6px rgba(0,0,0,0.04)',
                            fontSize: '13.5px',
                            lineHeight: 1.45,
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.text}
                          <div
                            style={{
                              fontSize: '10px',
                              opacity: 0.7,
                              marginTop: '4px',
                              textAlign: isAdmin ? 'right' : 'left',
                            }}
                          >
                            {formatMsgTime(msg.createdAt)}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply input */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendingReply}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface-soft)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minWidth: 0,
                      fontFamily: 'var(--font-primary)',
                    }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background:
                        sendingReply || !replyText.trim()
                          ? 'var(--surface-soft)'
                          : 'linear-gradient(135deg, #059669, #047857)',
                      color:
                        sendingReply || !replyText.trim()
                          ? 'var(--text-tertiary)'
                          : '#FFFFFF',
                      border: 'none',
                      cursor:
                        sendingReply || !replyText.trim()
                          ? 'not-allowed'
                          : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        sendingReply || !replyText.trim()
                          ? 'none'
                          : '0 4px 12px rgba(5,150,105,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminSupportPage