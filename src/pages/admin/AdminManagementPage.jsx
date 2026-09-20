import { useState, useEffect, useMemo, useRef } from 'react'
import { db, auth } from '../../firebase'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut as fbSignOut,
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import AdminSidebar from '../../components/AdminSidebar'
import { toast } from 'react-toastify'
import {
  Menu,
  Search,
  X,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Camera,
  Eye,
  Crown,
  Handshake,
} from 'lucide-react'

const ROLES = [
  { value: 'admin', label: 'Admin', icon: '👑', color: '#dc2626' },
  { value: 'partner', label: 'Partner', icon: '🤝', color: '#3b82f6' },
]

const DEPARTMENTS = [
  'Leadership',
  'Operations',
  'Finance',
  'Marketing',
  'Support',
  'Technology',
  'Logistics',
  'Partnership',
  'Other',
]

const PERMISSION_SECTIONS = [
  { key: 'orders', label: 'Orders' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'foods', label: 'Food Menu' },
  { key: 'riders', label: 'Riders' },
  { key: 'customers', label: 'Customers' },
  { key: 'finance', label: 'Finance' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'support', label: 'Support' },
  { key: 'zones', label: 'Delivery Zones' },
  { key: 'walletRequests', label: 'Wallet Requests' },
  { key: 'gamingProducts', label: 'Gaming Products' },
  { key: 'gamingOrders', label: 'Gaming Orders' },
  { key: 'gamingSettings', label: 'Gaming Settings' },
  { key: 'settings', label: 'Settings' },
  { key: 'security', label: 'Security' },
]

const emptyPermissions = () => {
  const p = {}
  PERMISSION_SECTIONS.forEach((s) => (p[s.key] = false))
  return p
}

const adminPermissions = () => {
  const p = {}
  PERMISSION_SECTIONS.forEach((s) => (p[s.key] = true))
  return p
}

function AdminManagementPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selected, setSelected] = useState(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('Leadership')
  const [joiningDate, setJoiningDate] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('partner')
  const [permissions, setPermissions] = useState(emptyPermissions())
  const [status, setStatus] = useState('active')
  const [photo, setPhoto] = useState('')
  const [nidNumber, setNidNumber] = useState('')
  const [nidImage, setNidImage] = useState('')
  const [contractImage, setContractImage] = useState('')
  const [saving, setSaving] = useState(false)

  const photoInputRef = useRef(null)
  const nidInputRef = useRef(null)
  const contractInputRef = useRef(null)

  // Load members
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'managementMembers'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          firebaseId: d.id,
          ...d.data(),
        }))
        list.sort((a, b) => {
          const aT = a.createdAt?.toDate?.()?.getTime?.() || 0
          const bT = b.createdAt?.toDate?.()?.getTime?.() || 0
          return bT - aT
        })
        setMembers(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filteredMembers = useMemo(() => {
    let list = [...members]
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((m) =>
        `${m.memberId || ''} ${m.fullName || ''} ${m.email || ''} ${
          m.phone || ''
        } ${m.designation || ''}`
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [members, roleFilter, search])

  const stats = useMemo(() => {
    return {
      total: members.length,
      admins: members.filter((m) => m.role === 'admin').length,
      partners: members.filter((m) => m.role === 'partner').length,
      active: members.filter((m) => m.status === 'active').length,
    }
  }, [members])

  // ============ IMAGE UPLOAD ============
  const handleImageUpload = (e, setter, maxSize = 400) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w)
            w = maxSize
          }
        } else {
          if (h > maxSize) {
            w = Math.round((w * maxSize) / h)
            h = maxSize
          }
        }
        canvas.width = w
        canvas.height = h
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setter(compressed)
        toast.success('📷 Image ready! Click "Save"')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // ============ GENERATE MEMBER ID ============
  const generateMemberId = () => {
    if (members.length === 0) return 'AF-0001'
    const nums = members
      .map((m) => {
        const match = (m.memberId || '').match(/AF-(\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter((n) => n > 0)
    const max = nums.length > 0 ? Math.max(...nums) : 0
    const next = max + 1
    return `AF-${String(next).padStart(4, '0')}`
  }

  // ============ RESET FORM ============
  const resetForm = () => {
    setEditingId(null)
    setFullName('')
    setPhone('')
    setEmail('')
    setDesignation('')
    setDepartment('Leadership')
    setJoiningDate('')
    setResponsibilities('')
    setUsername('')
    setPassword('')
    setRole('partner')
    setPermissions(emptyPermissions())
    setStatus('active')
    setPhoto('')
    setNidNumber('')
    setNidImage('')
    setContractImage('')
    if (photoInputRef.current) photoInputRef.current.value = ''
    if (nidInputRef.current) nidInputRef.current.value = ''
    if (contractInputRef.current) contractInputRef.current.value = ''
  }

  // ============ ROLE CHANGE ============
  const handleRoleChange = (newRole) => {
    setRole(newRole)
    if (newRole === 'admin') {
      setPermissions(adminPermissions())
    } else {
      setPermissions(emptyPermissions())
    }
  }

  const togglePermission = (key) => {
    if (role === 'admin') {
      toast.info('Admin role has all permissions automatically')
      return
    }
    setPermissions((p) => ({ ...p, [key]: !p[key] }))
  }

  const toggleAllPermissions = () => {
    if (role === 'admin') return
    const allTrue = PERMISSION_SECTIONS.every((s) => permissions[s.key])
    const newPerms = {}
    PERMISSION_SECTIONS.forEach((s) => (newPerms[s.key] = !allTrue))
    setPermissions(newPerms)
  }

  // ============ SAVE ============
  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter full name')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter phone number')
      return
    }
    if (!designation.trim()) {
      toast.error('Please enter designation')
      return
    }
    if (!email.trim()) {
      toast.error('Please enter email address')
      return
    }

    // Password required for new member
    if (!editingId && !password.trim()) {
      toast.error('Please set a password (min 6 characters)')
      return
    }
    if (!editingId && password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      let firebaseUid = null

      // STEP 1: Create Firebase Auth account for NEW member
      if (!editingId) {
        try {
          const appName = `secondary-${Date.now()}`
          const secondaryApp = initializeApp(auth.app.options, appName)
          const secondaryAuth = getAuth(secondaryApp)

          const userCred = await createUserWithEmailAndPassword(
            secondaryAuth,
            email.trim().toLowerCase(),
            password
          )
          firebaseUid = userCred.user.uid

          // Sign out from secondary app so admin stays logged in
          await fbSignOut(secondaryAuth)
        } catch (authErr) {
          console.error('Auth creation error:', authErr)

          if (authErr.code === 'auth/email-already-in-use') {
            toast.error(
              'This email is already registered. Use a different email.'
            )
            setSaving(false)
            return
          }
          if (authErr.code === 'auth/invalid-email') {
            toast.error('Invalid email address')
            setSaving(false)
            return
          }
          if (authErr.code === 'auth/weak-password') {
            toast.error('Password is too weak')
            setSaving(false)
            return
          }
          toast.error('Failed to create login: ' + authErr.message)
          setSaving(false)
          return
        }
      }

      // STEP 2: Save to Firestore
      const data = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        designation: designation.trim(),
        department,
        joiningDate,
        responsibilities: responsibilities.trim(),
        username: username.trim(),
        role,
        permissions: role === 'admin' ? adminPermissions() : permissions,
        status,
        profilePhoto: photo,
        nidNumber: nidNumber.trim(),
        nidImage,
        contractImage,
        updatedAt: serverTimestamp(),
      }

      if (editingId) {
        await updateDoc(doc(db, 'managementMembers', editingId), data)
        toast.success('✅ Member updated!')
      } else {
        const memberId = generateMemberId()
        await addDoc(collection(db, 'managementMembers'), {
          ...data,
          memberId,
          firebaseUid,
          lastLogin: null,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.email || 'unknown',
        })
        toast.success(
          `✅ Member added (ID: ${memberId}). Login: ${email.trim()}`
        )
      }

      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save: ' + (err?.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (member) => {
    setEditingId(member.firebaseId)
    setFullName(member.fullName || '')
    setPhone(member.phone || '')
    setEmail(member.email || '')
    setDesignation(member.designation || '')
    setDepartment(member.department || 'Leadership')
    setJoiningDate(member.joiningDate || '')
    setResponsibilities(member.responsibilities || '')
    setUsername(member.username || '')
    setPassword('')
    setRole(member.role || 'partner')
    setPermissions(member.permissions || emptyPermissions())
    setStatus(member.status || 'active')
    setPhoto(member.profilePhoto || '')
    setNidNumber(member.nidNumber || '')
    setNidImage(member.nidImage || '')
    setContractImage(member.contractImage || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleStatus = async (firebaseId, current) => {
    try {
      await updateDoc(doc(db, 'managementMembers', firebaseId), {
        status: current === 'active' ? 'inactive' : 'active',
      })
      toast.success('Status updated')
    } catch (err) {
      console.error(err)
    }
  }

  const deleteMember = async (firebaseId, name) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return
    try {
      await deleteDoc(doc(db, 'managementMembers', firebaseId))
      toast.success('Member deleted')
      if (selected?.firebaseId === firebaseId) setSelected(null)
    } catch (err) {
      console.error(err)
    }
  }

  const getRoleBadge = (roleValue) => {
    const r = ROLES.find((x) => x.value === roleValue)
    return r || ROLES[1]
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
            <h1 className="admin-page-title">Management Team</h1>
            <p className="admin-page-sub">
              Manage Admins and Partners with roles & permissions.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              resetForm()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card glass-stat blue">
            <div className="admin-stat-icon">
              <Users size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Members</span>
              <strong className="admin-stat-value">{stats.total}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat pink">
            <div className="admin-stat-icon">
              <Crown size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Admins</span>
              <strong className="admin-stat-value">{stats.admins}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat orange">
            <div className="admin-stat-icon">
              <Handshake size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Partners</span>
              <strong className="admin-stat-value">{stats.partners}</strong>
            </div>
          </div>
          <div className="admin-stat-card glass-stat green">
            <div className="admin-stat-icon">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Active</span>
              <strong className="admin-stat-value">{stats.active}</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div
            className="admin-section"
            style={{ padding: '24px', marginBottom: '20px' }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                marginBottom: '20px',
                color: 'var(--text-primary)',
              }}
            >
              {editingId ? '✏️ Edit Member' : '➕ Add New Member'}
            </h3>

            {/* Photo Upload */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '20px',
                borderBottom: '1px dashed var(--border)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  boxShadow: '0 12px 32px rgba(16,185,129,0.25)',
                  border: '4px solid var(--surface)',
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setPhoto, 400)}
                style={{ display: 'none' }}
                id="member-photo-upload"
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  htmlFor="member-photo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '999px',
                    background:
                      'linear-gradient(135deg, #059669, #047857)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                  }}
                >
                  <Camera size={14} />
                  {photo ? 'Change Photo' : 'Upload Photo'}
                </label>
                {photo && (
                  <button
                    onClick={() => {
                      setPhoto('')
                      if (photoInputRef.current)
                        photoInputRef.current.value = ''
                    }}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                👤 Basic Information
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                <Field label="Full Name *">
                  <input
                    type="text"
                    placeholder="e.g., Sunny Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Phone Number *">
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email * (used for login)">
                  <input
                    type="email"
                    placeholder="member@araifood.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    disabled={Boolean(editingId)}
                  />
                </Field>
              </div>
            </div>

            {/* Job Info */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                💼 Job Information
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                <Field label="Designation / Position *">
                  <input
                    type="text"
                    placeholder="e.g., Operations Manager"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Department">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={inputStyle}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Joining Date">
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={{ marginTop: '14px' }}>
                <Field label="Responsibilities">
                  <textarea
                    rows={3}
                    placeholder="Key responsibilities of this member..."
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                </Field>
              </div>
            </div>

            {/* Account & Access */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                🔐 Account & Access
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                <Field label="Username">
                  <input
                    type="text"
                    placeholder="e.g., sunny"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                {!editingId && (
                  <Field label="Password * (min 6 chars)">
                    <input
                      type="text"
                      placeholder="Set a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={inputStyle}
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        marginTop: '4px',
                        fontStyle: 'italic',
                      }}
                    >
                      💡 Save this password — you'll need to share it with the
                      member
                    </div>
                  </Field>
                )}

                <Field label="Role *">
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    style={inputStyle}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.icon} {r.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Account Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⛔ Inactive</option>
                  </select>
                </Field>
              </div>

              {/* Permissions */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--surface-soft)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <strong
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    🛡️ Permissions (Admin Panel Access)
                  </strong>
                  {role === 'admin' ? (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#dc2626',
                        background: 'rgba(220,38,38,0.1)',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontWeight: 800,
                      }}
                    >
                      👑 All access (Admin)
                    </span>
                  ) : (
                    <button
                      onClick={toggleAllPermissions}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {PERMISSION_SECTIONS.every((s) => permissions[s.key])
                        ? '✕ Deselect All'
                        : '✓ Select All'}
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {PERMISSION_SECTIONS.map((section) => {
                    const isChecked = permissions[section.key]
                    const isAdminLocked = role === 'admin'
                    return (
                      <label
                        key={section.key}
                        onClick={() =>
                          !isAdminLocked && togglePermission(section.key)
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          background: isChecked
                            ? 'rgba(16,185,129,0.1)'
                            : 'var(--surface)',
                          border: isChecked
                            ? '1px solid rgba(16,185,129,0.4)'
                            : '1px solid var(--border)',
                          borderRadius: '10px',
                          cursor: isAdminLocked ? 'not-allowed' : 'pointer',
                          opacity: isAdminLocked && !isChecked ? 0.5 : 1,
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          disabled={isAdminLocked}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#059669',
                            cursor: isAdminLocked
                              ? 'not-allowed'
                              : 'pointer',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: isChecked
                              ? '#059669'
                              : 'var(--text-secondary)',
                          }}
                        >
                          {section.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                📎 Documents
              </div>

              <Field label="NID / Identity Number">
                <input
                  type="text"
                  placeholder="e.g., 1234567890"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  marginTop: '14px',
                }}
              >
                {/* NID Image */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    NID Image
                  </label>
                  <input
                    ref={nidInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setNidImage, 800)}
                    style={{ display: 'none' }}
                    id="nid-upload"
                  />
                  {nidImage ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <img
                        src={nidImage}
                        alt="NID"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        onClick={() => setNidImage('')}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'rgba(220,38,38,0.9)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="nid-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '20px',
                        background: 'var(--surface-soft)',
                        border: '2px dashed var(--border-strong)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Camera size={18} />
                      Upload NID
                    </label>
                  )}
                </div>

                {/* Contract Image */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Contract Document
                  </label>
                  <input
                    ref={contractInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e, setContractImage, 800)
                    }
                    style={{ display: 'none' }}
                    id="contract-upload"
                  />
                  {contractImage ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <img
                        src={contractImage}
                        alt="Contract"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        onClick={() => setContractImage('')}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'rgba(220,38,38,0.9)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="contract-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '20px',
                        background: 'var(--surface-soft)',
                        border: '2px dashed var(--border-strong)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Camera size={18} />
                      Upload Contract
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '16px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Save size={18} />
              {saving
                ? 'Creating Account...'
                : editingId
                ? 'Update Member'
                : 'Add Member & Create Login'}
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="admin-section" style={{ padding: '20px' }}>
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
                placeholder="Search by ID, name, email, phone..."
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
                { value: 'admin', label: '👑 Admin' },
                { value: 'partner', label: '🤝 Partner' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoleFilter(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background:
                      roleFilter === opt.value
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--surface)',
                    color:
                      roleFilter === opt.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                    border:
                      roleFilter === opt.value
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

        {/* List */}
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner"></div>
            <p>Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div
            className="admin-section"
            style={{ textAlign: 'center', padding: '60px' }}
          >
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>👥</p>
            <h3>No members yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Click "Add Member" to add your first management member.
            </p>
          </div>
        ) : (
          <div className="admin-section" style={{ padding: '10px' }}>
            {filteredMembers.map((m) => {
              const roleBadge = getRoleBadge(m.role)
              const isActive = m.status === 'active'
              return (
                <div
                  key={m.firebaseId}
                  style={{
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background:
                        'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      flexShrink: 0,
                      border: '3px solid var(--surface)',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                    }}
                  >
                    {m.profilePhoto ? (
                      <img
                        src={m.profilePhoto}
                        alt={m.fullName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '👤'
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {m.fullName}
                      </strong>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: `${roleBadge.color}20`,
                          color: roleBadge.color,
                          fontSize: '10.5px',
                          fontWeight: 800,
                        }}
                      >
                        {roleBadge.icon} {roleBadge.label}
                      </span>
                      {!isActive && (
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(107,114,128,0.15)',
                            color: '#6B7280',
                            fontSize: '10.5px',
                            fontWeight: 800,
                          }}
                        >
                          ⛔ Inactive
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {m.designation} • {m.department}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-tertiary)',
                        fontWeight: 600,
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>🆔 {m.memberId}</span>
                      {m.phone && <span>📞 {m.phone}</span>}
                      {m.email && <span>📧 {m.email}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(m)}
                    title="View Details"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => toggleStatus(m.firebaseId, m.status)}
                    title={isActive ? 'Deactivate' : 'Activate'}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isActive
                        ? 'rgba(245,158,11,0.12)'
                        : 'rgba(22,163,74,0.12)',
                      border: isActive
                        ? '1px solid rgba(245,158,11,0.3)'
                        : '1px solid rgba(22,163,74,0.3)',
                      color: isActive ? '#f59e0b' : '#16a34a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isActive ? (
                      <XCircle size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                  </button>

                  <button
                    onClick={() => handleEdit(m)}
                    title="Edit"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => deleteMember(m.firebaseId, m.fullName)}
                    title="Delete"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div
          className="outside-area-modal"
          onClick={() => setSelected(null)}
        >
          <div
            className="outside-area-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 0,
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 10,
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background:
                      'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    flexShrink: 0,
                  }}
                >
                  {selected.profilePhoto ? (
                    <img
                      src={selected.profilePhoto}
                      alt={selected.fullName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    '👤'
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selected.fullName}
                  </h2>
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    🆔 {selected.memberId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-soft)',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '20px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <InfoSection title="👤 Basic">
                <InfoRow label="Full Name" value={selected.fullName} />
                <InfoRow label="Phone" value={selected.phone} />
                <InfoRow label="Email" value={selected.email} />
              </InfoSection>

              <InfoSection title="💼 Job">
                <InfoRow label="Designation" value={selected.designation} />
                <InfoRow label="Department" value={selected.department} />
                <InfoRow label="Joining" value={selected.joiningDate} />
                {selected.responsibilities && (
                  <InfoRow
                    label="Responsibilities"
                    value={selected.responsibilities}
                  />
                )}
              </InfoSection>

              <InfoSection title="🔐 Access">
                <InfoRow label="Username" value={selected.username} />
                <InfoRow
                  label="Role"
                  value={getRoleBadge(selected.role).label}
                />
                <InfoRow
                  label="Status"
                  value={
                    selected.status === 'active' ? 'Active' : 'Inactive'
                  }
                />
                <InfoRow
                  label="Firebase UID"
                  value={
                    selected.firebaseUid
                      ? selected.firebaseUid.slice(0, 12) + '...'
                      : '—'
                  }
                />
              </InfoSection>

              {selected.role === 'partner' && selected.permissions && (
                <div
                  style={{
                    padding: '14px',
                    background: 'var(--surface-soft)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '10px',
                    }}
                  >
                    🛡️ Permissions
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {PERMISSION_SECTIONS.filter(
                      (s) => selected.permissions[s.key]
                    ).map((s) => (
                      <span
                        key={s.key}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: 'rgba(16,185,129,0.12)',
                          color: '#059669',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        ✓ {s.label}
                      </span>
                    ))}
                    {PERMISSION_SECTIONS.every(
                      (s) => !selected.permissions[s.key]
                    ) && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        No permissions assigned
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(selected.nidNumber ||
                selected.nidImage ||
                selected.contractImage) && (
                <InfoSection title="📎 Documents">
                  <InfoRow label="NID Number" value={selected.nidNumber} />
                  {selected.nidImage && (
                    <div style={{ marginTop: '8px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-tertiary)',
                          marginBottom: '4px',
                        }}
                      >
                        NID IMAGE
                      </div>
                      <img
                        src={selected.nidImage}
                        alt="NID"
                        style={{
                          width: '100%',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      />
                    </div>
                  )}
                  {selected.contractImage && (
                    <div style={{ marginTop: '8px' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-tertiary)',
                          marginBottom: '4px',
                        }}
                      >
                        CONTRACT IMAGE
                      </div>
                      <img
                        src={selected.contractImage}
                        alt="Contract"
                        style={{
                          width: '100%',
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      />
                    </div>
                  )}
                </InfoSection>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-primary)',
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoSection({ title, children }) {
  return (
    <div
      style={{
        padding: '14px',
        background: 'var(--surface-soft)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          fontSize: '11.5px',
          fontWeight: 800,
          color: 'var(--primary)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13.5px',
      }}
    >
      <span
        style={{
          color: 'var(--text-secondary)',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <strong
        style={{
          color: 'var(--text-primary)',
          textAlign: 'right',
          wordBreak: 'break-word',
          fontWeight: 700,
        }}
      >
        {value || '—'}
      </strong>
    </div>
  )
}

export default AdminManagementPage