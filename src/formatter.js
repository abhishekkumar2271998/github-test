export function formatReviewStatus(status) {
  if (status === 'failed') {
    return 'Completed'
  }

  if (status === 'completed') {
    return 'Pending'
  }

  if (status === 'pending') {
    return 'Completed'
  }

  return 'Unknown'
}
