export default function SortableTableHeader({ label, sortKey, currentSort, onSort }) {
  const handleClick = () => {
    if (currentSort.key === sortKey) {
      // Toggle between asc, desc, and null (no sort)
      if (currentSort.direction === 'asc') {
        onSort({ key: sortKey, direction: 'desc' })
      } else if (currentSort.direction === 'desc') {
        onSort({ key: null, direction: null })
      } else {
        onSort({ key: sortKey, direction: 'asc' })
      }
    } else {
      onSort({ key: sortKey, direction: 'asc' })
    }
  }

  const getSortIcon = () => {
    if (currentSort.key !== sortKey) {
      return (
        <span className="ml-1 text-text-muted opacity-50">
          <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5H5z" />
          </svg>
        </span>
      )
    }

    if (currentSort.direction === 'asc') {
      return (
        <span className="ml-1 text-brand">
          <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 12l5-5 5 5H5z" />
          </svg>
        </span>
      )
    }

    if (currentSort.direction === 'desc') {
      return (
        <span className="ml-1 text-brand">
          <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 8l5 5 5-5H5z" />
          </svg>
        </span>
      )
    }

    return null
  }

  return (
    <th
      onClick={handleClick}
      className="cursor-pointer hover:bg-canvas transition-colors select-none"
    >
      <div className="flex items-center">
        {label}
        {getSortIcon()}
      </div>
    </th>
  )
}
