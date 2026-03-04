"use client";

import React, { useEffect, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import AdminContainer from "@/components/AdminContainer";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";
import AdminButton from "@/components/AdminButton";
import AdminInput from "@/components/AdminInput";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  isActive: boolean;
  totalOrders: number;
  totalCards: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/customers?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading customers");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      setToggling(customer.id);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update customer");
      }

      setSuccessMessage(
        `${customer.name || customer.email} is now ${
          !customer.isActive ? "active" : "inactive"
        }.`
      );
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating customer");
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage customer accounts and status
            </p>
          </div>
          <AdminButton onClick={fetchCustomers} variant="secondary" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </AdminButton>
        </div>

        {/* Success State */}
        {successMessage && (
          <AdminCard className="bg-emerald-50 border-emerald-200 text-emerald-700">
            {successMessage}
          </AdminCard>
        )}

        {/* Error State */}
        {error && (
          <AdminCard className="bg-red-50 border-red-200 text-red-700">
            {error}
          </AdminCard>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading customers...</div>
          </div>
        )}

        {/* Customers Table */}
        {!loading && customers.length > 0 && (
          <AdminCard className="p-0">
            <AdminTable
              header={
                <tr>
                  {['Name','Email','Orders','Cards','Status','Join Date','Actions'].map(col=>(
                    <th key={col} className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {col}
                    </th>
                  ))}
                </tr>
              }
            >
              {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {customer.name || "Unnamed"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.totalOrders}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.totalCards}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AdminButton
                        variant="ghost"
                        onClick={() => handleToggleStatus(customer)}
                        disabled={toggling === customer.id}
                        className="disabled:opacity-50 px-0"
                      >
                        {customer.isActive ? (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">
                            Inactive
                          </span>
                        )}
                      </AdminButton>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AdminButton
                        variant="ghost"
                        onClick={() => setSelectedCustomer(customer)}
                        title="View details"
                        className="p-0"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </AdminButton>
                    </td>
                  </tr>
                ))}
            </AdminTable>
          </AdminCard>
        )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <div className="text-slate-600">No customers found</div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * pagination.limit + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} customers
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
              onClick={() =>
                setPage(Math.min(pagination.totalPages, page + 1))
              }
              disabled={page >= pagination.totalPages}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Customer Details
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">Name:</span> {selectedCustomer.name || "Unnamed"}
              </div>
              <div>
                <span className="text-slate-500">Email:</span> {selectedCustomer.email}
              </div>
              <div>
                <span className="text-slate-500">Orders:</span> {selectedCustomer.totalOrders}
              </div>
              <div>
                <span className="text-slate-500">Cards:</span> {selectedCustomer.totalCards}
              </div>
              <div>
                <span className="text-slate-500">Status:</span> {selectedCustomer.isActive ? "Active" : "Inactive"}
              </div>
              <div>
                <span className="text-slate-500">Joined:</span> {formatDate(selectedCustomer.createdAt)}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <AdminButton
                variant="secondary"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminContainer>
  );
}
