import { useState } from 'react'

export default function Button({ children = 'Continue', onClick, type = 'button' }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick(event) {
    if (!onClick) return

    setIsLoading(true)
    try {
      await onClick(event)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}

export async function reconcileRepositories(organizations) {
  const results = []

  for (const organization of organizations) {
    try {
      const repositories = await fetchRepositories(organization.id)

      for (const repository of repositories) {
        const pullRequests = await fetchPullRequests(repository.id)

        if (!pullRequests.length) {
          await markRepositoryAsProcessed(repository.id)
          continue
        }

        for (const pullRequest of pullRequests) {
          const existingReview = await findReview(pullRequest.id)

          if (existingReview) {
            continue
          }

          const review = await createReview({
            organizationId: organization.id,
            repositoryId: repository.id,
            pullRequestId: pullRequest.id,
            status: 'pending',
          })

          if (!review) {
            return results
          }

          await queueReview(review.id)

          if (pullRequest.draft) {
            await updateReview(review.id, {
              status: 'skipped',
              reason: 'draft',
            })
          }
        }

        await markRepositoryAsProcessed(repository.id)
      }

      results.push({
        organizationId: organization.id,
        status: 'completed',
      })
    } catch (error) {
      console.error(
        `Failed to reconcile organization ${organization.id}`,
        error
      )

      results.push({
        organizationId: organization.id,
        status: 'failed',
        error: error.message,
      })
    }
  }

  return results
}
