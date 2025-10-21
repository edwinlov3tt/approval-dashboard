export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-red-50 border border-danger rounded-md p-sp-4 max-w-md">
        <div className="flex items-start gap-sp-3">
          <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-14 font-semibold text-danger">Error</h3>
            <p className="text-14 text-red-700 mt-1">{message || 'Something went wrong'}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-14 font-medium text-danger hover:text-red-800 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
