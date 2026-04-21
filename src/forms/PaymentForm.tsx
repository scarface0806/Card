'use client';

import { useFormContext } from 'react-hook-form';
import Card from '@/components/Card';
import { Check } from 'lucide-react';
import { CardTemplate } from '@/utils/cardTemplates';

const paymentMethods = [
  { id: 'card', label: 'Credit/Debit Card' },
  { id: 'upi', label: 'UPI' },
  { id: 'wallet', label: 'Digital Wallet' },
];

interface PaymentFormProps {
  template?: CardTemplate;
}

export default function PaymentForm({ template }: PaymentFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const selectedMethod = watch('payment.method');

  // Calculate pricing based on template
  const cardPrice = template?.priceValue || 599;
  const shippingFee = 0; // Free shipping
  const totalPrice = cardPrice + shippingFee;
  const templateName = template?.name || 'NFC Digital Card';
  const templateType = template?.type || 'basic';

  return (
    <div className="space-y-8">
      {/* Order Summary */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-white">Order Summary</h3>

          <div className="space-y-3 border-t border-primary/10 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">{templateName}</span>
              <span className="font-semibold text-white">₹{cardPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Card Type</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                templateType === 'premium' 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {templateType.charAt(0).toUpperCase() + templateType.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lifetime Access</span>
              <span className="font-semibold text-primary">Included</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping & Handling</span>
              <span className="font-semibold text-primary">FREE</span>
            </div>

            <div className="border-t border-primary/10 pt-4 flex justify-between">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-2xl font-bold text-primary">₹{totalPrice}</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-2">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-gray-200">One-time payment • No hidden charges</p>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Payment Method</h3>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/10 hover:border-primary/30'
              }`}
            >
              <input
                type="radio"
                value={method.id}
                {...register('payment.method', {
                  required: 'Payment method is required',
                })}
                className="w-4 h-4 cursor-pointer accent-teal-600"
              />
              <span className="ml-3 font-semibold text-white">{method.label}</span>
            </label>
          ))}
        </div>
        {errors.payment && 'method' in errors.payment && (
          <p className="text-red-500 text-sm">
            {errors.payment.method?.message as string}
          </p>
        )}
      </div>

      {/* Terms Agreement */}
      <label className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
        <input
          type="checkbox"
          {...register('payment.terms', {
            required: 'You must accept terms & conditions',
          })}
          className="w-4 h-4 mt-1 cursor-pointer accent-teal-600"
        />
        <span className="text-sm text-gray-400">
          I agree to the{' '}
          <a href="/terms-conditions" className="text-primary hover:underline font-semibold">
            Terms & Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="text-primary hover:underline font-semibold">
            Privacy Policy
          </a>
        </span>
      </label>
      {errors.payment && 'terms' in errors.payment && (
        <p className="text-red-500 text-sm">{errors.payment.terms?.message as string}</p>
      )}
    </div>
  );
}
