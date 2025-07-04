'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Plus,
  Eye,
  EyeOff,
  User,
  Calendar,
  FileText,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Send
} from 'lucide-react';

interface Note {
  id: string;
  content: string;
  type: 'general' | 'interview' | 'skills' | 'follow_up' | 'concern' | 'positive';
  isPrivate: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotesSystemProps {
  applicationId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

const noteTypeConfig = {
  general: {
    label: 'General',
    icon: MessageSquare,
    color: 'text-gray-600',
    bg: 'bg-gray-100'
  },
  interview: {
    label: 'Interview',
    icon: Calendar,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  skills: {
    label: 'Skills',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-100'
  },
  follow_up: {
    label: 'Follow Up',
    icon: Star,
    color: 'text-orange-600',
    bg: 'bg-orange-100'
  },
  concern: {
    label: 'Concern',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100'
  },
  positive: {
    label: 'Positive',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100'
  }
};

export default function NotesSystem({ applicationId, candidateName, isOpen, onClose }: NotesSystemProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<keyof typeof noteTypeConfig>('general');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle ESC key and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Focus management
    const firstFocusableElement = document.querySelector('#notes-modal button, #notes-modal input, #notes-modal textarea, #notes-modal select') as HTMLElement;
    firstFocusableElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Fetch notes when modal opens
  useEffect(() => {
    if (isOpen && applicationId) {
      fetchNotes();
    }
  }, [isOpen, applicationId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/employers/applications/${applicationId}/notes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/employers/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote.trim(),
          type: newNoteType,
          isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      
      // Add the new note to the top of the list
      setNotes(prev => [data.note, ...prev]);
      
      // Reset form
      setNewNote('');
      setNewNoteType('general');
      setIsPrivate(false);
      setShowAddNote(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="notes-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0" id="notes-modal">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900" id="notes-title">
                  Notes - {candidateName}
                </h3>
                <p className="text-sm text-gray-600">
                  Track your thoughts and decisions about this candidate
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Add Note Section */}
            {showAddNote ? (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Type
                  </label>
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as keyof typeof noteTypeConfig)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(noteTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your note about this candidate..."
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-describedby="note-char-count"
                  />
                  <div id="note-char-count" className="mt-1 text-xs text-gray-500">
                    {newNote.length}/2000 characters
                  </div>
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="private-note"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="private-note" className="ml-2 text-sm text-gray-700">
                    Private note (only visible to you)
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote('');
                      setIsPrivate(false);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim() || submitting}
                    className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  onClick={() => setShowAddNote(true)}
                  className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </button>
              </div>
            )}

            {/* Notes List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">No notes yet</p>
                <p className="text-sm text-gray-500">
                  Add your first note to start tracking your thoughts about this candidate.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => {
                  const config = noteTypeConfig[note.type];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={note.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                            <Icon className="mr-1 h-3 w-3" />
                            {config.label}
                          </div>
                          {note.isPrivate && (
                            <div className="flex items-center text-gray-500">
                              <EyeOff className="h-3 w-3 mr-1" />
                              <span className="text-xs">Private</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="mr-1 h-3 w-3" />
                        {note.author.name || note.author.email}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Notes help you track your hiring decisions and collaborate with your team.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}