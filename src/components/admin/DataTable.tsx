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
  actionLabels?: {
    view?: string;
    edit?: string;
    delete?: string;
  };
  actionTones?: {
    view?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    edit?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    delete?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  };
  extraActions?: Array<{
    key: string;
    label: string | ((row: any) => string);
    onClick: (row: any) => void;
    tone?: 'neutral' | 'warning' | 'danger' | 'success';
    visible?: (row: any) => boolean;
    disabled?: (row: any) => boolean;
  }>;
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
  actionLabels,
  actionTones,
  extraActions,
  itemsPerPage = 10,
  actions = true,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const resolveToneClass = (
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | undefined,
    mobile: boolean
  ) => {
    if (tone === 'danger') {
      return mobile ? 'text-red-300 bg-red-500/10 hover:bg-red-500/20' : 'text-red-400 hover:bg-red-400/10';
    }
    if (tone === 'warning') {
      return mobile ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-400 hover:bg-amber-400/10';
    }
    if (tone === 'success') {
      return mobile ? 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-emerald-400 hover:bg-emerald-400/10';
    }
    if (tone === 'info') {
      return mobile ? 'text-blue-300 bg-blue-500/10 hover:bg-blue-500/20' : 'text-blue-400 hover:bg-blue-400/10';
    }
    return mobile ? 'text-gray-200 bg-white/10 hover:bg-white/15' : 'text-gray-300 hover:bg-white/10';
  };

  return (
    <div className="bg-[#141d31] border border-white/10 rounded-2xl overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
      {title && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
            {data.length} records
          </span>
        </div>
      )}

      <div className="md:hidden divide-y divide-white/10">
        {currentData.length > 0 ? (
          currentData.map((row, rowIndex) => (
            <div key={rowIndex} className="p-4 space-y-3 bg-white/[0.01]">
              <div className="grid grid-cols-1 gap-2">
                {columns.map((column) => (
                  <div key={`${rowIndex}-${column.key}`} className="flex items-start justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 pt-0.5">{column.label}</p>
                    <div className="text-sm text-right text-gray-200 max-w-[65%] break-words">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </div>
                  </div>
                ))}
              </div>

              {actions && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.view ?? 'info', true)}`}
                    >
                      {actionLabels?.view || 'View'}
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.edit ?? 'warning', true)}`}
                    >
                      {actionLabels?.edit || 'Edit'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.delete ?? 'danger', true)}`}
                    >
                      {actionLabels?.delete || 'Delete'}
                    </button>
                  )}
                  {(extraActions || []).filter((action) => action.visible ? action.visible(row) : true).map((action) => {
                    const toneClass = action.tone === 'danger'
                      ? 'text-red-300 bg-red-500/10 hover:bg-red-500/20'
                      : action.tone === 'warning'
                        ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                        : action.tone === 'success'
                          ? 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'text-gray-200 bg-white/10 hover:bg-white/15';

                    return (
                      <button
                        key={action.key}
                        onClick={() => action.onClick(row)}
                        disabled={action.disabled ? action.disabled(row) : false}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${toneClass}`}
                      >
                        {typeof action.label === 'function' ? action.label(row) : action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-16 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500 font-medium tracking-tight">No records found</p>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-[#1e2440] border-b border-white/5">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
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
          <tbody className="divide-y divide-white/10">
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-white/[0.03] transition-colors duration-150 group"
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.view ?? 'info', false)}`}
                          >
                            {actionLabels?.view || 'View'}
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.edit ?? 'warning', false)}`}
                          >
                            {actionLabels?.edit || 'Edit'}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.delete ?? 'danger', false)}`}
                          >
                            {actionLabels?.delete || 'Delete'}
                          </button>
                        )}
                        {(extraActions || []).filter((action) => action.visible ? action.visible(row) : true).map((action) => {
                          const toneClass = action.tone === 'danger'
                            ? 'text-red-400 hover:bg-red-400/10'
                            : action.tone === 'warning'
                              ? 'text-amber-400 hover:bg-amber-400/10'
                              : action.tone === 'success'
                                ? 'text-emerald-400 hover:bg-emerald-400/10'
                                : 'text-gray-300 hover:bg-white/10';

                          return (
                            <button
                              key={action.key}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled ? action.disabled(row) : false}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${toneClass}`}
                            >
                              {typeof action.label === 'function' ? action.label(row) : action.label}
                            </button>
                          );
                        })}
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
        <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0d1117]/30">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="text-gray-300">{startIndex + 1}</span> to{' '}
            <span className="text-gray-300">{Math.min(endIndex, data.length)}</span> of{' '}
            <span className="text-gray-300">{data.length}</span> records
          </p>
          <div className="flex items-center gap-1 overflow-x-auto">
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
