"use client";

import { useEffect, useState, useCallback } from "react";
import { GitCommit, GitBranch, ExternalLink, Loader2 } from "lucide-react";
import { Timeline } from "../ui/timeline";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";

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
}

interface ChainLogCardProps {
  maxCommits?: number;
  className?: string;
  showTitle?: boolean;
}

export function ChainLogCard({ maxCommits = 5, className = "", showTitle = false }: ChainLogCardProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [commitFiles, setCommitFiles] = useState<Record<string, CommitFile[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchCommits() {
      try {
        setLoading(true);
        setError(null);

        // GitHub API endpoint for commits - only fetch basic commit info
        const response = await fetch(
          `https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits?per_page=${maxCommits}`
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const commitsData = await response.json();
        setCommits(commitsData);
      } catch (err) {
        console.error("Error fetching commits:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch commits");
      } finally {
        setLoading(false);
      }
    }

    fetchCommits();
  }, [maxCommits]);

  // Function to fetch file details for a specific commit
  const fetchCommitFiles = useCallback(async (sha: string) => {
    if (commitFiles[sha] || loadingFiles[sha]) return;
    
    try {
      setLoadingFiles(prev => ({ ...prev, [sha]: true }));
      
      const detailResponse = await fetch(
        `https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits/${sha}`
      );
      
      if (!detailResponse.ok) {
        throw new Error(`GitHub API error: ${detailResponse.status}`);
      }
      
      const detailData = await detailResponse.json();
      setCommitFiles(prev => ({ ...prev, [sha]: detailData.files || [] }));
    } catch (error) {
      console.error(`Error fetching details for commit ${sha}:`, error);
    } finally {
      setLoadingFiles(prev => ({ ...prev, [sha]: false }));
    }
  }, [commitFiles, loadingFiles]);
  
  // Handle accordion value change
  const handleAccordionChange = useCallback((value: string | null) => {
    setExpandedAccordion(value);
    
    if (value) {
      const [_, commitIndex] = value.split('-');
      const commit = commits[parseInt(commitIndex)];
      if (commit) {
        fetchCommitFiles(commit.sha);
      }
    }
  }, [commits, fetchCommitFiles]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
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
  const timelineData = commits.map((commit, index) => {
    const files = commitFiles[commit.sha] || [];
    const isLoading = loadingFiles[commit.sha] || false;
    const accordionId = `files-${index}`;
    const isExpanded = expandedAccordion === accordionId;
    
    return {
      title: formatDate(commit.commit.author.date),
      content: (
        <div className="space-y-3">
          <div className="flex gap-2 items-start">
            <GitCommit className="mt-1 text-cyan-500 shrink-0" size={16} />
            <div className="space-y-1">
              <p className="text-sm font-medium">{commit.commit.message}</p>
              <div className="flex gap-2 items-center text-xs text-gray-500 dark:text-gray-400">
                <span>by {commit.author?.login || commit.commit.author.name}</span>
                {commit.author?.avatar_url && (
                  <img
                    src={commit.author.avatar_url}
                    alt={`${commit.author.login}'s avatar`}
                    className="w-5 h-5 rounded-full"
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 items-center text-xs">
            <a
              href={commit.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 items-center text-cyan-500 transition-colors hover:text-cyan-600"
            >
              <ExternalLink size={12} />
              <span>View on GitHub</span>
            </a>
            <span className="text-gray-500 dark:text-gray-400">SHA: {commit.sha.substring(0, 7)}</span>
          </div>
          
          {/* File changes accordion */}
          <Accordion 
            className="mt-1" 
            expandedValue={expandedAccordion}
            onValueChange={handleAccordionChange}
          >
            <AccordionItem value={accordionId} className="border-none">
              <AccordionTrigger className="px-2 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700">
                <span className="flex gap-2 items-center">
                  <span>Files changed {isExpanded && files.length > 0 ? `(${files.length})` : ''}</span>
                  {isExpanded && files.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      +{files.reduce((sum, file) => sum + (file.additions || 0), 0)}{" "}
                      -{files.reduce((sum, file) => sum + (file.deletions || 0), 0)}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1">
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    <span className="ml-2 text-xs text-gray-500">Loading file changes...</span>
                  </div>
                ) : files.length > 0 ? (
                  <div className="overflow-y-auto p-1 space-y-2 max-h-40">
                    {files.map((file, fileIndex) => (
                      <div key={fileIndex} className="p-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800">
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
                          <div className="overflow-x-auto p-1 mt-2 rounded bg-slate-100 dark:bg-slate-900">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-[10px]">{file.patch}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-xs text-center text-gray-500">
                    No file changes available for this commit.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
    };
  });

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading commit history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Unable to fetch commit history.
        </p>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No commits found.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex gap-2 items-center mb-3">
          <GitBranch className="text-cyan-500" size={16} />
          <h3 className="text-sm font-semibold">Recent Changes</h3>
        </div>
      )}

      <Timeline 
        data={timelineData} 
        titleSize="small"
        compact={true}
        spacing="tight"
        lineColor="cyan-500"
        dotColor="gray-700"
      />
      
      <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
        <a
          href="https://github.com/kessenma/go-convex-telegram-turborepo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-500 hover:underline"
        >
          View Repository
        </a>
      </div>
    </div>
  );
}