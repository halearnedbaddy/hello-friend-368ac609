import { Search, Eye, Loader, WifiOff, Radio } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '../StatusBadge';

interface BuyerOrdersProps {
  orders: any[];
  loading: boolean;
  error: string | null;
  isConnected?: boolean;
}

export function BuyerOrders({ orders, loading, error, isConnected = false }: BuyerOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter(order =>
    order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.includes(searchTerm) ||
    order.seller.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-bold">Failed to load orders</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Purchases</h2>
          <p className="text-sm text-gray-500">{orders.length} total orders</p>
        </div>
        {/* Live Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isConnected 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-gray-100 text-gray-500 border border-gray-200'
        }`}>
          {isConnected ? (
            <>
              <Radio size={14} className="animate-pulse" />
              Live Updates
            </>
          ) : (
            <>
              <WifiOff size={14} />
              Offline
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by item, ID, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Seller</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`transition-all duration-500 ${
                    order.lastUpdateLive 
                      ? 'bg-green-50 animate-pulse' 
                      : 'hover:bg-gray-50'
                  } ${selectedOrder === order.id ? 'ring-2 ring-green-500 ring-inset' : ''}`}
                  onClick={() => setSelectedOrder(order.id === selectedOrder ? null : order.id)}
                >
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {order.lastUpdateLive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      )}
                      {order.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.itemName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{order.seller.name}</p>
                      <p className="text-xs text-gray-500">{order.seller.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    KES {order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status as any} />
                      {order.lastUpdateLive && (
                        <span className="text-xs text-green-600 font-medium">Just updated!</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.updatedAt !== order.createdAt && (
                        <p className="text-xs text-gray-400">
                          Updated: {new Date(order.updatedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition" title="View Details">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Timeline - Show when order is selected */}
      {selectedOrder && (
        <OrderTimeline 
          order={filteredOrders.find(o => o.id === selectedOrder)} 
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

interface OrderTimelineProps {
  order: any;
  onClose: () => void;
}

function OrderTimeline({ order, onClose }: OrderTimelineProps) {
  if (!order) return null;

  const steps = [
    { status: 'PENDING', label: 'Order Placed', icon: '📝' },
    { status: 'PAID', label: 'Payment Received', icon: '💰' },
    { status: 'SHIPPED', label: 'Shipped', icon: '📦' },
    { status: 'DELIVERED', label: 'Delivered', icon: '🚚' },
    { status: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
    { status: 'COMPLETED', label: 'Completed', icon: '🎉' },
  ];

  const currentIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in slide-in-from-top-2">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Order Timeline</h3>
          <p className="text-sm text-gray-500">Track your order progress in real-time</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
        >
          ✕
        </button>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div 
          className="absolute left-6 top-0 w-0.5 bg-green-500 transition-all duration-500"
          style={{ height: `${Math.max(0, (currentIndex / (steps.length - 1)) * 100)}%` }}
        />

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isComplete = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.status} className="flex items-center gap-4 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl z-10 transition-all ${
                  isComplete 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                    : 'bg-gray-100 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-100 animate-pulse' : ''}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <Radio size={12} className="animate-pulse" />
                      Current status
                    </p>
                  )}
                </div>
                {isComplete && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
