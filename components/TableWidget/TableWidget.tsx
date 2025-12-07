'use client';

import { useState, useMemo } from 'react';

interface SelectedField {
  path: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'null';
}

interface TableWidgetProps {
  widgetName?: string;
  widgetDescription?: string;
  selectedFields?: SelectedField[];
  rawData?: any;
  refreshRate: number;
  lastUpdated: string;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Function to get nested value from object using path
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to flatten nested objects into dot notation
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      // Keep arrays as JSON strings to avoid further nesting
      result[newKey] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

// Function to flatten nested arrays and nested objects
function flattenNestedArray(data: any[]): any[] {
  const flattened: any[] = [];
  
  for (const item of data) {
    if (typeof item !== 'object' || item === null) {
      flattened.push(item);
      continue;
    }
    
    // Find nested arrays in the item
    const nestedArrays: { key: string; values: any[] }[] = [];
    const nonArrayFields: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (Array.isArray(value) && value.length > 0) {
        nestedArrays.push({ key, values: value });
      } else if (typeof value === 'object' && value !== null) {
        // Flatten nested objects
        const flattened = flattenObject(value, key);
        Object.assign(nonArrayFields, flattened);
      } else {
        nonArrayFields[key] = value;
      }
    }
    
    // If there are nested arrays, flatten them
    if (nestedArrays.length > 0) {
      for (const nestedArray of nestedArrays) {
        for (const nestedItem of nestedArray.values) {
          if (typeof nestedItem === 'object' && nestedItem !== null) {
            // Flatten the nested item's objects
            const flattenedItem = flattenObject(nestedItem);
            // Merge parent fields with flattened nested item fields
            flattened.push({
              ...nonArrayFields,
              ...flattenedItem
            });
          } else {
            // Primitive value in nested array
            flattened.push({
              ...nonArrayFields,
              [nestedArray.key]: nestedItem
            });
          }
        }
      }
    } else {
      // No nested arrays, add the flattened item
      flattened.push(nonArrayFields);
    }
  }
  
  return flattened;
}

// Function to extract array data for table
function extractTableData(rawData: any, selectedFields: SelectedField[]): any[] {
  // Find the first array field in the selected fields
  for (const field of selectedFields) {
    if (field.type === 'array') {
      const arrayData = getValueByPath(rawData, field.path);
      if (Array.isArray(arrayData)) {
        // Check if flattening is needed
        const needsFlattening = arrayData.some(item => 
          typeof item === 'object' && 
          item !== null && 
          Object.values(item).some(v => Array.isArray(v))
        );
        
        return needsFlattening ? flattenNestedArray(arrayData) : arrayData;
      }
    }
  }
  
  // If no array field selected, check if rawData itself is an array
  if (Array.isArray(rawData)) {
    return rawData;
  }
  
  // If no array found, return empty array
  return [];
}

// Function to format values based on type
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return Number(value).toLocaleString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

export default function TableWidget({
  widgetName,
  widgetDescription,
  selectedFields,
  rawData,
  refreshRate,
  lastUpdated,
  onRefresh,
  onEdit,
  onDelete
}: TableWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract table data from rawData
  const tableData = useMemo(() => {
    if (!rawData || !selectedFields || selectedFields.length === 0) return [];
    return extractTableData(rawData, selectedFields);
  }, [rawData, selectedFields]);

  // Get columns from selected fields (excluding array type fields)
  const columns = useMemo(() => {
    if (!selectedFields) return [];
    return selectedFields.filter(field => field.type !== 'array');
  }, [selectedFields]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = tableData;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(row => {
        return columns.some(col => {
          const value = getValueByPath(row, col.path);
          return String(value).toLowerCase().includes(term);
        });
      });
    }
    
    // Sort
    if (sortField) {
      data = [...data].sort((a, b) => {
        const aVal = getValueByPath(a, sortField);
        const bVal = getValueByPath(b, sortField);
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return data;
  }, [tableData, columns, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatRefreshRate = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  if (!selectedFields || columns.length === 0) {
    return (
      <div className="relative max-w-full mx-auto">
        <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-xl border border-[#00d4ff]/20 p-8">
          <div className="text-center text-gray-400">
            <p>No fields configured for table display</p>
            <button
              onClick={onEdit}
              className="mt-4 px-4 py-2 bg-[#00d4ff] text-[#0f0f1a] rounded-lg font-medium hover:bg-[#00b8e6] transition-all"
            >
              Configure Widget
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-full mx-auto">
      <div className="absolute -inset-0.5 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-xl blur opacity-10"></div>
      
      {/* Main Container */}
      <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-xl border border-[#00d4ff]/20 overflow-hidden">
        
        {/* Top Bar */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        
        <div className="p-4">
          {/* Header Section */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1 truncate">
                  {widgetName || 'Table Widget'}
                </h2>
                {widgetDescription && (
                  <p className="text-gray-400 text-xs mt-1 line-clamp-1">{widgetDescription}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0f0f1a] border border-[#00d4ff]/30">
                    <span className="text-xs text-gray-400">{formatRefreshRate(refreshRate)}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredData.length} {filteredData.length === 1 ? 'row' : 'rows'}
                  </span>
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onRefresh}
                  className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                  title="Refresh now"
                >
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                  title="Edit widget"
                >
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 hover:bg-[#ff4d4d]/10 rounded-lg transition-colors group"
                  title="Delete widget"
                >
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ff4d4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Last Updated */}
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#333]/50">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f0f1a]">
                  {columns.map((col) => (
                    <th
                      key={col.path}
                      onClick={() => handleSort(col.path)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {sortField === col.path && (
                          <svg
                            className={`w-4 h-4 text-[#00d4ff] transition-transform ${
                              sortDirection === 'desc' ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]/30">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No results found' : 'No data available'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-[#1a1a2e]/50 transition-colors"
                    >
                      {columns.map((col) => {
                        const value = getValueByPath(row, col.path);
                        return (
                          <td
                            key={col.path}
                            className="px-4 py-3 text-sm text-white"
                          >
                            {formatValue(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Rows:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 bg-[#0f0f1a] border border-[#333] rounded text-white text-xs focus:outline-none focus:border-[#00d4ff]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#0f0f1a] border border-[#333] rounded-lg text-sm text-gray-400 hover:bg-[#1a1a2e] hover:text-[#00d4ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#00d4ff] text-[#0f0f1a] font-medium'
                            : 'bg-[#0f0f1a] text-gray-400 hover:bg-[#1a1a2e] hover:text-[#00d4ff]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#0f0f1a] border border-[#333] rounded-lg text-sm text-gray-400 hover:bg-[#1a1a2e] hover:text-[#00d4ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Accent */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/20 to-transparent"></div>
      </div>
    </div>
  );
}
