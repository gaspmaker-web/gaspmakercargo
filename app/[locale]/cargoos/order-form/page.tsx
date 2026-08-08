import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function CargoOSOrderFormPage() {
  return (
    <div className="min-h-screen font-sans">
      
      {/* Header */}
      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <a href="/en/cargoos" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to CargoOS
          </a>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-white" size={28} />
            <h1 className="text-3xl font-bold">Order Form</h1>
          </div>
          <p className="text-gray-400 text-sm">CargoOS by <span className="whitespace-nowrap">Gasp Maker LLC</span> — To be executed alongside the Master Services Agreement</p>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This Order Form is legally binding only when signed by both parties alongside the MSA. To request a signed copy, contact <a href="mailto:hello@cargoos.io" className="underline">hello@cargoos.io</a>.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Parties */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Parties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Provider</p>
              <p><strong className="text-gray-900">Gasp Maker LLC</strong></p>
              <p>CargoOS Platform</p>
              <p>1861 NW 22nd St, Miami, FL 33142</p>
              <p>hello@cargoos.io</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operator</p>
              <div className="space-y-3 mt-2">
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-[10px] text-gray-400 uppercase">Company Name</p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-[10px] text-gray-400 uppercase">Contact Name</p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-[10px] text-gray-400 uppercase">Email</p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-[10px] text-gray-400 uppercase">Phone</p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-[10px] text-gray-400 uppercase">Business Address</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Plan Selected */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Selected Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">Plan</th>
                  <th className="text-center p-4 font-bold text-gray-700 border-b border-gray-200">Monthly Fee</th>
                  <th className="text-center p-4 font-bold text-gray-700 border-b border-gray-200">Setup Fee</th>
                  <th className="text-center p-4 font-bold text-gray-700 border-b border-gray-200">Selected</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">Starter</p>
                    <p className="text-xs text-gray-500">1 warehouse · Up to 50 clients · All carriers · Client portal</p>
                  </td>
                  <td className="p-4 text-center font-bold">$149/mo</td>
                  <td className="p-4 text-center font-bold">$500</td>
                  <td className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 bg-black/5">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">Growth</p>
                    <p className="text-xs text-gray-500">1 warehouse · Unlimited clients · Local delivery · Priority support</p>
                  </td>
                  <td className="p-4 text-center font-bold">$299/mo</td>
                  <td className="p-4 text-center font-bold">$500</td>
                  <td className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">Pro</p>
                    <p className="text-xs text-gray-500">2 warehouses · Multiple admins · Live driver tracking · Custom integrations</p>
                  </td>
                  <td className="p-4 text-center font-bold">$499/mo</td>
                  <td className="p-4 text-center font-bold">$500</td>
                  <td className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Order Details */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4 text-sm">
              <div className="border-b border-gray-300 pb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Service Start Date</p>
                <p className="text-gray-300">___________________________</p>
              </div>
              <div className="border-b border-gray-300 pb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Billing Cycle Start</p>
                <p className="text-gray-300">___________________________</p>
              </div>
              <div className="border-b border-gray-300 pb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Custom Domain (if applicable)</p>
                <p className="text-gray-300">___________________________</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Primary Admin Email</p>
                <p className="text-gray-300">___________________________</p>
              </div>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4 text-sm">
              <div className="border-b border-gray-300 pb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">EasyPost Account</p>
                <p className="text-[10px] text-gray-500">Operator must provide their own EasyPost API Key</p>
                <p className="text-gray-300 mt-1">___________________________</p>
              </div>
              <div className="border-b border-gray-300 pb-3">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Stripe Account</p>
                <p className="text-[10px] text-gray-500">Operator must provide their own Stripe Keys</p>
                <p className="text-gray-300 mt-1">___________________________</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Special Requirements / Notes</p>
                <p className="text-gray-300 mt-1">___________________________</p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Payment Summary</h2>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">One-time Setup Fee</span>
              <span className="font-bold text-gray-900">$500.00 USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Subscription (Selected Plan)</span>
              <span className="font-bold text-gray-900">$_____ USD/mo</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Due Today</span>
              <span className="font-bold text-gray-900">$500.00 USD</span>
            </div>
            <p className="text-xs text-gray-400">Monthly subscription begins on the Service Start Date. Payment processed via Stripe.</p>
          </div>
        </section>

        {/* Terms Reference */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Incorporated Documents</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            This Order Form is incorporated into and subject to the Master Services Agreement (MSA) between the parties. In the event of any conflict between this Order Form and the MSA, the MSA shall prevail. Both documents are available at <a href="https://cargoos.io/en/cargoos/msa" className="text-black underline">cargoos.io/en/cargoos/msa</a>.
          </p>
        </section>

        {/* Signatures */}
        <section className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to Sign?</h2>
          <p className="text-gray-600 text-sm mb-4">
            Request this Order Form pre-filled and ready to sign via DocuSign within 1 business day.
          </p>
          <a 
            href="mailto:hello@cargoos.io?subject=Order Form Request — CargoOS&body=Company name: %0APlan selected: %0AContact name: %0APhone: %0AWebsite: " 
            className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Request Order Form →
          </a>
          <p className="text-xs text-gray-400 mt-3">Powered by DocuSign · Legally binding in Florida and most jurisdictions</p>
        </section>

      </div>

      {/* Footer */}
      <div className="bg-black py-8 text-center text-sm text-gray-500">
        © 2026 CargoOS by Gasp Maker LLC. All rights reserved.
      </div>

    </div>
  );
}