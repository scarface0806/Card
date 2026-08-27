'use client';

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

// Generic data table row type - accept any object
type TableRow = object;

interface ColumnConfig<T extends TableRow = TableRow> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T extends TableRow = TableRow> {
  columns: ColumnConfig<T>[];
  data: T[];
  title?: string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
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
    label: string | ((row: T) => string);
    onClick: (row: T) => void;
    tone?: 'neutral' | 'warning' | 'danger' | 'success';
    visible?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
  }>;
  itemsPerPage?: number;
  actions?: boolean;
}

export default function DataTable<T extends TableRow = TableRow>({
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
}: DataTableProps<T>) {
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
      return mobile ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-red-400 hover:bg-red-400/10';
    }
    if (tone === 'warning') {
      return mobile ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-400 hover:bg-amber-400/10';
    }
    if (tone === 'success') {
      return mobile ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-green-400 hover:bg-green-400/10';
    }
    if (tone === 'info') {
      return mobile ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-blue-400 hover:bg-blue-400/10';
    }
    return mobile ? 'text-gray-300 bg-white/5 hover:bg-white/10' : 'text-gray-400 hover:bg-white/10';
  };

  return (
    <div className="bg-gradient-to-b from-[#0f172a]/50 to-[#020617]/50 border border-white/10 rounded-lg overflow-hidden shadow-lg">
      {title && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <span className="text-xs text-[#9ca3af] bg-white/5 px-3 py-1 rounded-md border border-white/10">
            {data.length} records
          </span>
        </div>
      )}

      <div className="md:hidden divide-y divide-white/10">
        {currentData.length > 0 ? (
          currentData.map((row, rowIndex) => (
            <div key={rowIndex} className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors duration-150">
              <div className="grid grid-cols-1 gap-3">
                {columns.map((column) => {
                  const rowRecord = row as Record<string, any>;
                  return (
                  <div key={`${rowIndex}-${column.key}`} className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">{column.label}</p>
                    <div className="text-sm text-right text-gray-300 max-w-[65%] break-words font-medium">
                      {column.render ? column.render(rowRecord[column.key], row) : rowRecord[column.key]}
                    </div>
                  </div>
                );})}
              </div>

              {actions && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.view ?? 'info', true)}`}
                    >
                      {actionLabels?.view || 'View'}
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.edit ?? 'warning', true)}`}
                    >
                      {actionLabels?.edit || 'Edit'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.delete ?? 'danger', true)}`}
                    >
                      {actionLabels?.delete || 'Delete'}
                    </button>
                  )}
                  {(extraActions || []).filter((action) => action.visible ? action.visible(row) : true).map((action) => {
                    const toneClass = action.tone === 'danger'
                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                      : action.tone === 'warning'
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : action.tone === 'success'
                          ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
                          : 'text-gray-300 bg-white/5 hover:bg-white/10';

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
                <Database className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm text-[#9ca3af] font-medium tracking-tight">No records found</p>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal scroll is a fallback, not the normal case. The thumb is
          styled so it reads as part of the dark UI when it does appear. */}
      <div className="hidden md:block overflow-x-auto [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.16] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
        <table
          className="w-full"
          /* The floor scales with column count instead of being a flat 760px,
             which forced narrow tables (e.g. a 2-column Metric/Value table in a
             half-width container) to scroll their own columns out of view.
             Capped at 760px so wide tables keep exactly their old behaviour;
             per-column content width still wins where it needs more room. */
          style={{ minWidth: Math.min(760, (columns.length + (actions ? 1 : 0)) * 110) }}
        >
          <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#0f172a] to-[#0a0e1a] border-b border-white/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                    }`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
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
                  className="hover:bg-white/[0.05] transition-colors duration-150 group"
                >
                  {columns.map((column) => {
                    const rowRecord = row as Record<string, any>;
                    return (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`px-6 py-4 text-sm text-gray-300 font-medium ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                        }`}
                    >
                      {column.render
                        ? column.render(rowRecord[column.key], row)
                        : rowRecord[column.key]}
                    </td>
                  );})}
                  {actions && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.view ?? 'info', false)}`}
                          >
                            {actionLabels?.view || 'View'}
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.edit ?? 'warning', false)}`}
                          >
                            {actionLabels?.edit || 'Edit'}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-95 ${resolveToneClass(actionTones?.delete ?? 'danger', false)}`}
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
                                ? 'text-green-400 hover:bg-green-400/10'
                                : 'text-gray-400 hover:bg-white/10';

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
                      <Database className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-sm text-[#9ca3af] font-medium tracking-tight">No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0d1117]/30">
          <p className="text-xs text-[#9ca3af] font-medium">
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
                    /* bg-primary / shadow-primary-glow were dead classes: they
                       only exist in tailwind.config.ts, which Tailwind v4 never
                       loads, so the current page had no background at all. */
                    ? 'bg-green-500 text-black active:scale-95'
                    : 'text-[#9ca3af] hover:bg-white/5 hover:text-white'
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
