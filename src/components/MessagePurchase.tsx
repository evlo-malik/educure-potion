import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Wand2, CreditCard, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';

const MIN_PURCHASE_AMOUNT = 0; // Start at $0
const MIN_STEP_AMOUNT = 0.5; // Minimum step after 0 is $0.50
const TEXT_MESSAGE_PRICE = 0.02; // $0.02 per message
const AREA_MESSAGE_PRICE = 0.05; // $0.05 per message

export default function MessagePurchase() {
  const [textAmount, setTextAmount] = useState(MIN_PURCHASE_AMOUNT);
  const [areaAmount, setAreaAmount] = useState(MIN_PURCHASE_AMOUNT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  const textMessages = Math.floor(textAmount / TEXT_MESSAGE_PRICE);
  const areaMessages = Math.floor(areaAmount / AREA_MESSAGE_PRICE);
  const totalAmount = textAmount + areaAmount;

  const handleTextSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value === 0) {
      setTextAmount(0);
    } else {
      setTextAmount(Math.max(MIN_STEP_AMOUNT, value));
    }
  };

  const handleAreaSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value === 0) {
      setAreaAmount(0);
    } else {
      setAreaAmount(Math.max(MIN_STEP_AMOUNT, value));
    }
  };

  const handleTextMessagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const messages = parseInt(e.target.value);
    if (!isNaN(messages)) {
      const amount = messages * TEXT_MESSAGE_PRICE;
      if (amount === 0) {
        setTextAmount(0);
      } else {
        setTextAmount(Math.max(MIN_STEP_AMOUNT, amount));
      }
    }
  };

  const handleAreaMessagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const messages = parseInt(e.target.value);
    if (!isNaN(messages)) {
      const amount = messages * AREA_MESSAGE_PRICE;
      if (amount === 0) {
        setAreaAmount(0);
      } else {
        setAreaAmount(Math.max(MIN_STEP_AMOUNT, amount));
      }
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      setError('Please log in to purchase messages');
      return;
    }

    if (totalAmount < MIN_STEP_AMOUNT) {
      setError('Minimum purchase amount is $0.50');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession('message_purchase', userId, false, {
        textAmount,
        areaAmount,
        textMessages,
        areaMessages
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Purchase Additional Messages
            </h1>
            <p className="text-gray-600">
              Need more messages? Purchase them here to continue your learning journey.
            </p>
          </div>

          <div className="space-y-8">
            {/* Text Messages Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Text Messages</h3>
                  <p className="text-sm text-gray-600">${TEXT_MESSAGE_PRICE.toFixed(2)} per message</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={textAmount}
                  onChange={handleTextSliderChange}
                  className="w-full"
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Messages
                    </label>
                    <input
                      type="number"
                      value={textMessages}
                      onChange={handleTextMessagesChange}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={textAmount.toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value === 0) {
                            setTextAmount(0);
                          } else {
                            setTextAmount(Math.max(MIN_STEP_AMOUNT, value));
                          }
                        }}
                        min={0}
                        step={0.01}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Area Selection Messages Section */}
            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Area Selection Messages</h3>
                  <p className="text-sm text-gray-600">${AREA_MESSAGE_PRICE.toFixed(2)} per message</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={areaAmount}
                  onChange={handleAreaSliderChange}
                  className="w-full"
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Messages
                    </label>
                    <input
                      type="number"
                      value={areaMessages}
                      onChange={handleAreaMessagesChange}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={areaAmount.toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value === 0) {
                            setAreaAmount(0);
                          } else {
                            setAreaAmount(Math.max(MIN_STEP_AMOUNT, value));
                          }
                        }}
                        min={0}
                        step={0.01}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total and Checkout */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-900">Total Amount</div>
                <div className="text-2xl font-bold text-indigo-600">${totalAmount.toFixed(2)}</div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isLoading || totalAmount < MIN_STEP_AMOUNT}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Checkout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}