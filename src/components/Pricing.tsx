import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skull, Star, Check, Loader2, MessageSquare, FileUp, Brain, Mic, Volume2, Info } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { createCheckoutSession, getSubscriptionStatus, createCustomerPortalSession, type SubscriptionData } from '../lib/stripe';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionStatusMessage from './SubscriptionStatusMessage';
import { useTranslation } from 'react-i18next';

const plans = [
  {
    name: 'cooked',
    price: 0,
    yearlyPrice: 0,
    icon: Skull,
    features: [
      {
        icon: FileUp,
        title: 'documentProcessing',
        items: 'docs'
      },
      {
        icon: Brain,
        title: 'aiFeatures',
        items: 'ai'
      },
      {
        icon: MessageSquare,
        title: 'chatAnalysis',
        items: 'chat'
      }
    ],
    gradient: 'from-blue-500 to-cyan-500',
    popular: false,
    priceIds: {
      monthly: null,
      yearly: null
    }
  },
  {
    name: 'committed',
    price: 4.99,
    yearlyPrice: 3,
    icon: Star,
    features: [
      {
        icon: FileUp,
        title: 'documentProcessing',
        items: 'docs'
      },
      {
        icon: Brain,
        title: 'aiFeatures',
        items: 'ai'
      },
      {
        icon: MessageSquare,
        title: 'chatAnalysis',
        items: 'chat'
      }
    ],
    gradient: 'from-violet-500 to-purple-500',
    popular: true,
    priceIds: {
      monthly: 'price_1Qk2CoE4Vh8gPWWwGjnzPbGS',
      yearly: 'price_1Qk2eeE4Vh8gPWWwjfNAnatz'
    }
  },
  {
    name: 'lockedIn',
    price: 9.99,
    yearlyPrice: 7.5,
    renderIcon: () => (
      <img 
        src="https://evlo-malik.github.io/uni-logos/goat.png" 
        alt="GOAT"
        className="w-full h-full object-contain"
      />
    ),
    features: [
      {
        icon: FileUp,
        title: 'documentProcessing',
        items: 'docs'
      },
      {
        icon: Brain,
        title: 'aiFeatures',
        items: 'ai'
      },
      {
        icon: MessageSquare,
        title: 'chatAnalysis',
        items: 'chat'
      }
    ],
    gradient: 'from-amber-500 to-orange-500',
    popular: false,
    priceIds: {
      monthly: 'price_1Qk2HsE4Vh8gPWWwE2n8MSRn',
      yearly: 'price_1Qk2McE4Vh8gPWWwdvem3SgQ'
    }
  }
];

export default function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [statusMessageType, setStatusMessageType] = useState<'cancel' | 'upgrade' | 'downgrade'>('cancel');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | undefined>();
  const { plan: currentPlan } = useSubscription() as { plan: 'cooked' | 'committed' | 'locked-in' };
  const userId = localStorage.getItem('userId');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const isCurrentPlan = (planName: string): boolean => {
    return planName.toLowerCase() === currentPlan;
  };

  const isPlanSelectable = (planName: string): boolean => {
    const normalizedPlanName = planName.toLowerCase();
    
    if (isCurrentPlan(planName)) {
      return false;
    }

    if (currentPlan === 'locked-in') {
      return false;
    }

    if (currentPlan === 'committed') {
      return normalizedPlanName === 'locked-in';
    }

    if (currentPlan === 'cooked') {
      return normalizedPlanName !== 'cooked';
    }

    return false;
  };

  const getButtonText = (planName: string) => {
    if (isCurrentPlan(planName)) {
      return t('pricing.buttons.currentPlan');
    }
    if (planName === 'cooked') {
      return currentPlan === 'cooked' ? t('pricing.buttons.freePlan') : t('pricing.buttons.freeTier');
    }
    return currentPlan === 'cooked' ? t('pricing.buttons.upgradeNow') : t('pricing.buttons.switchPlan');
  };

  const handlePlanChange = async (plan: typeof plans[0]) => {
    if (isCurrentPlan(plan.name)) {
      return;
    }

    if (!isPlanSelectable(plan.name)) {
      return;
    }

    if (!userId) {
      navigate('/signup');
      return;
    }

    if (!plan.priceIds.monthly && !plan.priceIds.yearly) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const priceId = isYearly ? plan.priceIds.yearly : plan.priceIds.monthly;
      if (!priceId) {
        throw new Error(t('pricing.errors.invalidPlan'));
      }

      const result = await createCheckoutSession(priceId, userId, true);
      if (!result.success) {
        throw new Error(result.error || t('pricing.errors.checkoutFailed'));
      }
    } catch (error) {
      console.error('Error handling plan change:', error);
      setError(error instanceof Error ? error.message : t('pricing.errors.planChangeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6"
          >
            {t('pricing.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-12"
          >
            {t('pricing.subtitle')}
          </motion.p>

          <div className="inline-flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !isYearly ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow dark:shadow-gray-900/50' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('pricing.billing.monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isYearly ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow dark:shadow-gray-900/50' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('pricing.billing.yearly')}
              <span className="ml-1.5 text-xs text-green-500 dark:text-green-400 font-medium">{t('pricing.billing.savePercent')}</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-12">
          <Link
            to="/purchase-messages"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-700/50 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-200 group"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{t('pricing.messages.needMore')}</span>
            <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline">
              {t('pricing.messages.purchase')}
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${plan.popular ? 'md:scale-110 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-9 left-0 right-0 flex justify-center">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 text-white px-6 py-1.5 rounded-full text-sm font-medium shadow-lg dark:shadow-purple-900/30">
                    {t('pricing.plans.popular')}
                  </div>
                </div>
              )}

              <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-100 dark:border-gray-800 h-full flex flex-col relative overflow-hidden group hover:shadow-2xl dark:hover:shadow-purple-900/20 transition-all duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="mb-8">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${plan.gradient} p-3 mb-6`}>
                    {plan.renderIcon ? (
                      <plan.renderIcon />
                    ) : (
                      <plan.icon className="w-full h-full text-white" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t(`pricing.planNames.${plan.name}`)}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      £{isYearly ? plan.yearlyPrice : plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{t('pricing.billing.pricePerMonth')}</span>
                    {isYearly && plan.price > 0 && (
                      <p className="text-sm text-green-500 dark:text-green-400 mt-1">
                        {t('pricing.billing.yearlyDiscount', { amount: ((plan.price - plan.yearlyPrice) * 12).toFixed(2) })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-grow space-y-6">
                  {plan.features.map((category) => (
                    <div key={category.title} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <category.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t(`pricing.plans.features.${category.title}`)}</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {(t(`pricing.features.${plan.name}.${category.items}`, { returnObjects: true }) as string[]).map((feature: string, featureIndex: number) => (
                          <motion.li
                            key={featureIndex}
                            className="flex items-start gap-2 group/feature"
                            onMouseEnter={() => setHoveredFeature(`${plan.name}-${category.title}-${featureIndex}`)}
                            onMouseLeave={() => setHoveredFeature(null)}
                            whileHover={{ x: 4 }}
                          >
                            <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 dark:text-gray-400 text-sm group-hover/feature:text-gray-900 dark:group-hover/feature:text-gray-200 transition-colors">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanChange(plan)}
                  disabled={!isPlanSelectable(plan.name) || isLoading}
                  aria-disabled={!isPlanSelectable(plan.name) || isLoading}
                  tabIndex={isCurrentPlan(plan.name) ? -1 : undefined}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${
                    plan.gradient
                  } transform transition-all duration-200 ${
                    isPlanSelectable(plan.name) && !isLoading ? 'hover:scale-[1.02]' : ''
                  } ${
                    plan.popular ? 'shadow-lg dark:shadow-purple-900/30' : ''
                  } ${
                    isCurrentPlan(plan.name) ? 'opacity-50 cursor-not-allowed' : ''
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 mt-8`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  ) : (
                    getButtonText(plan.name)
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {error && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {showStatusMessage && (
          <SubscriptionStatusMessage
            action={statusMessageType}
            currentPeriodEnd={currentPeriodEnd}
            onClose={() => setShowStatusMessage(false)}
          />
        )}
      </div>
    </div>
  );
}