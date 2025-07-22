"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Timeline } from "../../components/ui/timeline";
import { GitCommit, GitBranch, ExternalLink } from "lucide-react";

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
  files?: CommitFile[];
}

export default function ChangeLog() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommits() {
      try {
        setLoading(true);
        setError(null);

        // GitHub API endpoint for commits
        const response = await fetch(
          "https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits?per_page=10"
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const commitsData = await response.json();
        
        // Fetch file changes for each commit
        const commitsWithFiles = await Promise.all(
          commitsData.map(async (commit: Commit) => {
            try {
              const detailResponse = await fetch(
                `https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits/${commit.sha}`
              );
              
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                return { ...commit, files: detailData.files };
              }
              
              return commit;
            } catch (error) {
              console.error(`Error fetching details for commit ${commit.sha}:`, error);
              return commit;
            }
          })
        );
        
        setCommits(commitsWithFiles);
      } catch (err) {
        console.error("Error fetching commits:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch commits");
      } finally {
        setLoading(false);
      }
    }

    fetchCommits();
  }, []);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Import necessary components
  const { Accordion, AccordionItem, AccordionTrigger, AccordionContent } = require("../../components/ui/accordion");
  
  // Function to format file status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "added":
        return "text-green-500";
      case "removed":
        return "text-red-500";
      case "modified":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };
  
  // Prepare timeline data from commits
  const timelineData = commits.map((commit, index) => ({
    title: formatDate(commit.commit.author.date),
    content: (
      <div className="space-y-4">
        <div className="flex gap-2 items-start">
          <GitCommit className="mt-1 text-cyan-500 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">{commit.commit.message}</p>
            <div className="flex gap-2 items-center text-sm text-gray-500 dark:text-gray-400">
              <span>by {commit.author?.login || commit.commit.author.name}</span>
              {commit.author?.avatar_url && (
                <img
                  src={commit.author.avatar_url}
                  alt={`${commit.author.login}'s avatar`}
                  className="w-6 h-6 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center text-sm">
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-1 items-center text-cyan-500 transition-colors hover:text-cyan-600"
          >
            <ExternalLink size={14} />
            <span>View on GitHub</span>
          </a>
          <span className="text-gray-500 dark:text-gray-400">SHA: {commit.sha.substring(0, 7)}</span>
        </div>
        
        {/* File changes accordion */}
        {commit.files && commit.files.length > 0 && (
          <Accordion className="mt-2">
            <AccordionItem value={`files-${index}`} className="border-none">
              <AccordionTrigger className="px-3 py-2 text-sm bg-gray-50 rounded-md dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <span className="flex gap-2 items-center">
                  <span>Files changed ({commit.files.length})</span>
                  <span className="px-2 py-1 text-xs bg-gray-200 rounded-full dark:bg-gray-700">
                    +{commit.files.reduce((sum, file) => sum + (file.additions || 0), 0)}{" "}
                    -{commit.files.reduce((sum, file) => sum + (file.deletions || 0), 0)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1">
                <div className="overflow-y-auto p-1 space-y-2 max-h-60">
                  {commit.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="p-2 text-sm bg-gray-50 rounded-md dark:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs break-all">{file.filename}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(file.status)} bg-opacity-10`}>
                          {file.status}
                        </span>
                      </div>
                      {(file.additions > 0 || file.deletions > 0) && (
                        <div className="flex gap-2 items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="text-green-500">+{file.additions}</span>
                          <span className="text-red-500">-{file.deletions}</span>
                          <span>({file.changes} changes)</span>
                        </div>
                      )}
                      {file.patch && (
                        <div className="overflow-x-auto p-2 mt-2 bg-gray-100 rounded dark:bg-gray-900">
                          <pre className="font-mono text-xs whitespace-pre-wrap">{file.patch}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    ),
  }));

  return (
    <div className="container px-4 py-12 mx-auto">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">Project Changelog</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Recent updates and changes to the go-convex-telegram-turborepo project
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex gap-2 items-center mb-4">
            <GitBranch className="text-cyan-500" />
            <h2 className="text-2xl font-semibold">main branch</h2>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading commit history...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-red-500">{error}</p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Unable to fetch commit history. Please try again later.
              </p>
            </div>
          ) : commits.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 dark:text-gray-400">No commits found.</p>
            </div>
          ) : (
            <Timeline 
              data={timelineData} 
              titleSize="small"
              compact={true}
              spacing="tight"
              lineColor="cyan-500"
              dotColor="gray-700"
            />
          )}
        </Card>

        <div className="text-sm text-center text-gray-500 dark:text-gray-400">
          <p>
            Data fetched from the{" "}
            <a
              href="https://github.com/kessenma/go-convex-telegram-turborepo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              GitHub Repository
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}