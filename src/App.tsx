import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Book, User, Settings, HelpCircle, LayoutDashboard, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from './contexts/SubscriptionContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import Hero from './components/Hero';
import Features from './components/Features';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import DocumentView from './components/DocumentView';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import FeatureTourModal from './components/FeatureTourModal';
import LiveLectureRecorder from './components/LiveLectureRecorder';
import LecturePage from './components/LecturePage';
import UserMenu from './components/UserMenu';
import FeatureRequest from './components/FeatureRequest';
import { getUserDocuments, type Document } from './lib/firestore';
import Feedback from './components/Feedback';
import { ToastProvider } from './contexts/ToastContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import CookieConsent from './components/CookieConsent';
import Pricing from './components/Pricing';
import CheckoutSuccess from './components/CheckoutSuccess';
import Support from './components/Support';
import EmailVerification from './components/EmailVerification';
import EmailVerified from './components/EmailVerified';
import AuthAction from './components/AuthAction';
import MessagePurchase from './components/MessagePurchase';
import Admin from './pages/admin';
import { auth } from './lib/firebase';
import Updates from './components/Updates';
import { useLanguageModal } from './hooks/useLanguageModal';
import LanguageSelectionModal from './components/LanguageSelectionModal';
import { DarkModeProvider } from './contexts/DarkModeContext';
import SubjectPage from './components/SubjectPage';

interface LayoutProps {
  children: React.ReactNode | ((props: { documents: Document[]; onDocumentsChange: () => Promise<void> }) => React.ReactNode);
}

function Layout({ children }: LayoutProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showFeatureTour, setShowFeatureTour] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const loadDocumentsRef = useRef<() => Promise<void>>();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const location = useLocation();
  const { plan, isLoading: isPlanLoading } = useSubscription();
  const isLandingPage = location.pathname === '/';
  const { t } = useTranslation();

  // Initialize loadDocuments function
  loadDocumentsRef.current = async () => {
    if (!userId) return;
    const docs = await getUserDocuments(userId);
    setDocuments(docs);
  };

  useEffect(() => {
    if (!isPlanLoading) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPlanLoading]);

  useEffect(() => {
    if (userId) {
      loadDocumentsRef.current?.();
    }
  }, [userId]);

  const handleDocumentsChange = async () => {
    return loadDocumentsRef.current?.() ?? Promise.resolve();
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm dark:shadow-gray-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left side - Logo */}
            <Link to={userId ? "/dashboard" : "/"} className="flex items-center gap-2 min-w-0">
              <img 
                src="https://evlo-malik.github.io/uni-logos/2.png"
                alt="EduCure AI Logo"
                className="h-8 w-8 md:h-12 md:w-12 object-contain flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-lg md:text-2xl font-bold truncate">
                  <span className="text-gray-900 dark:text-white">Edu</span>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cure AI</span>
                </span>
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('header.tagline')}</span>
              </div>
            </Link>

            {/* Right side - User Menu */}
            {userId ? (
              <div className="flex items-center gap-2 md:gap-4">
                {/* Help Button - Hidden on mobile */}
                <button 
                  onClick={() => setShowFeatureTour(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden md:flex"
                >
                  <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Only show upgrade button when plan is loaded and is 'cooked' */}
                {!isPlanLoading && plan === 'cooked' && (
                  <Link 
                    to="/pricing" 
                    className="group relative flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-[length:200%_auto] animate-gradient-x text-white rounded-lg md:rounded-xl overflow-hidden shadow-[0_0_0_2px_rgba(139,92,246,0.2)] hover:shadow-[0_0_0_2px_rgba(139,92,246,0.4)] transition-all duration-300"
                  > 
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative flex items-center gap-2">
                      <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                        <span className="hidden sm:inline"></span>
                        {t('header.buttons.upgradeNow')}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs font-medium">
                        <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 animate-pulse" />
                        <span>{t('header.buttons.pro')}</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Show loading placeholder when subscription status is loading */}
                {isPlanLoading && (
                  <div className="w-[120px] h-[36px] md:w-[140px] md:h-[40px] bg-gray-100 rounded-lg animate-pulse"></div>
                )}

                {/* Dashboard Button */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="font-medium text-sm md:text-base">{t('header.buttons.dashboard')}</span>
                </Link>

                {/* User Menu */}
                <UserMenu 
                  userName={userName || 'User'} 
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <Link
                  to="/pricing"
                  className="text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  {t('header.buttons.pricing')}
                </Link>
                <Link
                  to="/signup"
                  className="text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  {t('header.buttons.signIn')}
                </Link>
                <Link
                  to="/signup"
                  className="text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {t('header.buttons.getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {typeof children === 'function'
          ? children({ documents, onDocumentsChange: handleDocumentsChange })
          : React.cloneElement(children as React.ReactElement, {
              documents,
              onDocumentsChange: handleDocumentsChange
            })
        }
      </main>

      {isLandingPage && <Footer />}

      {/* Feature Tour Modal */}
      <FeatureTourModal 
        isOpen={showFeatureTour} 
        onClose={() => setShowFeatureTour(false)} 
      />
    </div>
  );
}

function App() {
  const { isOpen: isLanguageModalOpen, closeModal: closeLanguageModal } = useLanguageModal();

  return (
    <BrowserRouter>
      <ToastProvider>
        <LoadingProvider>
          <SubscriptionProvider>
            <LanguageProvider>
              <DarkModeProvider>
                <Routes>
                  <Route path="/" element={<Layout><HomePage /></Layout>} />
                  <Route path="/signup" element={<AuthForm />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                  <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                  <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/feedback" element={<Layout><Feedback /></Layout>} />
                  <Route path="/feature-request" element={<Layout><FeatureRequest /></Layout>} />
                  <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/support" element={<Layout><Support /></Layout>} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route path="/email-verified" element={<EmailVerified />} />
                  <Route path="/auth/action" element={<AuthAction />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/document/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          {(props) => <DocumentView {...props} />}
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/purchase-messages"
                    element={
                      <ProtectedRoute>
                        <Layout><MessagePurchase /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/record"
                    element={
                      <ProtectedRoute>
                        <Layout><LiveLectureRecorder /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lecture/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          {(props) => <LecturePage {...props} />}
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout><Profile /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <Layout><Admin /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/updates"
                    element={
                      <Layout><Updates /></Layout>
                    }
                  />
                  <Route
                    path="/subject/:subject"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          {(props) => <SubjectPage {...props} />}
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <CookieConsent userId={localStorage.getItem('userId')} />
                <LanguageSelectionModal 
                  isOpen={isLanguageModalOpen} 
                  onClose={closeLanguageModal} 
                />
              </DarkModeProvider>
            </LanguageProvider>
          </SubscriptionProvider>
        </LoadingProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
    </>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ADMIN_IDS = ['yOFRGcwpmeXLgx9cjpzOmU8M5AH2', 'mUY3I3KqiDRWMXayZpUzJGNxcU03'];

function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/signup', { replace: true });
        setIsLoading(false);
        return;
      }

      if (adminOnly && !ADMIN_IDS.includes(user.uid)) {
        navigate('/', { replace: true });
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [adminOnly, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}

export default App;