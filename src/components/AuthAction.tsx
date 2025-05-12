import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'resetPassword' | 'verifyEmail' | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (!oobCode) {
      setError('Invalid action code');
      setIsLoading(false);
      return;
    }

    setOobCode(oobCode);

    if (mode === 'resetPassword') {
      setMode('resetPassword');
      handlePasswordReset(oobCode);
    } else if (mode === 'verifyEmail') {
      setMode('verifyEmail');
      handleEmailVerification(oobCode);
    } else {
      setError('Invalid action type');
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleEmailVerification = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      setSuccess(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error verifying email:', error);
      setError('Failed to verify email. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (actionCode: string) => {
    try {
      // Verify the password reset code is valid
      await verifyPasswordResetCode(auth, actionCode);
      // If valid, redirect to password reset page with the code
      navigate(`/reset-password?oobCode=${actionCode}`);
    } catch (error) {
      console.error('Error verifying reset code:', error);
      setError('Invalid or expired password reset link.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Action Failed</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/signup')}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
          >
            Return to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'verifyEmail' && success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Verified Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for verifying your email. You'll be redirected to your dashboard in a moment.
          </p>

          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div
              className="bg-green-600 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}