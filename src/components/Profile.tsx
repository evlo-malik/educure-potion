import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Trash2,
  AlertTriangle,
  ArrowRight,
  XCircle,
  X,
  MessageSquare,
  Settings,
  Globe2
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { deleteUserAccount } from '../lib/firestore';
import { 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  getAuth
} from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { cancelSubscription, getSubscriptionStatus, createCustomerPortalSession } from '../lib/stripe';
import SubscriptionStatusMessage from './SubscriptionStatusMessage';
import RetentionModal from './RetentionModal';
import CancelFeedbackModal from './CancelFeedbackModal';
import MessageUsage from './MessageUsage';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface UserData {
  name: string;
  email: string;
  language: string;
}

interface FormData {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  language: string;
}

// Language options with flag codes
const languages = [
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'es', name: 'Spanish', flag: 'es' },
  { code: 'fr', name: 'French', flag: 'fr' },
  { code: 'de', name: 'German', flag: 'de' },
  { code: 'it', name: 'Italian', flag: 'it' },
  { code: 'pt', name: 'Portuguese', flag: 'pt' },
  { code: 'ru', name: 'Russian', flag: 'ru' },
  { code: 'zh', name: 'Chinese', flag: 'cn' },
  { code: 'ar', name: 'Arabic', flag: 'sa' },
  { code: 'hi', name: 'Hindi', flag: 'in' },
  { code: 'lt', name: 'Lithuanian', flag: 'lt' },
  { code: 'fil', name: 'Filipino', flag: 'ph' },
  { code: 'nl', name: 'Dutch', flag: 'nl' },
  { code: 'pl', name: 'Polish', flag: 'pl' },
  { code: 'tr', name: 'Turkish', flag: 'tr' },
  { code: 'uk', name: 'Ukrainian', flag: 'ua' },
  { code: 'da', name: 'Danish', flag: 'dk' },
  { code: 'sv', name: 'Swedish', flag: 'se' },
  { code: 'ms', name: 'Malay', flag: 'my' },
  { code: 'id', name: 'Indonesian', flag: 'id' },
  { code: 'ro', name: 'Romanian', flag: 'ro' },
  { code: 'el', name: 'Greek', flag: 'gr' },
  { code: 'bg', name: 'Bulgarian', flag: 'bg' },
  { code: 'vi', name: 'Vietnamese', flag: 'vn' },
  { code: 'lv', name: 'Latvian', flag: 'lv' },
  { code: 'no', name: 'Norwegian', flag: 'no' },
  { code: 'ur', name: 'Urdu', flag: 'pk' }
];

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { plan, isNew } = useSubscription();
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusMessageType, setStatusMessageType] = useState<'cancel' | 'upgrade' | 'downgrade'>('cancel');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | undefined>();
  const [isCancelling, setIsCancelling] = useState(false);
  const { setLanguage } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: i18n.language || 'en',
  });

  // Update formData.language whenever i18n.language changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, language: i18n.language || 'en' }));
  }, [i18n.language]);

  const loadUserData = async () => {
    if (!auth.currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData: UserData = {
          name: data.name || '',
          email: data.email || '',
          language: i18n.language || 'en'
        };

        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name,
          language: i18n.language || 'en'
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [i18n.language]);

  const handleUpdateName = async () => {
    if (!formData.name.trim() || !auth.currentUser) return;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          name: formData.name.trim()
        });

        localStorage.setItem('userName', formData.name.trim());

        setUser(prev => prev ? { ...prev, name: formData.name.trim() } : null);
        setSuccess('Name updated successfully');
        setIsEditingName(false);

        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating name:', error);
      setError('Failed to update name');
    }
  };

  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !auth.currentUser) return;
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        formData.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, formData.newPassword);

      setSuccess('Password updated successfully');
      setIsEditingPassword(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please check your current password and try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser?.uid || !auth.currentUser?.email) return;
  
    try {
      setIsLoading(true);
      setError(null);

      // Re-authenticate user before deletion
      if (auth.currentUser.providerData[0]?.providerId === 'password') {
        // For email/password users, we need their current password
        const password = prompt('Please enter your password to confirm account deletion:');
        if (!password) {
          setError('Password is required to delete account');
          return;
        }
        
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          password
        );
        
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
  
      // Delete everything
      const result = await deleteUserAccount(auth.currentUser.uid);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
  
      // Delete the user from Firebase Authentication
      await deleteUser(auth.currentUser);
  
      // Clear local storage and navigate to home
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userPlan');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!auth.currentUser?.uid) return;
    
    setIsCancelling(true);
    try {
      const result = await cancelSubscription(auth.currentUser.uid);
      if (result.success) {
        setShowCancelConfirm(false);
        setShowRetentionModal(true);
        setCurrentPeriodEnd(result.currentPeriodEnd);
      } else {
        console.error('Error cancelling subscription:', result.error);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetentionConfirm = () => {
    setShowRetentionModal(false);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackModal(false);
    setStatusMessageType('cancel');
    setShowStatusMessage(true);
  };

  const handleCustomerPortal = async () => {
    if (!auth.currentUser?.uid) return;
    
    setIsPortalLoading(true);
    try {
      await createCustomerPortalSession(auth.currentUser.uid);
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setError(error instanceof Error ? error.message : 'Failed to open customer portal');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleUpdateLanguage = async (newLanguage: string) => {
    if (!auth.currentUser) return;

    try {
      setError(null);
      setSuccess(null);
      
      // Update language using the context
      await setLanguage(newLanguage);
      
      // Force update localStorage
      localStorage.setItem('userLanguage', newLanguage);
      
      setUser(prev => prev ? { ...prev, language: newLanguage } : null);
      setFormData(prev => ({ ...prev, language: newLanguage }));
      setSuccess('Language updated successfully');

      // Update Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          language: newLanguage
        });
      }
    } catch (error) {
      console.error('Error updating language:', error);
      setError('Failed to update language');
    }
  };

  const renderSubscriptionActions = () => {
    switch (plan) {
      case 'cooked':
        return (
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 flex items-center gap-2"
          >
            {t('profile.sections.subscription.upgrade')}
            <ArrowRight className="w-4 h-4" />
          </button>
        );
      case 'commited':
      case 'locked-in':
        return (
          <button
            onClick={handleCustomerPortal}
            disabled={isPortalLoading}
            className="flex items-center justify-center gap-2 px-4 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 text-sm border border-gray-200"
          >
            {isPortalLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <>
                <Settings className="w-3.5 h-3.5" />
                {t('profile.sections.subscription.manage')}
              </>
            )}
          </button>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (isEditingName || isEditingPassword) {
      setError(null);
      setSuccess(null);
    }
  }, [isEditingName, isEditingPassword]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find current language details based on i18n.language
  const currentLanguage = languages.find(lang => {
    // Get the base language code (e.g., 'ru' from 'ru-RU')
    const browserLang = i18n.language?.split('-')[0];
    return lang.code === browserLang;
  }) || languages[0];

  // Update language state when i18n.language changes
  useEffect(() => {
    const browserLang = i18n.language?.split('-')[0];
    if (browserLang && formData.language !== browserLang) {
      setFormData(prev => ({ ...prev, language: browserLang }));
      if (user) {
        setUser(prev => prev ? { ...prev, language: browserLang } : null);
      }
    }
  }, [i18n.language]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20 dark:border-gray-700/20">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-8">
            {t('profile.title')}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{t('profile.error')}</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">{t('profile.success')}</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">{success}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Name Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.name.label')}</p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:text-gray-100 sm:text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isEditingName) {
                      handleUpdateName();
                    } else {
                      setIsEditingName(true);
                    }
                  }}
                  className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {isEditingName ? t('profile.sections.name.save') : t('profile.sections.name.edit')}
                </button>
              </div>
            </div>

            {/* Email Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.email.label')}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.password.label')}</p>
                    {isEditingPassword ? (
                      <div className="space-y-3 mt-1">
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder={t('profile.sections.password.current')}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:text-gray-100 sm:text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder={t('profile.sections.password.new')}
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:text-gray-100 sm:text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('profile.sections.password.confirm')}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:text-gray-100 sm:text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-gray-100">••••••••</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isEditingPassword) {
                      handleUpdatePassword();
                    } else {
                      setIsEditingPassword(true);
                    }
                  }}
                  className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {isEditingPassword ? t('profile.sections.password.save') : t('profile.sections.password.change')}
                </button>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.subscription.label')}</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan === 'locked-in'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : plan === 'commited'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {plan}
                      </span>
                      {plan !== 'cooked' && isNew && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 animate-pulse">
                          {t('profile.sections.subscription.new')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {renderSubscriptionActions()}
              </div>
            </div>

            {/* Message Usage Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.messages.label')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.sections.messages.description')}</p>
                </div>
              </div>
              {auth.currentUser?.uid && <MessageUsage 
                userId={auth.currentUser.uid}
                translations={{
                  textMessages: t('profile.sections.messages.textMessages'),
                  areaSelection: t('profile.sections.messages.areaSelection'),
                  planUsageDaily: t('profile.sections.messages.planUsageDaily'),
                  planUsageWeekly: t('profile.sections.messages.planUsageWeekly'),
                  purchasedMessages: t('profile.sections.messages.purchasedMessages'),
                  buyMore: t('profile.sections.messages.buyMore'),
                  infinity: t('profile.sections.messages.infinity')
                }}
              />}
            </div>

            {/* Language Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 dark:border dark:border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <Globe2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div className="w-full">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.sections.language.label')}</p>
                    <div className="relative mt-1" ref={languageDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className="relative w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/24x18/${currentLanguage.flag}.png`}
                            srcSet={`https://flagcdn.com/48x36/${currentLanguage.flag}.png 2x`}
                            alt=""
                            className="w-6 rounded-sm object-cover"
                          />
                          <span className="block truncate dark:text-gray-100">{currentLanguage.name}</span>
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>

                      {isLanguageDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 overflow-auto focus:outline-none sm:text-sm">
                          <div className="grid grid-cols-1 gap-1">
                            {languages.map((language) => (
                              <button
                                key={language.code}
                                onClick={() => {
                                  handleUpdateLanguage(language.code);
                                  setIsLanguageDropdownOpen(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600 w-full text-left ${
                                  formData.language === language.code ? 'bg-indigo-50 dark:bg-gray-600' : ''
                                }`}
                              >
                                <img
                                  src={`https://flagcdn.com/24x18/${language.flag}.png`}
                                  srcSet={`https://flagcdn.com/48x36/${language.flag}.png 2x`}
                                  alt=""
                                  className="w-6 rounded-sm object-cover"
                                />
                                <span className={`block truncate ${
                                  formData.language === language.code ? 'font-semibold' : 'font-normal'
                                } dark:text-gray-100`}>
                                  {language.name}
                                </span>
                                {formData.language === language.code && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400">
                                    <CheckCircle className="w-5 h-5" />
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Account Section */}
            <div className="mt-12 border-t dark:border-gray-700 pt-8">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{t('profile.sections.danger.title')}</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {t('profile.sections.danger.warning')}
                    </p>
                    {showDeleteConfirm && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('profile.sections.danger.deleting')}
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                {t('profile.sections.danger.confirm')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                            }}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                          >
                            {t('profile.sections.danger.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                    {!showDeleteConfirm && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('profile.sections.danger.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            {!isCancelling && (
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center justify-center mb-4">
              {isCancelling ? (
                <Loader2 className="h-12 w-12 text-indigo-500 dark:text-indigo-400 animate-spin" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              {isCancelling ? t('profile.subscription.cancel.processing') : t('profile.subscription.cancel.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {isCancelling ? 
                t('profile.subscription.cancel.wait') :
                t('profile.subscription.cancel.description')}
            </p>
            {!isCancelling && (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
                >
                  {t('profile.subscription.cancel.keep')}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors text-sm"
                >
                  {t('profile.subscription.cancel.confirm')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retention Modal */}
      <RetentionModal
        isOpen={showRetentionModal}
        onClose={() => setShowRetentionModal(false)}
        onConfirmCancel={handleRetentionConfirm}
      />

      {/* Feedback Modal */}
      <CancelFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        userId={auth.currentUser?.uid || ''}
        userName={user.name}
      />

      {/* Subscription Status Message */}
      {showStatusMessage && (
        <SubscriptionStatusMessage
          action={statusMessageType}
          currentPeriodEnd={currentPeriodEnd}
          onClose={() => setShowStatusMessage(false)}
        />
      )}
    </div>
  );
}