export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-card w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto shadow-sh-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-sp-5 py-sp-4 border-b border-divider flex justify-between items-center">
          <h2 className="text-16 font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:bg-canvas rounded p-1 text-20 leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-sp-5 py-sp-5">{children}</div>
        {footer && (
          <div className="px-sp-5 py-sp-4 border-t border-divider flex gap-sp-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
