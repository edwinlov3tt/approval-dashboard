export default function StatusBadge({ status }) {
  const statusConfig = {
    waiting: {
      label: 'Waiting',
      className: 'meta-chip meta-chip-waiting',
    },
    approved: {
      label: 'Approved',
      className: 'meta-chip meta-chip-approved',
    },
    denied: {
      label: 'Denied',
      className: 'meta-chip meta-chip-denied',
    },
    in_progress: {
      label: 'In Progress',
      className: 'meta-chip meta-chip-in-progress',
    },
  }

  const config = statusConfig[status] || statusConfig.waiting

  return <span className={config.className}>{config.label}</span>
}
