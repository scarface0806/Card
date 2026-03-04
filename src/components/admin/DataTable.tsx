'use client';

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps {
  columns: ColumnConfig[];
  data: any[];
  title?: string;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  itemsPerPage?: number;
  actions?: boolean;
}

export default function DataTable({
  columns,
  data,
  title,
  onView,
  onEdit,
  onDelete,
  itemsPerPage = 10,
  actions = true,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="bg-[#161b2e] border border-white/5 rounded-xl overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
            {data.length} records
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1e2440] border-b border-white/5">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                    }`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-white/[0.02] transition-colors duration-150 group"
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`px-5 py-4 text-sm text-gray-300 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                        }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-400/10 transition-all active:scale-95"
                          >
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-400/10 transition-all active:scale-95"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-400/10 transition-all active:scale-95"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-gray-700" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between bg-[#0d1117]/30">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="text-gray-300">{startIndex + 1}</span> to{' '}
            <span className="text-gray-300">{Math.min(endIndex, data.length)}</span> of{' '}
            <span className="text-gray-300">{data.length}</span> records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-gray-400 hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${page === currentPage
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-gray-400 hover:text-white transition-all active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
