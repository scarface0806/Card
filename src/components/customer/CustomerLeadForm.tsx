'use client';

import { useState } from 'react';
import { Loader2, MailCheck, SendHorizonal } from 'lucide-react';

interface CustomerLeadFormProps {
  customerId: string;
  customerName: string;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export default function CustomerLeadForm({ customerId, customerName }: CustomerLeadFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send message');
      }

      setStatus('success');
      setMessage(`Your message has been sent to ${customerName}.`);
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(39,30,20,0.08)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <SendHorizonal className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Send a message</h3>
          <p className="text-sm text-stone-500">Your enquiry goes straight to the customer email.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Name
            <input
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Visitor name"
              required
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Phone
            <input
              className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Visitor phone"
              required
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-stone-700">
          Email
          <input
            className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="visitor@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Message
          <textarea
            className="mt-1.5 min-h-32 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell them what you need"
            required
          />
        </label>

        {message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {status === 'success' ? <MailCheck className="h-4 w-4" /> : null}
              <span>{message}</span>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          Send message
        </button>
      </form>
    </div>
  );
}