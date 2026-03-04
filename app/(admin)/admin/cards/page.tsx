"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Copy, Edit2, ExternalLink, RefreshCw } from "lucide-react";
import AdminButton from "@/components/AdminButton";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";

interface SocialLinks {
  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  github?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  snapchat?: string | null;
}

interface CardDetail {
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  socialLinks?: SocialLinks | null;
}

interface CardItem {
  id: string;
  slug: string;
  cardType: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
  details: CardDetail | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EditFormState {
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  socialLinks: SocialLinks;
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: "",
    designation: "",
    email: "",
    phone: "",
    socialLinks: {},
  });

  useEffect(() => {
    fetchCards();
  }, [page]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/cards?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }

      const data = await response.json();
      setCards(data.cards || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading cards");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (card: CardItem) => {
    try {
      setToggling(card.id);
      setSuccessMessage(null);

      const nextStatus = card.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const response = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update card status");
      }

      setSuccessMessage(`Card ${card.slug} is now ${nextStatus}.`);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setToggling(null);
    }
  };

  const handleCopyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/card/${slug}`;
      await navigator.clipboard.writeText(url);
      setSuccessMessage("Card link copied to clipboard.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy link");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const customerName = (card: CardItem) => {
    const details = card.details;
    const name = [details?.firstName, details?.lastName].filter(Boolean).join(" ");
    return name || card.user?.name || card.user?.email || "Unknown";
  };

  const openEditModal = (card: CardItem) => {
    const details = card.details;
    const fullName = [details?.firstName, details?.lastName]
      .filter(Boolean)
      .join(" ");

    setEditForm({
      fullName: fullName || "",
      designation: details?.title || "",
      email: details?.email || card.user?.email || "",
      phone: details?.phone || "",
      socialLinks: details?.socialLinks || {},
    });
    setSelectedCard(card);
  };

  const handleSaveDetails = async () => {
    if (!selectedCard) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/cards/${selectedCard.id}/detail`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName,
          designation: editForm.designation,
          phone: editForm.phone,
          email: editForm.email,
          socialLinks: editForm.socialLinks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update card details");
      }

      setSuccessMessage("Card details updated successfully.");
      setSelectedCard(null);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating details");
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = useMemo(() => {
    return (status: string) => {
      if (status === "ACTIVE") return "bg-green-100 text-green-700";
      if (status === "INACTIVE") return "bg-slate-100 text-slate-700";
      if (status === "PENDING") return "bg-yellow-100 text-yellow-700";
      if (status === "EXPIRED") return "bg-red-100 text-red-700";
      return "bg-slate-100 text-slate-700";
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cards</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage customer cards and profiles
          </p>
        </div>
        <AdminButton
          variant="secondary"
          onClick={fetchCards}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </AdminButton>
      </div>

      {/* Success State */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading cards...</div>
        </div>
      )}

      {/* Cards Table */}
      {!loading && cards.length > 0 && (
        <AdminCard className="p-0">
          <AdminTable
            header={
              <tr>
                {['Customer','Slug','Template','Status','Created','Actions'].map(col=>(
                  <th key={col} className="px-6 py-3">{col}</th>
                ))}
              </tr>
            }
          >
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                  {customerName(card)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {card.slug}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {card.cardType || "Standard"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <AdminButton
                    variant="ghost"
                    onClick={() => handleToggleStatus(card)}
                    disabled={toggling === card.id}
                    className="disabled:opacity-50 px-0"
                  >
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs ${statusBadgeClass(card.status)}`}
                    >
                      {card.status}
                    </span>
                  </AdminButton>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(card.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <AdminButton
                      variant="ghost"
                      onClick={() => openEditModal(card)}
                      title="Edit details"
                      className="p-0"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => handleCopyLink(card.slug)}
                      title="Copy link"
                      className="p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </AdminButton>
                    <a
                      href={`/card/${card.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <AdminButton variant="ghost" className="p-0" title="Open live card">
                        <ExternalLink className="h-4 w-4" />
                      </AdminButton>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      )}

      {/* Empty State */}
      {!loading && cards.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <div className="text-slate-600">No cards found</div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * pagination.limit + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} cards
          </div>
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Edit Card Details
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-slate-600">Full Name</label>
                <input
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Designation</label>
                <input
                  value={editForm.designation}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, designation: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">LinkedIn</label>
                <input
                  value={editForm.socialLinks.linkedin || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Twitter</label>
                <input
                  value={editForm.socialLinks.twitter || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Instagram</label>
                <input
                  value={editForm.socialLinks.instagram || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">YouTube</label>
                <input
                  value={editForm.socialLinks.youtube || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">GitHub</label>
                <input
                  value={editForm.socialLinks.github || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">WhatsApp</label>
                <input
                  value={editForm.socialLinks.whatsapp || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, whatsapp: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCard(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
