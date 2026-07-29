import React from 'react';
import { FileText, ArrowLeft, Download } from 'lucide-react';

export default function CargoOSMSAPage() {
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
            <h1 className="text-3xl font-bold">Master Services Agreement</h1>
          </div>
          <p className="text-gray-400 text-sm">CargoOS by <span className="whitespace-nowrap">Gasp Maker LLC</span> — Effective upon execution</p>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This MSA becomes legally binding only when signed by both parties. To request a signed copy, contact <a href="mailto:hello@cargoos.io" className="underline">hello@cargoos.io</a>.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white max-w-4xl mx-auto px-6 py-12 space-y-10">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Parties</h2>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
            <p><strong className="text-gray-900">Service Provider:</strong> Gasp Maker LLC, a Florida limited liability company, 1861 NW 22nd St, Miami, FL 33142 ("CargoOS")</p>
            <p><strong className="text-gray-900">Operator:</strong> The business entity identified in the Order Form executed in connection with this Agreement ("Operator")</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Services</h2>
          <p className="text-gray-600 leading-relaxed">
            CargoOS agrees to provide the Operator with access to the CargoOS white-label freight management platform ("Platform") as described in the applicable Order Form. Services include shipment management, client portal, virtual mailbox management, local delivery coordination, billing tools, and carrier integrations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Term & Renewal</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>This Agreement begins on the date the Operator's account is activated ("Effective Date") and continues on a month-to-month basis unless terminated as provided herein.</p>
            <p>Either party may terminate this Agreement by providing 30 days written notice to the other party.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Fees & Payment</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p><strong className="text-gray-900">3.1 Setup Fee:</strong> A one-time, non-refundable setup fee of $500 USD is due upon execution of this Agreement.</p>
            <p><strong className="text-gray-900">3.2 Monthly Fees:</strong> Monthly subscription fees are due in advance on the first day of each billing cycle per the selected plan.</p>
            <p><strong className="text-gray-900">3.3 Late Payment:</strong> Amounts unpaid after 7 days may result in service suspension. CargoOS reserves the right to charge a late fee of 1.5% per month on outstanding balances.</p>
            <p><strong className="text-gray-900">3.4 Price Changes:</strong> CargoOS may adjust pricing with 30 days written notice. Continued use after the effective date constitutes acceptance.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Ownership & Processing</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p><strong className="text-gray-900">4.1 Operator as Data Controller:</strong> The Operator is the sole Data Controller of all End User data processed through the Platform. CargoOS acts exclusively as a Data Processor.</p>
            <p><strong className="text-gray-900">4.2 CargoOS Obligations:</strong> CargoOS shall process End User data only as instructed by the Operator and only to the extent necessary to provide the Platform services. CargoOS shall not use End User data for its own marketing, analytics beyond platform operations, or any commercial purpose.</p>
            <p><strong className="text-gray-900">4.3 Data Export:</strong> Upon written request, CargoOS shall provide the Operator with a complete export of their data in a standard machine-readable format (CSV/JSON) within 30 business days.</p>
            <p><strong className="text-gray-900">4.4 Data Deletion:</strong> Upon termination of this Agreement, CargoOS shall permanently delete all Operator and End User data from its systems within 90 days of the subscription end date, provided that a data export has been delivered to the Operator or waived in writing.</p>
            <p><strong className="text-gray-900">4.5 Subprocessors:</strong> CargoOS uses the following subprocessors: Supabase (database), Vercel (hosting), Stripe (payments), EasyPost (shipping), Resend (email). CargoOS shall notify the Operator at least 30 days before adding new subprocessors.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Confidentiality</h2>
          <p className="text-gray-600 leading-relaxed">
            Each party agrees to keep confidential all non-public information received from the other party ("Confidential Information") and not to disclose it to third parties without prior written consent. This obligation survives termination of this Agreement for a period of 3 years.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p><strong className="text-gray-900">6.1 Platform:</strong> CargoOS retains all intellectual property rights to the Platform, including software, design, algorithms, and documentation.</p>
            <p><strong className="text-gray-900">6.2 Operator Content:</strong> The Operator retains all rights to its brand assets, customer data, and business content uploaded to the Platform.</p>
            <p><strong className="text-gray-900">6.3 License:</strong> CargoOS grants the Operator a limited, non-exclusive, non-transferable license to use the Platform during the term of this Agreement.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Operator Responsibilities</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
            <li>Comply with all applicable laws, including USPS regulations (39 CFR Part 111) for virtual mailbox services.</li>
            <li>Obtain proper consent from End Users for data collection and processing.</li>
            <li>Maintain secure API credentials for Stripe and EasyPost accounts.</li>
            <li>Not use the Platform for illegal activities, fraud, or violation of third-party terms.</li>
            <li>Ensure accuracy of all shipment and billing information entered into the Platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Limitation of Liability</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>To the maximum extent permitted by applicable law, CargoOS's total liability under this Agreement shall not exceed the total fees paid by the Operator in the three (3) months immediately preceding the claim.</p>
            <p>In no event shall CargoOS be liable for indirect, incidental, consequential, or punitive damages, including lost profits, lost data, or business interruption, even if advised of the possibility of such damages.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Indemnification</h2>
          <p className="text-gray-600 leading-relaxed">
            The Operator agrees to indemnify, defend, and hold harmless <span className="whitespace-nowrap">Gasp Maker LLC</span> and its officers, employees, and agents from any claims, damages, or expenses (including reasonable attorney's fees) arising from: (a) the Operator's use of the Platform in violation of this Agreement; (b) the Operator's violation of applicable law; or (c) claims by End Users related to the Operator's business operations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Warranties & Disclaimers</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>CargoOS warrants that it will provide the Platform in a professional manner consistent with industry standards.</p>
            <p>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. CARGOOOS DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF SECURITY VULNERABILITIES.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Governing Law & Dispute Resolution</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>This Agreement shall be governed by the laws of the State of Florida, without regard to its conflict of law provisions.</p>
            <p>Any dispute arising under this Agreement shall first be submitted to good-faith mediation. If mediation fails, disputes shall be resolved by binding arbitration in Miami-Dade County, Florida, under the rules of the American Arbitration Association.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">12. Entire Agreement</h2>
          <p className="text-gray-600 leading-relaxed">
            This Agreement, together with the applicable Order Form and Privacy Policy, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, representations, and understandings.
          </p>
        </section>

        {/* Signature Block */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Service Provider</p>
              <p className="text-sm text-gray-600 font-bold">Gasp Maker LLC</p>
              <p className="text-sm text-gray-600">CargoOS</p>
              <div className="mt-6 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-400">Authorized Signature</p>
              </div>
              <div className="mt-4 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-400">Date</p>
              </div>
            </div>
            <div className="p-5 border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Operator</p>
              <div className="mt-1 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-400">Company Name</p>
              </div>
              <div className="mt-4 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-400">Authorized Signature</p>
              </div>
              <div className="mt-4 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-400">Date</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            To request a countersigned copy of this agreement, contact <a href="mailto:hello@cargoos.io" className="text-black underline">hello@cargoos.io</a>
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="bg-black py-8 text-center text-sm text-gray-500">
        © 2026 CargoOS by Gasp Maker LLC. All rights reserved.
      </div>

    </div>
  );
}