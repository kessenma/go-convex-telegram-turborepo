"use client";

import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";

interface ConversionJob {
  _id: string;
  jobId: string;
  jobType: string;
  status: string;
  documentId?: string;
  inputText?: string;
  outputData?: unknown;
  errorMessage?: string;
  processingTimeMs?: number;
  llmModel?: string;
  embeddingDimensions?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  requestSource: string;
  userId?: string;
}

interface ConversionStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
  pendingJobs: number;
  averageProcessingTime: number;
  jobsByType: Record<string, number>;
}

const ConversionHistory: React.FC = () => {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ConversionJob | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    jobType: "",
  });

  const fetchJobs = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.jobType && { jobType: filters.jobType }),
      });

      const response = await fetch(`/api/conversion-jobs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversion jobs");
      }

      const data = await response.json();

      if (reset) {
        setJobs(data.jobs || []);
      } else {
        setJobs((prev) => [...prev, ...(data.jobs || [])]);
      }

      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/conversion-jobs/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch conversion job stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchJobs(1, true);
    fetchStats();
  }, [fetchJobs, fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case "embedding":
        return "text-purple-600 bg-purple-100";
      case "similarity":
        return "text-indigo-600 bg-indigo-100";
      case "search":
        return "text-teal-600 bg-teal-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalJobs}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {stats.completedJobs}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {stats.failedJobs}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {formatProcessingTime(stats.averageProcessingTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Time</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-3 py-2 text-sm rounded-md border border-gray-300"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Job Type
            </label>
            <select
              value={filters.jobType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, jobType: e.target.value }))
              }
              className="px-3 py-2 text-sm rounded-md border border-gray-300"
            >
              <option value="">All Types</option>
              <option value="embedding">Embedding</option>
              <option value="similarity">Similarity</option>
              <option value="search">Search</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Conversion History
          </h3>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getJobTypeColor(job.jobType)}`}
                    >
                      {job.jobType}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                    {job.llmModel && (
                      <span className="text-xs text-gray-500">
                        {job.llmModel}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">
                      Job ID: {job.jobId.slice(0, 8)}...
                    </p>
                    {job.inputText && (
                      <p className="mt-1 text-sm text-gray-600 truncate">
                        {job.inputText}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {formatDate(job.createdAt)}
                  </p>
                  {job.processingTimeMs && (
                    <p className="text-sm text-gray-600">
                      {formatProcessingTime(job.processingTimeMs)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="p-6 text-center">
            <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-6 text-center">
            <button
              onClick={() => fetchJobs(page + 1)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Job Details
                  </h3>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Job ID
                    </label>
                    <p className="font-mono text-sm text-gray-900">
                      {selectedJob.jobId}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getJobTypeColor(selectedJob.jobType)}`}
                      >
                        {selectedJob.jobType}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedJob.status)}`}
                      >
                        {selectedJob.status}
                      </span>
                    </div>
                  </div>

                  {selectedJob.inputText && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Input Text
                      </label>
                      <p className="p-3 text-sm text-gray-900 bg-gray-50 rounded-md">
                        {selectedJob.inputText}
                      </p>
                    </div>
                  )}

                  {selectedJob.outputData ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Output Data
                      </label>
                      <pre className="overflow-x-auto p-3 text-sm text-gray-900 bg-gray-50 rounded-md">
                        {JSON.stringify(selectedJob.outputData, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  {selectedJob.errorMessage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Error Message
                      </label>
                      <p className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        {selectedJob.errorMessage}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Created At
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedJob.createdAt)}
                      </p>
                    </div>
                    {selectedJob.processingTimeMs && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Processing Time
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatProcessingTime(selectedJob.processingTimeMs)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedJob.llmModel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Model
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedJob.llmModel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversionHistory;
