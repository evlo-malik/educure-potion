import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dashboard from './Dashboard';
import { Document } from '../lib/firestore';
import { ChevronLeft } from 'lucide-react';

interface SubjectPageProps {
  documents?: Document[];
  onDocumentsChange?: () => Promise<void>;
}

export default function SubjectPage({ documents = [], onDocumentsChange }: SubjectPageProps) {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Filter documents for this subject
  const subjectDocuments = documents.filter(doc => doc.subject?.toLowerCase() === subject?.toLowerCase());

  // Decode and format subject name for display
  const formattedSubject = decodeURIComponent(subject || '').split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/dashboard"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formattedSubject}
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.subjects.manage', { subject: formattedSubject.toLowerCase() })}
          </p>
        </div>

        {/* Reuse Dashboard component with filtered documents and current subject */}
        <Dashboard 
          documents={subjectDocuments}
          onDocumentsChange={onDocumentsChange}
          currentSubject={formattedSubject}
          showSubjects={false}
        />
      </div>
    </div>
  );
} 