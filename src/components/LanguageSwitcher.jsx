// ============================================================
// src/components/LanguageSwitcher.jsx
// V2 — No flag emoji (Windows-compatible)
// ============================================================

import { useLanguage } from '../i18n/LanguageContext'

function LanguageSwitcher({ variant = 'pill' }) {
  const { language, setLanguage } = useLanguage()
  const isBangla = language === 'bn'

  // ============================================================
  // VARIANT: MINIMAL
  // ============================================================
  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(isBangla ? 'en' : 'bn')}
        title={isBangla ? 'Switch to English' : 'বাংলায় দেখুন'}
        aria-label={isBangla ? 'Switch to English' : 'বাংলায় দেখুন'}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-strong)',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '12.5px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        {isBangla ? 'EN' : 'বাং'}
      </button>
    )
  }

  // ============================================================
  // VARIANT: PILL (default)
  // ============================================================
  return (
    <div
      role="group"
      aria-label="Language switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--surface-soft)',
        border: '1px solid var(--border-strong)',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* BN option */}
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        aria-pressed={isBangla}
        title="বাংলা"
        style={{
          border: 'none',
          background: isBangla
            ? 'linear-gradient(135deg, #059669, #047857)'
            : 'transparent',
          color: isBangla ? '#FFFFFF' : 'var(--text-secondary)',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '12.5px',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isBangla
            ? '0 2px 6px rgba(5,150,105,0.3)'
            : 'none',
          minHeight: '30px',
          minWidth: '50px',
          whiteSpace: 'nowrap',
        }}
      >
        বাং
      </button>

      {/* EN option */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={!isBangla}
        title="English"
        style={{
          border: 'none',
          background: !isBangla
            ? 'linear-gradient(135deg, #059669, #047857)'
            : 'transparent',
          color: !isBangla ? '#FFFFFF' : 'var(--text-secondary)',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '12.5px',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: !isBangla
            ? '0 2px 6px rgba(5,150,105,0.3)'
            : 'none',
          minHeight: '30px',
          minWidth: '50px',
          whiteSpace: 'nowrap',
        }}
      >
        EN
      </button>
    </div>
  )
}

export default LanguageSwitcher