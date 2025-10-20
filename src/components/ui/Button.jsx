export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClasses = variant === 'primary' ? 'meta-button' : 'meta-button-secondary'
  const sizeClasses = size === 'small' ? 'meta-button-small' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
