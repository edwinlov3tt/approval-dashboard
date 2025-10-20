export default function ProgressBar({ value, max = 100, className = '' }) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={`meta-progress ${className}`}>
      <div className="meta-progress-bar" style={{ width: `${percentage}%` }}></div>
    </div>
  )
}
