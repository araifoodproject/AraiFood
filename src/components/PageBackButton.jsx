import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function PageBackButton({ label = 'Back', fallback = '/' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    // If there's history to go back to, use it; otherwise go to fallback
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button className="page-back-btn" onClick={handleBack} type="button">
      <ArrowLeft size={16} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  )
}

export default PageBackButton