"use client";

import React, { useEffect, useState } from "react";
import { Mail, Send, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";
import AdminButton from "@/components/AdminButton";

interface Newsletter {
  id: string;
  subject: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  sentAt: string;
  createdAt: string;
}

interface SubscriberStats {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

interface HistoryPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function NewsletterPage() {
  // State
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [history, setHistory] = useState<Newsletter[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<HistoryPagination | null>(null);

  // Fetch subscriber stats
  useEffect(() => {
    fetchSubscriberStats();
  }, []);

  // Fetch history
  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  const fetchSubscriberStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch("/api/admin/newsletter/subscribers");
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscriber stats");
      }

      const data = await response.json();
      setSubscriberStats(data);
    } catch (error) {
      console.error("Failed to fetch subscriber stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);

      const response = await fetch(
        `/api/admin/newsletter/history?page=${historyPage}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch newsletter history");
      }

      const data = await response.json();
      setHistory(data.newsletters);
      setHistoryPagination(data.pagination);
    } catch (error) {
      setHistoryError("Failed to load newsletter history");
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim()) {
      setSendError("Subject and content are required");
      return;
    }

    if (!subscriberStats || subscriberStats.activeCount === 0) {
      setSendError("No active subscribers to send to");
      return;
    }

    try {
      setSending(true);
      setSendError(null);
      setSendSuccess(null);

      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          content: content.trim(),
          previewText: previewText.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send newsletter");
      }

      setSendSuccess(data.message);
      
      // Clear form
      setSubject("");
      setContent("");
      setPreviewText("");

      // Refresh history
      setHistoryPage(1);
      fetchHistory();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Newsletter</h1>
        <p className="text-slate-600">Compose and send newsletters to your subscribers</p>
      </div>

      {/* Subscriber Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Subscribers</p>
              <p className="text-3xl font-bold text-slate-900">
                {loadingStats ? "..." : subscriberStats?.totalCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Active Subscribers</p>
              <p className="text-3xl font-bold text-green-600">
                {loadingStats ? "..." : subscriberStats?.activeCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-slate-400">
                {loadingStats ? "..." : subscriberStats?.inactiveCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Compose Newsletter */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Compose Newsletter</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Success/Error Messages */}
          {sendSuccess && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{sendSuccess}</p>
              </div>
              <button
                onClick={() => setSendSuccess(null)}
                className="text-green-600 hover:text-green-700"
              >
                ×
              </button>
            </div>
          )}

          {sendError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{sendError}</p>
              </div>
              <button
                onClick={() => setSendError(null)}
                className="text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Preview Text */}
          <div>
            <label htmlFor="previewText" className="block text-sm font-medium text-slate-700 mb-2">
              Preview Text <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="previewText"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Text shown in email preview"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
              Content (HTML) *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter HTML content or plain text..."
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Supports HTML formatting. Basic tags: &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;
            </p>
          </div>

          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Will be sent to <strong>{subscriberStats?.activeCount || 0}</strong> active subscribers
            </p>
            <AdminButton
              type="submit"
              variant="primary"
              disabled={sending || !subscriberStats || subscriberStats.activeCount === 0}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Newsletter"}
            </AdminButton>
          </div>
        </form>
      </div>

      {/* Sent History */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Sent History</h2>
          </div>
          {historyPagination && (
            <p className="text-sm text-slate-600">
              {historyPagination.totalCount} total
            </p>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading history...</p>
          </div>
        ) : historyError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{historyError}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No newsletters sent yet</p>
          </div>
        ) : (
          <>
                <AdminCard className="p-0">
              <AdminTable
                header={
                  <tr className="border-b border-slate-200">
                    {['Subject','Sent To','Opens','Clicks','Sent At'].map(col=> (
                      <th key={col} className="py-3 px-4 text-sm font-semibold text-slate-700 text-left">{col}</th>
                    ))}
                  </tr>
                }
              >
                {history.map((newsletter) => (
                  <tr key={newsletter.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{newsletter.subject}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{newsletter.sentCount}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{newsletter.openCount}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{newsletter.clickCount}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(newsletter.sentAt)}</td>
                  </tr>
                ))}
              </AdminTable>
            </AdminCard>

            {/* Pagination */}
            {historyPagination && historyPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                    <AdminButton
                  variant="secondary"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                >
                  Previous
                </AdminButton>
                <span className="text-sm text-slate-600">
                  Page {historyPage} of {historyPagination.totalPages}
                </span>
                <AdminButton
                  variant="secondary"
                  onClick={() => setHistoryPage((p) => Math.min(historyPagination.totalPages, p + 1))}
                  disabled={historyPage === historyPagination.totalPages}
                >
                  Next
                </AdminButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
