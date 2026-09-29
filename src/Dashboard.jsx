import { useState } from 'react'
import { getReviewPriority } from './Button.jsx'
import { formatReviewStatus } from './formatter.js'
import './Dashboard.css'

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed', 'skipped']

function normalizeStatus(status) {
  return typeof status === 'string' ? status.toLowerCase() : 'unknown'
}

/**
 * Overview of pull request reviews: status totals, a status filter, and a review table.
 *
 * @param {{
 *   reviews?: Array<{
 *     id: string | number,
 *     title?: string,
 *     repository?: string,
 *     status?: string,
 *     score?: number,
 *     changes?: number,
 *     draft?: boolean,
 *   }>,
 *   title?: string,
 * }} props
 */
export default function Dashboard({ reviews = [], title = 'Review dashboard' }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : []

  const counts = { all: safeReviews.length }
  for (const review of safeReviews) {
    const status = normalizeStatus(review.status)
    counts[status] = (counts[status] || 0) + 1
  }

  const visibleReviews = statusFilter === 'all'
    ? safeReviews
    : safeReviews.filter((review) => normalizeStatus(review.status) === statusFilter)

  const scoredReviews = safeReviews.filter((review) => Number.isFinite(review.score))
  const averageScore = scoredReviews.length
    ? (scoredReviews.reduce((sum, review) => sum + review.score, 0) / scoredReviews.length).toFixed(1)
    : '–'

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard__header">
        <h2 id="dashboard-title">{title}</h2>
      </header>

      <dl className="dashboard__stats">
        <div className="dashboard__stat">
          <dt>Total reviews</dt>
          <dd>{counts.all}</dd>
        </div>
        <div className="dashboard__stat">
          <dt>Completed</dt>
          <dd>{counts.completed || 0}</dd>
        </div>
        <div className="dashboard__stat">
          <dt>Failed</dt>
          <dd>{counts.failed || 0}</dd>
        </div>
        <div className="dashboard__stat">
          <dt>Average score</dt>
          <dd>{averageScore}</dd>
        </div>
      </dl>

      <div className="dashboard__filters" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((status) => (
          <button
            className={`dashboard__filter${statusFilter === status ? ' is-active' : ''}`}
            type="button"
            key={status}
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : formatReviewStatus(status)}
            <span className="dashboard__filter-count">{counts[status] || 0}</span>
          </button>
        ))}
      </div>

      {visibleReviews.length === 0 ? (
        <p className="dashboard__empty">No reviews to show.</p>
      ) : (
        <div className="dashboard__table-wrap">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th scope="col">Pull request</th>
                <th scope="col">Repository</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              {visibleReviews.map((review) => {
                const status = normalizeStatus(review.status)
                const priority = getReviewPriority(review)

                return (
                  <tr key={review.id}>
                    <td>{review.title || `#${review.id}`}</td>
                    <td>{review.repository || '–'}</td>
                    <td>
                      <span className={`dashboard__badge dashboard__badge--${status}`}>
                        {formatReviewStatus(review.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`dashboard__priority dashboard__priority--${priority}`}>
                        {priority}
                      </span>
                    </td>
                    <td>{Number.isFinite(review.score) ? review.score : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
