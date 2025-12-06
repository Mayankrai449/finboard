'use client';

import { useState, useMemo } from 'react';

interface FieldSelectorProps {
  apiResponse: any;
  selectedFields: SelectedFieldItem[];
  onFieldsChange: (fields: SelectedFieldItem[]) => void;
}

export interface SelectedFieldItem {
  path: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'null';
  value?: any;
}

interface FlattenedField {
  path: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
}

export default function FieldSelector({ apiResponse, selectedFields, onFieldsChange }: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten nested JSON structure
  const flattenObject = (obj: any, prefix = ''): FlattenedField[] => {
    const fields: FlattenedField[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        
        if (value === null) {
          fields.push({ path, value, type: 'null' });
        } else if (Array.isArray(value)) {
          fields.push({ path, value: JSON.stringify(value), type: 'array' });
        } else if (typeof value === 'object') {
          // Add the object itself
          fields.push({ path, value: '{...}', type: 'object' });
          // Recursively flatten nested objects
          fields.push(...flattenObject(value, path));
        } else {
          fields.push({ 
            path, 
            value, 
            type: typeof value as 'string' | 'number' | 'boolean'
          });
        }
      }
    }
    
    return fields;
  };

  const allFields = useMemo(() => {
    if (!apiResponse) return [];
    return flattenObject(apiResponse);
  }, [apiResponse]);

  const filteredFields = useMemo(() => {
    if (!searchTerm) return allFields;
    const term = searchTerm.toLowerCase();
    return allFields.filter(field => 
      field.path.toLowerCase().includes(term) || 
      String(field.value).toLowerCase().includes(term)
    );
  }, [allFields, searchTerm]);

  const isFieldSelected = (path: string) => {
    return selectedFields.some(f => f.path === path);
  };

  const handleToggleField = (field: FlattenedField) => {
    const path = field.path;
    
    if (isFieldSelected(path)) {
      // Remove field
      onFieldsChange(selectedFields.filter(f => f.path !== path));
    } else {
      // Add field, only allow primitive types, not objects
      if (field.type === 'object') return;
      
      const label = path.split('.').pop() || path; // Use last part of path as default label
      
      onFieldsChange([
        ...selectedFields,
        {
          path,
          label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize first letter
          type: field.type as 'string' | 'number' | 'boolean' | 'array' | 'null',
          value: field.value
        }
      ]);
    }
  };

  const handleUpdateField = (path: string, updates: Partial<SelectedFieldItem>) => {
    onFieldsChange(
      selectedFields.map(f => 
        f.path === path ? { ...f, ...updates } : f
      )
    );
  };

  const handleRemoveField = (path: string) => {
    onFieldsChange(selectedFields.filter(f => f.path !== path));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...selectedFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onFieldsChange(newFields);
  };

  return (
    <div className="space-y-4">
      {/* Available Fields Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Available Fields</h3>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f0f1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] mb-3"
        />

        {/* Fields List */}
        <div className="max-h-64 overflow-y-auto bg-[#0f0f1a] border border-[#333] rounded-lg">
          {filteredFields.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No fields found
            </div>
          ) : (
            <div className="divide-y divide-[#333]/50">
              {filteredFields
                .filter(field => field.type !== 'object') // Don't show object containers, only leaf values
                .map((field) => (
                <div
                  key={field.path}
                  onClick={() => handleToggleField(field)}
                  className={`p-3 hover:bg-[#1a1a2e] cursor-pointer transition-colors ${
                    isFieldSelected(field.path) ? 'bg-[#00d4ff]/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isFieldSelected(field.path)
                          ? 'bg-[#00d4ff] border-[#00d4ff]'
                          : 'border-[#555] bg-transparent'
                      }`}>
                        {isFieldSelected(field.path) && (
                          <svg className="w-3 h-3 text-[#0f0f1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-[#00d4ff] truncate">
                          {field.path}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          Value: <span className="text-gray-300">{String(field.value)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                      field.type === 'number' ? 'bg-green-500/20 text-green-300' :
                      field.type === 'string' ? 'bg-blue-500/20 text-blue-300' :
                      field.type === 'boolean' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {field.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Fields Section */}
      {selectedFields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Selected Fields ({selectedFields.length})
          </h3>
          
          <div className="space-y-2">
            {selectedFields.map((field, index) => (
              <div
                key={field.path}
                className="bg-[#0f0f1a] border border-[#333] rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Move Up/Down Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-[#00d4ff]/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === selectedFields.length - 1}
                      className="p-1 hover:bg-[#00d4ff]/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {/* Path with Type inline */}
                    <div className="font-mono text-xs text-gray-500">
                      {field.path} <span className="text-[#00d4ff]">({field.type})</span>
                    </div>
                    
                    {/* Label Input */}
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleUpdateField(field.path, { label: e.target.value })}
                      placeholder="Field label"
                      className="w-full px-2 py-1 bg-[#1a1a2e] border border-[#444] rounded text-white text-sm focus:outline-none focus:border-[#00d4ff]"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.path)}
                    className="p-1.5 hover:bg-[#ff4d4d]/20 rounded transition-colors group shrink-0"
                    title="Remove field"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#ff4d4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
