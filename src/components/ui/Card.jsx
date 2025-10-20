export default function Card({ children, className = '', padding = true }) {
  const paddingClass = padding ? 'meta-card-padding' : ''
  return <div className={`meta-card ${paddingClass} ${className}`}>{children}</div>
}

export function CardHeader({ children, className = '' }) {
  return <div className={`meta-card-header ${className}`}>{children}</div>
}
