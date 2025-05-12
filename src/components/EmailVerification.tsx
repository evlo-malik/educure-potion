import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/signup');
        return;
      }

      if (user.emailVerified) {
        navigate('/dashboard');
        return;
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (emailSent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailSent, countdown]);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;

    try {
      setError(null);
      setEmailSent(true);
      setCountdown(60);
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Failed to send verification email. Please try again.');
      setEmailSent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-indigo-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
        <p className="text-gray-600 mb-8">
          We've sent a verification email to{' '}
          <span className="font-medium text-gray-900">{auth.currentUser?.email}</span>
        </p>

        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h2 className="font-medium text-indigo-900 mb-2">Next steps:</h2>
            <ol className="text-sm text-indigo-800 space-y-2 text-left list-decimal pl-4">
              <li>Check your email inbox</li>
              <li>Click the verification link in the email</li>
              <li>Return to this page and refresh</li>
            </ol>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={emailSent && countdown > 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            {emailSent && countdown > 0
              ? `Resend in ${countdown}s`
              : 'Resend Verification Email'}
          </button>

          {emailSent && (
            <div className="text-sm text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verification email sent!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}