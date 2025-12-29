import { useState } from 'react';
import { Smartphone, Loader } from 'lucide-react';
import { api } from '@/services/api';

interface PaymentWidgetProps {
  transactionId: string;
  amount: number;
  buyerName: string;
  onPaymentSuccess?: () => void;
}

export function PaymentWidget({ transactionId, amount, onPaymentSuccess }: PaymentWidgetProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  const handleSTKPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.request('/api/v1/payments/initiate-stk', {
        method: 'POST',
        body: {
          transactionId,
          phoneNumber,
          amount,
        },
      });

      if (response.success && response.data) {
        const data = response.data as { checkoutRequestID: string };
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus(data.checkoutRequestID);
      } else {
        setError(response.error || 'Failed to initiate payment');
        setPaymentStatus('failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = (_checkoutId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.request('/api/v1/payments/check-status', {
          method: 'POST',
          body: { transactionId },
          requireAuth: false,
        });

        const txData = response.data as { status: string };
        if (txData.status === 'PAID') {
          setPaymentStatus('success');
          clearInterval(pollInterval);
          onPaymentSuccess?.();
        } else if (txData.status === 'CANCELLED') {
          setPaymentStatus('failed');
          clearInterval(pollInterval);
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="text-primary" size={20} />
        <h3 className="font-bold text-lg text-foreground">Pay with M-Pesa</h3>
      </div>

      {paymentStatus === 'idle' && (
        <form onSubmit={handleSTKPush} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number (254XXXXXXXXX)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2547xxxxxxxx"
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Amount:</p>
            <p className="text-2xl font-bold text-foreground">KES {amount.toLocaleString()}</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Initiating...
              </>
            ) : (
              'Send STK Push'
            )}
          </button>
        </form>
      )}

      {paymentStatus === 'pending' && (
        <div className="text-center py-8">
          <div className="inline-block">
            <Loader size={40} className="text-primary animate-spin mb-4" />
          </div>
          <p className="text-foreground font-medium">Waiting for PIN prompt on {phoneNumber}</p>
          <p className="text-sm text-muted-foreground mt-2">Check your phone for the M-Pesa PIN prompt</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-primary font-bold">Payment Successful!</p>
          <p className="text-sm text-primary/80 mt-2">Transaction ID: {transactionId}</p>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-destructive font-bold">Payment Failed</p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
