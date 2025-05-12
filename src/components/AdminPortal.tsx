import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, collectionGroup, getDocs, DocumentData, QueryDocumentSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

const ADMIN_IDS = ['yOFRGcwpmeXLgx9cjpzOmU8M5AH2', 'mUY3I3KqiDRWMXayZpUzJGNxcU03', 'I2OvKjj6QoTIEuLRjdHpOUnPWdk2'];

interface Stats {
  totalCustomers: number;
  totalPaidCustomers: number;
  pendingCheckouts: number;
  totalRevenueUSD: number;
  totalRevenueGBP: number;
  totalCancelledCustomers: number;
  cancellationRate: number;
}

interface ConversionRecord {
  id: string;
  totalUsers: number;
  paidCustomers: number;
  conversionRate: number;
  timestamp: Date;
}

interface UserData {
  uid: string;
  email: string;
  name: string;
  created_at: any; // Firestore timestamp
}

interface PaymentData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  payments: Array<{
    amount: number;
    created: any;
  }>;
  membershipStatus: 'active' | 'cancelled';
}

interface FailedCustomerData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  failureType: 'abandoned_checkout' | 'failed_payment';
  amount?: number;
  created: any;
}

interface EdgeCustomerData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  created: any;
}

const AdminPortal: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalPaidCustomers: 0,
    pendingCheckouts: 0,
    totalRevenueUSD: 0,
    totalRevenueGBP: 0,
    totalCancelledCustomers: 0,
    cancellationRate: 0,
  });
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [downloadingUsers, setDownloadingUsers] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [paidCustomers, setPaidCustomers] = useState<PaymentData[]>([]);
  const [showPaidCustomers, setShowPaidCustomers] = useState(true);
  const [failedCustomers, setFailedCustomers] = useState<FailedCustomerData[]>([]);
  const [showFailedCustomers, setShowFailedCustomers] = useState(true);
  const [edgeCustomers, setEdgeCustomers] = useState<EdgeCustomerData[]>([]);
  const [showEdgeCustomers, setShowEdgeCustomers] = useState(true);
  const [downloadingPaidCustomers, setDownloadingPaidCustomers] = useState(false);
  const [downloadingFailedCustomers, setDownloadingFailedCustomers] = useState(false);
  const [downloadingEdgeCustomers, setDownloadingEdgeCustomers] = useState(false);
  const navigate = useNavigate();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }
      // Handle string dates
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'N/A';
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !ADMIN_IDS.includes(user.uid)) {
        navigate('/', { replace: true });
        return;
      }

      // Listen to users collection
      const usersQuery = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const userData: UserData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include users with valid emails
          if (data.email && data.email !== 'N/A') {
            userData.push({
              uid: doc.id,
              email: data.email,
              name: data.name || 'N/A',
              created_at: data.created_at,
            });
          }
        });
        setUsers(userData);
      });

      // Listen to customers collection
      const customersQuery = query(collection(db, 'customers'));
      const unsubscribeCustomers = onSnapshot(customersQuery, async (snapshot) => {
        const totalCustomers = snapshot.size;

        // Get all payments subcollections
        const paymentsQuery = query(collectionGroup(db, 'payments'));
        const paymentsSnapshot = await getDocs(paymentsQuery);

        // Get unique customer IDs who have payments and calculate total revenue
        const customersWithPayments = new Set<string>();
        const customersWithCancellations = new Set<string>();
        let totalRevenueUSD = 0;
        let totalRevenueGBP = 0;
        
        // First pass: identify all customers who have ever made a successful payment
        const successfulCustomers = new Set<string>();
        for (const doc of paymentsSnapshot.docs) {
          const customerId = doc.ref.parent.parent?.id;
          const data = doc.data();
          const amountReceived = data.amount_received || 0;

          if (customerId && amountReceived > 0) {
            successfulCustomers.add(customerId);
          }
        }
        
        // Track failed payments (only for customers who never succeeded)
        const failedPaymentsMap = new Map<string, FailedCustomerData>();
        
        // Second pass: process payments and track failures
        for (const doc of paymentsSnapshot.docs) {
          const customerId = doc.ref.parent.parent?.id;
          const data = doc.data();
          const amountReceived = data.amount_received || 0;
          const amount = data.amount || 0;

          if (customerId) {
            // Only track failed payments for customers who never succeeded
            if (amount > 0 && amountReceived === 0 && !successfulCustomers.has(customerId)) {
              if (!failedPaymentsMap.has(customerId)) {
                const customerDoc = await getDocs(query(
                  collection(db, 'users'),
                  where('uid', '==', customerId)
                ));
                const customerData = customerDoc.docs[0]?.data();
                if (customerData) {
                  failedPaymentsMap.set(customerId, {
                    customerId,
                    customerName: customerData.name || 'N/A',
                    customerEmail: customerData.email || 'N/A',
                    failureType: 'failed_payment',
                    amount,
                    created: data.created
                  });
                }
              }
            }

            // Process successful payments
            if (amountReceived > 0) {
              customersWithPayments.add(customerId);
              if (amountReceived === 1699 || amountReceived === 899) {
                totalRevenueUSD += amountReceived;
              } else {
                totalRevenueGBP += amountReceived;
              }

              // Check cancellation status
              const isCancelled = await checkCancellationStatus(customerId);
              if (isCancelled) {
                customersWithCancellations.add(customerId);
              }
            }
          }
        }

        // Get abandoned checkouts (excluding successful customers)
        const abandonedCheckouts: FailedCustomerData[] = [];
        const checkoutQuery = query(collection(db, 'checkout_sessions'));
        const checkoutSnapshot = await getDocs(checkoutQuery);
        
        for (const doc of checkoutSnapshot.docs) {
          const data = doc.data();
          const customerId = data.customer;
          
          // Skip if customer has any successful payments
          if (customerId && !successfulCustomers.has(customerId)) {
            const customerDoc = await getDocs(query(
              collection(db, 'users'),
              where('uid', '==', customerId)
            ));
            const customerData = customerDoc.docs[0]?.data();
            if (customerData) {
              abandonedCheckouts.push({
                customerId,
                customerName: customerData.name || 'N/A',
                customerEmail: customerData.email || 'N/A',
                failureType: 'abandoned_checkout',
                created: data.created
              });
            }
          }
        }

        // Combine failed payments and abandoned checkouts
        setFailedCustomers([...failedPaymentsMap.values(), ...abandonedCheckouts].sort((a, b) => {
          const dateA = a.created?.seconds || 0;
          const dateB = b.created?.seconds || 0;
          return dateB - dateA;
        }));

        const totalPaidCustomers = customersWithPayments.size;
        const totalCancelledCustomers = customersWithCancellations.size;
        const cancellationRate = totalPaidCustomers > 0 
          ? (totalCancelledCustomers / totalPaidCustomers) * 100 
          : 0;

        // After processing all payments and failed customers, get edge customers
        const edgingCustomers: EdgeCustomerData[] = [];
        for (const doc of snapshot.docs) {
          const customerId = doc.id;
          
          // Skip if customer has payments or is in failed customers
          if (!customersWithPayments.has(customerId) && !failedPaymentsMap.has(customerId)) {
            const customerDoc = await getDocs(query(
              collection(db, 'users'),
              where('uid', '==', customerId)
            ));
            const customerData = customerDoc.docs[0]?.data();
            if (customerData) {
              edgingCustomers.push({
                customerId,
                customerName: customerData.name || 'N/A',
                customerEmail: customerData.email || 'N/A',
                created: customerData.created_at
              });
            }
          }
        }

        setEdgeCustomers(edgingCustomers.sort((a, b) => {
          const dateA = a.created?.seconds || 0;
          const dateB = b.created?.seconds || 0;
          return dateB - dateA;
        }));

        setStats(prev => ({
          ...prev,
          totalCustomers,
          totalPaidCustomers,
          totalRevenueUSD,
          totalRevenueGBP,
          totalCancelledCustomers,
          cancellationRate,
        }));
      });

      // Listen to checkout sessions
      const checkoutQuery = query(
        collection(db, 'checkout_sessions'),
        where('status', '==', 'pending')
      );
      
      const unsubscribeCheckouts = onSnapshot(checkoutQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingCheckouts: snapshot.size,
        }));
      });

      // Listen to conversion history
      const historyQuery = query(
        collection(db, 'conversion_history'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        })) as ConversionRecord[];
        setConversionHistory(history);
      });

      // Listen to payments collection group
      const paymentsQuery = query(collectionGroup(db, 'payments'));
      const unsubscribePayments = onSnapshot(paymentsQuery, async (snapshot) => {
        const paymentsMap = new Map<string, PaymentData>();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const customerId = doc.ref.parent.parent?.id;
          const amountReceived = data.amount_received || 0;
          
          // Only process payments where amount_received is greater than 0
          if (customerId && amountReceived > 0) {
            if (!paymentsMap.has(customerId)) {
              // Get customer details only once per customer
              const customerDoc = await getDocs(query(
                collection(db, 'users'),
                where('uid', '==', customerId)
              ));

              const customerData = customerDoc.docs[0]?.data();
              if (customerData) {
                const isCancelled = await checkCancellationStatus(customerId);
                paymentsMap.set(customerId, {
                  customerId,
                  customerName: customerData.name || 'N/A',
                  customerEmail: customerData.email || 'N/A',
                  payments: [],
                  membershipStatus: isCancelled ? 'cancelled' : 'active'
                });
              }
            }

            // Add this payment to the customer's payments array
            const customerPayments = paymentsMap.get(customerId);
            if (customerPayments) {
              customerPayments.payments.push({
                amount: amountReceived,
                created: data.created
              });
            }
          }
        }

        // Convert map to array and sort payments for each customer
        const paymentsData = Array.from(paymentsMap.values()).map(customer => ({
          ...customer,
          payments: customer.payments.sort((a, b) => {
            const dateA = a.created?.seconds || 0;
            const dateB = b.created?.seconds || 0;
            return dateB - dateA;
          })
        }));

        setPaidCustomers(paymentsData);
      });

      setLoading(false);

      return () => {
        unsubscribeUsers();
        unsubscribeCustomers();
        unsubscribeCheckouts();
        unsubscribeHistory();
        unsubscribePayments();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleRecordConversion = async () => {
    if (totalUsers <= 0) {
      alert('Please enter a valid number of total users');
      return;
    }

    try {
      const conversionRate = (stats.totalPaidCustomers / totalUsers) * 100;
      await addDoc(collection(db, 'conversion_history'), {
        totalUsers,
        paidCustomers: stats.totalPaidCustomers,
        conversionRate,
        timestamp: new Date(),
      });

      setTotalUsers(0); // Reset the input
    } catch (error) {
      console.error('Error recording conversion:', error);
      alert('Failed to record conversion rate');
    }
  };

  const downloadUsersCsv = () => {
    setDownloadingUsers(true);
    try {
      // Create CSV content
      const csvContent = [
        ['Name', 'Email'], // Header
        ...users.map(user => [
          user.name,
          user.email
        ])
      ].map(row => row.join(',')).join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading users:', error);
      alert('Failed to download users');
    } finally {
      setDownloadingUsers(false);
    }
  };

  const downloadPaidCustomersCsv = () => {
    setDownloadingPaidCustomers(true);
    try {
      const csvContent = [
        ['Name', 'Email', 'Status', 'Payments'], // Header
        ...paidCustomers.map(customer => [
          customer.customerName,
          customer.customerEmail,
          customer.membershipStatus,
          customer.payments.map(p => `${p.amount/100}`).join(';')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `paid_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading paid customers:', error);
      alert('Failed to download paid customers');
    } finally {
      setDownloadingPaidCustomers(false);
    }
  };

  const downloadFailedCustomersCsv = () => {
    setDownloadingFailedCustomers(true);
    try {
      const csvContent = [
        ['Name', 'Email', 'Failure Type', 'Amount', 'Date'], // Header
        ...failedCustomers.map(customer => [
          customer.customerName,
          customer.customerEmail,
          customer.failureType,
          customer.amount ? (customer.amount/100).toString() : 'N/A',
          formatTimestamp(customer.created)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `failed_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading failed customers:', error);
      alert('Failed to download failed customers');
    } finally {
      setDownloadingFailedCustomers(false);
    }
  };

  const downloadEdgeCustomersCsv = () => {
    setDownloadingEdgeCustomers(true);
    try {
      const csvContent = [
        ['Name', 'Email', 'Created At'], // Header
        ...edgeCustomers.map(customer => [
          customer.customerName,
          customer.customerEmail,
          formatTimestamp(customer.created)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `edge_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading edge customers:', error);
      alert('Failed to download edge customers');
    } finally {
      setDownloadingEdgeCustomers(false);
    }
  };

  const checkCancellationStatus = async (customerId: string): Promise<boolean> => {
    try {
      const cancellationRef = collection(db, 'customers', customerId, 'cancellation_requests');
      const cancellationSnapshot = await getDocs(cancellationRef);
      return !cancellationSnapshot.empty;
    } catch (error) {
      console.error('Error checking cancellation status:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Total Customers</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.totalCustomers}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Paid Customers</h2>
          <p className="text-4xl font-bold text-green-600">{stats.totalPaidCustomers}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Cancelled Customers</h2>
          <div>
            <p className="text-4xl font-bold text-red-600">{stats.totalCancelledCustomers}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.cancellationRate.toFixed(1)}% cancellation rate
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed Customers</h2>
          <p className="text-4xl font-bold text-orange-600">{failedCustomers.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">USD Revenue</h2>
          <p className="text-4xl font-bold text-emerald-600 flex items-center gap-1">
            <DollarSign className="h-8 w-8" />
            {(stats.totalRevenueUSD / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">GBP Revenue</h2>
          <p className="text-4xl font-bold text-emerald-600 flex items-center gap-1">
            £{(stats.totalRevenueGBP / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Pending Checkouts</h2>
          <p className="text-4xl font-bold text-orange-600">{stats.pendingCheckouts}</p>
        </div>
      </div>

      {/* User List Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div 
          className="flex justify-between items-center mb-4 cursor-pointer"
          onClick={() => setShowUserList(!showUserList)}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              User List
              {showUserList ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Showing users with verified emails only</p>
          </div>
          {showUserList && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadUsersCsv();
              }}
              disabled={downloadingUsers}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {downloadingUsers ? 'Downloading...' : 'Download CSV'}
            </button>
          )}
        </div>
        {showUserList && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.uid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paid Customers Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div 
          className="flex justify-between items-center mb-4 cursor-pointer"
          onClick={() => setShowPaidCustomers(!showPaidCustomers)}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Paid Customers
              {showPaidCustomers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Customers who have made payments</p>
          </div>
          {showPaidCustomers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadPaidCustomersCsv();
              }}
              disabled={downloadingPaidCustomers}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {downloadingPaidCustomers ? 'Downloading...' : 'Download CSV'}
            </button>
          )}
        </div>
        {showPaidCustomers && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paidCustomers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-2">
                        {customer.payments.map((payment, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {payment.amount === 1699 || payment.amount === 899 ? (
                              <DollarSign className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-green-600">£</span>
                            )}
                            {(payment.amount / 100).toFixed(2)}
                            <span className="text-gray-500 text-xs ml-2">
                              ({formatTimestamp(payment.created)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.membershipStatus === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.membershipStatus === 'active' ? 'Active' : 'Cancelled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Failed Customers Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div 
          className="flex justify-between items-center mb-4 cursor-pointer"
          onClick={() => setShowFailedCustomers(!showFailedCustomers)}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Failed Customers
              {showFailedCustomers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Customers with failed or abandoned payments</p>
          </div>
          {showFailedCustomers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFailedCustomersCsv();
              }}
              disabled={downloadingFailedCustomers}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {downloadingFailedCustomers ? 'Downloading...' : 'Download CSV'}
            </button>
          )}
        </div>
        {showFailedCustomers && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failure Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failedCustomers.map((customer) => (
                  <tr key={`${customer.customerId}-${customer.failureType}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.failureType === 'abandoned_checkout'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.failureType === 'abandoned_checkout' ? 'Abandoned Checkout' : 'Failed Payment'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.amount ? `$${(customer.amount / 100).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(customer.created)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edging Customers Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div 
            className="cursor-pointer"
            onClick={() => setShowEdgeCustomers(!showEdgeCustomers)}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Edging Customers
              {showEdgeCustomers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Customers who created checkout but never attempted payment</p>
          </div>
          {showEdgeCustomers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadEdgeCustomersCsv();
              }}
              disabled={downloadingEdgeCustomers}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {downloadingEdgeCustomers ? 'Downloading...' : 'Download CSV'}
            </button>
          )}
        </div>
        {showEdgeCustomers && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {edgeCustomers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(customer.created)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversion Rate Calculator */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Conversion Rate</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="totalUsers" className="block text-sm font-medium text-gray-700 mb-1">
              Total Users
            </label>
            <input
              type="number"
              id="totalUsers"
              value={totalUsers}
              onChange={(e) => setTotalUsers(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter total users"
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Conversion Rate
            </label>
            <div className="text-2xl font-bold text-indigo-600">
              {totalUsers > 0 ? ((stats.totalPaidCustomers / totalUsers) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <button
            onClick={handleRecordConversion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Record
          </button>
        </div>
      </div>

      {/* Conversion History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Conversion History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Customers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conversionHistory.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalUsers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.paidCustomers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.conversionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal; 
