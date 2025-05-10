import { config } from "../config";
import { RepositoryModel } from "../models/repository.model";

const GITHUB_API_BASE = "https://api.github.com";

export async function fetchRepositoryData(owner: string, repo: string) {
  // server.log.info({ message: 'fetchRepositoryData called' });
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `token ${config.githubApiToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    owner: data.owner.login,
    name: data.name,
    url: data.html_url,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    createdAt: new Date(data.created_at).getTime(),
  };
}
export async function updateRepositoryData(repoId: string) {
  const repo = await RepositoryModel.findById(repoId);
  if (!repo) {
    throw new Error("Repository not found");
  }

  const data = await fetchRepositoryData(repo.owner, repo.name);
  Object.assign(repo, data);
  await repo.save();

  return repo;
}
