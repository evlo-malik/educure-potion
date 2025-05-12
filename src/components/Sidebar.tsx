import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, X, Trash2, Upload } from 'lucide-react';
import type { Document } from '../lib/airtable';
import DeleteModal from './DeleteModal';
import DeleteAnimation from './DeleteAnimation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onDeleteDocument: (documentId: string) => void;
}

export default function Sidebar({ isOpen, onClose, documents, onDeleteDocument }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; title: string } | null>(null);

  const handleDelete = async (documentId: string, title: string) => {
    setSelectedDoc({ id: documentId, title });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    
    setShowDeleteModal(false);
    setDeletingId(selectedDoc.id);

    const element = document.querySelector(`[data-document-id="${selectedDoc.id}"]`);
    if (element) {
      element.classList.add('animate-delete-to-trash');
      // Wait for the full animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    onDeleteDocument(selectedDoc.id);
    setDeletingId(null);
    setSelectedDoc(null);
  };

  return (
    <>
      {/* Overlay with fade animation */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Delete Animation Container */}
      {deletingId && <DeleteAnimation />}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        onConfirm={handleConfirmDelete}
        fileName={selectedDoc?.title || ''}
      />

      {/* Sidebar with slide animation */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Upload Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => {
              onClose();
              navigate('/dashboard');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            Upload New File
          </button>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                data-document-id={doc.id}
                className={`group flex items-center justify-between p-2 rounded-md transform transition-all duration-200 hover:scale-[1.02] ${
                  location.pathname === `/document/${doc.id}`
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'hover:bg-gray-50 text-gray-700'
                } ${deletingId === doc.id ? 'animate-delete-to-trash' : ''}`}
              >
                <Link
                  to={`/document/${doc.id}`}
                  className="flex items-center flex-1 min-w-0"
                  onClick={onClose}
                >
                  <FileText className="h-5 w-5 flex-shrink-0 mr-2" />
                  <span className="truncate">{doc.title}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(doc.id, doc.title);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="text-center text-gray-500 py-8 animate-fadeIn">
                <p>No documents yet</p>
                <p className="text-sm mt-2">Upload your first file to get started</p>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}