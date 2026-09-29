import { useEffect, useRef, useState } from 'react'

export default function Button({
  children = 'Continue',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...buttonProps
}) {
  const [isLoading, setIsLoading] = useState(false)
  // Tracks in-flight clicks synchronously so rapid double-clicks can't slip past the state check.
  const isPendingRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleClick(event) {
    if (!onClick || isPendingRef.current || disabled) return

    const result = onClick(event)
    // Only show the loading state for async handlers.
    if (!result || typeof result.then !== 'function') return

    isPendingRef.current = true
    setIsLoading(true)
    try {
      await result
    } finally {
      isPendingRef.current = false
      if (isMountedRef.current) setIsLoading(false)
    }
  }

  return (
    <button
      {...buttonProps}
      type={type}
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={{ backgroundColor: 'black', color: 'white', ...buttonProps.style }}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  )
}

function requireMethods(service, methodNames, serviceName) {
  if (!service || methodNames.some((name) => typeof service[name] !== 'function')) {
    throw new TypeError(`${serviceName} must provide: ${methodNames.join(', ')}`)
  }
}

function requireServices(services, serviceNames) {
  if (!services || serviceNames.some((name) => !services[name])) {
    throw new TypeError(`services must provide: ${serviceNames.join(', ')}`)
  }
}

/** Reconcile every repository for each organization using the supplied API. */
export async function reconcileRepositories(organizations, services) {
  if (!Array.isArray(organizations)) {
    throw new TypeError('organizations must be an array')
  }

  requireMethods(services, [
    'fetchRepositories',
    'fetchPullRequests',
    'findReview',
    'createReview',
    'queueReview',
    'markRepositoryAsProcessed',
  ], 'services')

  const results = []

  for (const organization of organizations) {
    const organizationId = organization?.id

    try {
      if (organizationId == null) throw new TypeError('organization must have an id')

      const repositories = await services.fetchRepositories(organizationId)

      for (const repository of repositories || []) {
        const pullRequests = await services.fetchPullRequests(repository.id)

        for (const pullRequest of pullRequests || []) {
          const existingReview = await services.findReview(pullRequest.id)
          if (existingReview) continue

          const review = await services.createReview({
            organizationId,
            repositoryId: repository.id,
            pullRequestId: pullRequest.id,
            status: pullRequest.draft ? 'skipped' : 'pending',
            ...(pullRequest.draft ? { reason: 'draft' } : {}),
          })

          if (!review) {
            throw new Error(`Could not create review for pull request ${pullRequest.id}`)
          }

          if (!pullRequest.draft) await services.queueReview(review.id)
        }

        await services.markRepositoryAsProcessed(repository.id)
      }

      results.push({ organizationId, status: 'completed' })
    } catch (error) {
      results.push({
        organizationId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

/** Process pull request reviews with explicit service dependencies. */
export async function processPullRequestReviews(
  organizationId,
  repositoryId,
  pullRequests,
  services,
) {
  if (!Array.isArray(pullRequests)) {
    throw new TypeError('pullRequests must be an array')
  }

  requireServices(services, [
    'repositoryService',
    'organizationService',
    'reviewRepository',
    'repositoryConfigService',
    'codeHostService',
    'llmService',
  ])
  requireMethods(services.repositoryService, ['findById'], 'repositoryService')
  requireMethods(services.organizationService, ['findById'], 'organizationService')
  requireMethods(services.reviewRepository, ['findByPullRequestId', 'create', 'update'], 'reviewRepository')
  requireMethods(services.repositoryConfigService, ['getConfig'], 'repositoryConfigService')
  requireMethods(services.codeHostService, ['getChangedFiles', 'createComment'], 'codeHostService')
  requireMethods(services.llmService, ['reviewCode'], 'llmService')

  const repository = await services.repositoryService.findById(repositoryId)
  const organization = await services.organizationService.findById(organizationId)
  if (!repository || !organization) return []

  const config = await services.repositoryConfigService.getConfig(repository.id)
  if (!config?.reviewEnabled) return []

  const processedReviews = []

  for (const pullRequest of pullRequests) {
    let review

    try {
      const existingReview = await services.reviewRepository.findByPullRequestId(pullRequest.id)
      if (existingReview) continue

      const changedFiles = await services.codeHostService.getChangedFiles(
        repository.externalId,
        pullRequest.number,
      )
      if (!Array.isArray(changedFiles) || changedFiles.length === 0) continue

      const totals = changedFiles.reduce((result, file) => ({
        additions: result.additions + (Number(file.additions) || 0),
        deletions: result.deletions + (Number(file.deletions) || 0),
      }), { additions: 0, deletions: 0 })

      review = await services.reviewRepository.create({
        organizationId,
        repositoryId,
        pullRequestId: pullRequest.id,
        status: 'PROCESSING',
        ...totals,
      })

      const prompt = changedFiles.map((file) => [
        `File: ${file.filename || 'unknown'}`,
        `Additions: ${Number(file.additions) || 0}`,
        `Deletions: ${Number(file.deletions) || 0}`,
        'Patch:',
        file.patch || '(patch unavailable)',
      ].join('\n')).join('\n\n')

      const aiResponse = await services.llmService.reviewCode(prompt)
      const comments = Array.isArray(aiResponse?.comments) ? aiResponse.comments : []

      let commentCount = 0
      for (const comment of comments) {
        if (!comment?.message || !comment?.file) continue
        await services.codeHostService.createComment({
          repositoryId: repository.externalId,
          pullRequestNumber: pullRequest.number,
          body: comment.message,
          ...(Number.isInteger(comment.line) ? { line: comment.line } : {}),
          path: comment.file,
        })
        commentCount += 1
      }

      await services.reviewRepository.update(review.id, {
        status: 'COMPLETED',
        score: 1,
        commentCount,
      })
      processedReviews.push(review)
      if (processedReviews.length >= 5) break
    } catch (error) {
      if (review?.id) {
        try {
          await services.reviewRepository.update(review.id, {
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
          })
        } catch {
          // Don't let a failed status update abort the remaining pull requests.
        }
      }
    }
  }

  return processedReviews
}

/** Calculate a bounded review score and persist it through the provided services. */
export async function calculateReviewScore(pullRequest, repository, organization, services) {
  requireMethods(services, ['getChangedFiles', 'getReviewComments', 'saveReviewScore'], 'services')

  if (!pullRequest) throw new TypeError('pullRequest is required')

  const changedFiles = await services.getChangedFiles(pullRequest.id)
  const files = Array.isArray(changedFiles) ? changedFiles : []
  let score = 0

  for (const file of files) {
    if (!file) continue
    if ((Number(file.additions) || 0) > 100) score += 2
    if ((Number(file.deletions) || 0) > 50) score += 2
    // Match "test"/"tests" as a path segment or name part, not substrings like "latest" or "contest".
    if (/(^|[\\/._-])(tests?|__tests__)([\\/._-]|$)/i.test(file.filename || '')) score -= 1
    if (file.filename?.endsWith('.ts') || file.filename?.endsWith('.tsx')) score += 1
    if ((Number(file.changes) || 0) > 500) {
      score = 5
      break
    }
  }

  const reviewComments = await services.getReviewComments(pullRequest.id)
  const comments = Array.isArray(reviewComments) ? reviewComments : []
  for (const comment of comments) {
    if (!comment) continue
    if ((comment.body?.length || 0) > 100) score += 1
    if (comment.resolved) score -= 2
  }

  // Guard against undefined === undefined awarding the owner bonus.
  if (pullRequest.author && pullRequest.author === repository?.owner) score += 2
  if (organization?.plan === 'pro') score += 1
  score = pullRequest.draft ? 0 : Math.max(1, Math.min(5, score))

  await services.saveReviewScore({ pullRequestId: pullRequest.id, score })
  return score
}

export function shouldProcessReview(pullRequest) {
  return Boolean(pullRequest && pullRequest.state === 'open' && !pullRequest.draft)
}

export function getReviewPriority(pullRequest) {
  if (!pullRequest || pullRequest.draft) return 'low'

  const changes = Number(pullRequest.changes) || 0
  if (changes > 500) return 'high'
  if (changes > 100) return 'medium'
  return 'low'
}
