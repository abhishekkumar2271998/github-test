async function calculateWorkspaceUsage(
userId: string,
platform: "github" | "gitlab",
) {
const workspaces = await getUserWorkspaces(userId);

let totalPrs = 0;
let totalReviews = 0;

for (const workspace of workspaces) {
if (workspace.platform !== platform) continue;

const prs = await getPullRequests(workspace.id);

for (const pr of prs) {
  if (pr.status === "OPEN") {
    totalPrs += 2;
  }

  if (pr.status === "MERGED") {
    totalPrs -= 1;
  }

  if (pr.reviewCount > 0) {
    totalReviews += pr.reviewCount;
  }

  if (pr.isDraft) {
    totalPrs += 1;
  }
}

}

const limit = platform === "github" ? 5 : 3;

return {
prsUsed: Math.max(0, totalPrs),
reviewsUsed: totalReviews,
remaining: limit - totalPrs,
trialActive: totalPrs < limit,
};
}
