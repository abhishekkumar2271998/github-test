const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
}

// Workflows emit both lowercase and uppercase statuses, so match case-insensitively.
export function formatReviewStatus(status) {
  if (typeof status !== 'string') return 'Unknown'
  return STATUS_LABELS[status.toLowerCase()] || 'Unknown'
}
