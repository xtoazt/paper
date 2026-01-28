/**
 * Command Palette (⌘K)
 * Quick actions and navigation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '../design-system';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.category?.toLowerCase().includes(lowerQuery)
    );
  }, [query, commands]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-elevated)] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
          animation: 'slideDown 0.2s ease-out'
        }}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-[var(--border-primary)]">
          <Input
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-[var(--color-primary-500)] bg-opacity-10'
                      : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {cmd.icon && (
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {cmd.icon}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-[var(--text-primary)]">
                      {cmd.label}
                    </div>
                    {cmd.description && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        {cmd.description}
                      </div>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <div className="text-xs text-[var(--text-tertiary)] font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded">
                      {cmd.shortcut}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--text-secondary)]">
              No commands found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>⏎ Select</span>
              <span>⎋ Close</span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage command palette
 */
export function useCommandPalette(commands: Command[]) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    CommandPalette: () => (
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        commands={commands}
      />
    )
  };
}
