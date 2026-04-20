'use client';

import { useState, useEffect } from 'react';
import razorpayDebugFrontend from '@/lib/razorpay-debug-frontend';

/**
 * Razorpay Debug & Test Component
 * 
 * This component provides a minimal interface for testing Razorpay payment flow
 * without modifying the existing UI. It can be conditionally rendered in development mode.
 * 
 * Usage:
 * - Import this component into your page
 * - Render it conditionally: {process.env.NODE_ENV === 'development' && <RazorpayDebugComponent />}
 * - Use the browser console directly with window.razorpayDebugFrontend
 */

interface OrderData {
  id: string;
  total: number;
}

export default function RazorpayDebugComponent() {
  const [orderId, setOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [showConsoleHint, setShowConsoleHint] = useState(false);

  useEffect(() => {
    // Check if Razorpay script is loaded
    razorpayDebugFrontend.checkRazorpayScript();
  }, []);

  const handleCreateOrder = async () => {
    if (!orderId) {
      alert('Please enter an Order ID');
      razorpayDebugFrontend.getLogs(); // Trigger any logs
      return;
    }

    setIsLoading(true);
    try {
      const data = await razorpayDebugFrontend.testCreateOrder(orderId, amount);
      setOrderData(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckout = async () => {
    if (!orderData) {
      alert('Please create an order first');
      return;
    }

    await razorpayDebugFrontend.testOpenCheckout(orderData);
  };

  const handlePrintReport = () => {
    razorpayDebugFrontend.printReport();
    setShowConsoleHint(true);
  };

  const handleExportLogs = () => {
    const logs = razorpayDebugFrontend.exportLogs();
    console.log('📥 Exported Logs:');
    console.log(logs);
    alert('Logs exported to console. Check the browser console to copy them.');
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="space-y-4">
        <div className="bg-blue-100 border border-blue-300 rounded p-2">
          <h3 className="font-bold text-sm text-blue-900">🔧 Razorpay Debug Panel (Dev Only)</h3>
          <p className="text-xs text-blue-800 mt-1">Use this to test payment flow in development</p>
        </div>

        {/* Order ID Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Order ID
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter MongoDB ObjectId"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Use an existing order ID from your database</p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCreateOrder}
            disabled={isLoading || !orderId}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-3 rounded text-sm"
          >
            {isLoading ? '⏳ Creating Order...' : '✅ Step 1: Create Order'}
          </button>

          <button
            onClick={handleOpenCheckout}
            disabled={!orderData}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-3 rounded text-sm"
          >
            💳 Step 2: Open Checkout
          </button>

          {orderData && (
            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
              <p className="font-semibold text-green-700">✅ Order Created</p>
              <p className="text-green-600 break-all">Order ID: {orderData.razorpay_order_id}</p>
            </div>
          )}
        </div>

        {/* Utility Buttons */}
        <div className="border-t pt-2 space-y-1">
          <button
            onClick={handlePrintReport}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded text-sm"
          >
            📊 Print Debug Report
          </button>

          <button
            onClick={handleExportLogs}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-1 px-2 rounded text-sm"
          >
            📥 Export Logs
          </button>

          <button
            onClick={() => {
              razorpayDebugFrontend.clearLogs();
              setOrderData(null);
              setOrderId('');
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded text-sm"
          >
            🗑️ Clear All
          </button>
        </div>

        {showConsoleHint && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
            📋 Check browser console (F12) for detailed debug report
          </div>
        )}

        {/* Console Access Hint */}
        <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-700">
          <p className="font-semibold">💻 Browser Console Commands:</p>
          <p className="text-gray-600 mt-1">
            Open DevTools (F12) and run:
          </p>
          <code className="block bg-gray-100 p-1 rounded mt-1 text-xs overflow-auto">
            window.razorpayDebugFrontend.printReport()
          </code>
        </div>
      </div>
    </div>
  );
}
