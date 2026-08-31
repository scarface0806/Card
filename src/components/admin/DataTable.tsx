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
    // Mobile rows sit on a flat card, so their actions carry a filled
    // background; desktop rows already have a hover band behind them.
    const filled = mobile ? ' bg-[rgba(241,243,241,0.05)]' : '';
    if (tone === 'danger') return 'tv-adm-action--danger' + filled;
    if (tone === 'warning') return 'tv-adm-action--brass' + filled;
    if (tone === 'success') return 'tv-adm-action--patina' + filled;
    if (tone === 'info') return 'tv-adm-action--patina' + filled;
    return filled.trim();
  };

  return (
    <div className="tv-adm-panel overflow-hidden">
      {title && (
        <div className="tv-adm-panel-head">
          <h3 className="tv-adm-panel-title">{title}</h3>
          <span className="tv-adm-count">
            {data.length} records
          </span>
        </div>
      )}

      <div className="md:hidden divide-y divide-[var(--tv-rule)]">
        {currentData.length > 0 ? (
          currentData.map((row, rowIndex) => (
            <div key={rowIndex} className="p-4 space-y-3 transition-colors duration-150 hover:bg-[rgba(241,243,241,0.03)]">
              <div className="grid grid-cols-1 gap-3">
                {columns.map((column) => {
                  const rowRecord = row as Record<string, any>;
                  return (
                  <div key={`${rowIndex}-${column.key}`} className="flex items-start justify-between gap-3">
                    <p className="tv-adm-label">{column.label}</p>
                    <div className="max-w-[65%] break-words text-right text-sm text-[var(--tv-text)]">
                      {column.render ? column.render(rowRecord[column.key], row) : rowRecord[column.key]}
                    </div>
                  </div>
                );})}
              </div>

              {actions && (
                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--tv-rule)] pt-3">
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      className={`tv-adm-action ${resolveToneClass(actionTones?.view ?? 'info', true)}`}
                    >
                      {actionLabels?.view || 'View'}
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className={`tv-adm-action ${resolveToneClass(actionTones?.edit ?? 'warning', true)}`}
                    >
                      {actionLabels?.edit || 'Edit'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className={`tv-adm-action ${resolveToneClass(actionTones?.delete ?? 'danger', true)}`}
                    >
                      {actionLabels?.delete || 'Delete'}
                    </button>
                  )}
                  {(extraActions || []).filter((action) => action.visible ? action.visible(row) : true).map((action) => {
                    const toneClass = resolveToneClass(action.tone, true);

                    return (
                      <button
                        key={action.key}
                        onClick={() => action.onClick(row)}
                        disabled={action.disabled ? action.disabled(row) : false}
                        className={`tv-adm-action ${toneClass}`}
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
            <div className="tv-adm-empty !py-0">
              <div className="tv-adm-empty-icon">
                <Database className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="tv-adm-meta">No records found</p>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal scroll is a fallback, not the normal case. The thumb is
          styled so it reads as part of the dark UI when it does appear. */}
      <div className="hidden md:block overflow-x-auto [scrollbar-color:rgba(241,243,241,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(241,243,241,0.16)] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
        <table
          className="tv-adm-table"
          /* The floor scales with column count instead of being a flat 760px,
             which forced narrow tables (e.g. a 2-column Metric/Value table in a
             half-width container) to scroll their own columns out of view.
             Capped at 760px so wide tables keep exactly their old behaviour;
             per-column content width still wins where it needs more room. */
          style={{ minWidth: Math.min(760, (columns.length + (actions ? 1 : 0)) * 110) }}
        >
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : undefined}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody >
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="group"
                >
                  {columns.map((column) => {
                    const rowRecord = row as Record<string, any>;
                    return (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : undefined}
                    >
                      {column.render
                        ? column.render(rowRecord[column.key], row)
                        : rowRecord[column.key]}
                    </td>
                  );})}
                  {actions && (
                    <td >
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className={`tv-adm-action ${resolveToneClass(actionTones?.view ?? 'info', false)}`}
                          >
                            {actionLabels?.view || 'View'}
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className={`tv-adm-action ${resolveToneClass(actionTones?.edit ?? 'warning', false)}`}
                          >
                            {actionLabels?.edit || 'Edit'}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className={`tv-adm-action ${resolveToneClass(actionTones?.delete ?? 'danger', false)}`}
                          >
                            {actionLabels?.delete || 'Delete'}
                          </button>
                        )}
                        {(extraActions || []).filter((action) => action.visible ? action.visible(row) : true).map((action) => {
                          const toneClass = resolveToneClass(action.tone, false);

                          return (
                            <button
                              key={action.key}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled ? action.disabled(row) : false}
                              className={`tv-adm-action ${toneClass}`}
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
                  className="text-center"
                >
                  <div className="tv-adm-empty !py-0">
                    <div className="tv-adm-empty-icon">
                      <Database className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="tv-adm-meta">No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="tv-adm-dialog-foot flex-col !py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="tv-adm-meta text-xs">
            Showing <span className="text-[var(--tv-text)] tabular-nums">{startIndex + 1}</span> to{' '}
            <span className="text-[var(--tv-text)] tabular-nums">{Math.min(endIndex, data.length)}</span> of{' '}
            <span className="text-[var(--tv-text)] tabular-nums">{data.length}</span> records
          </p>
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="tv-adm-page-btn !min-w-0 !px-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  /* The current page is marked with aria-current, and the CSS
                     hangs the patina fill off that — so the visible state and
                     the announced one cannot drift apart. */
                  aria-current={page === currentPage ? 'page' : undefined}
                  className="tv-adm-page-btn"
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="tv-adm-page-btn !min-w-0 !px-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
