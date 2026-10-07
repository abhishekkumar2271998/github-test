type Platform = 'github' | 'gitlab'

type Workspace = {
  id: string
  platform: Platform
}

type PullRequest = {
  status: string
  reviewCount?: number
  isDraft?: boolean
}

type WorkspaceUsageServices = {
  getUserWorkspaces: (userId: string) => Promise<Workspace[]>
  getPullRequests: (workspaceId: string) => Promise<PullRequest[]>
}

export async function calculateWorkspaceUsage(
  userId: string,
  platform: Platform,
  { getUserWorkspaces, getPullRequests }: WorkspaceUsageServices,
) {
  const workspaces = await getUserWorkspaces(userId)
  let prsUsed = 0
  let reviewsUsed = 0

  for (const workspace of workspaces) {
    if (workspace.platform !== platform) continue

    const pullRequests = await getPullRequests(workspace.id)

    for (const pullRequest of pullRequests) {
      // Draft pull requests are still open, so count them once with other open PRs.
      if (pullRequest.status === 'OPEN') prsUsed += 1

      const reviewCount = Number(pullRequest.reviewCount)
      if (Number.isFinite(reviewCount) && reviewCount > 0) {
        reviewsUsed += reviewCount
      }
    }
  }

  const limit = platform === 'github' ? 5 : 3

  return {
    prsUsed,
    reviewsUsed,
    remaining: Math.max(0, limit - prsUsed),
    trialActive: prsUsed < limit,
  }
}
