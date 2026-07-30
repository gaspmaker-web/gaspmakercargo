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
            <p><strong className="text-gray-900">4.3 Data Export & Migration:</strong> Upon written request, CargoOS shall provide the Operator with a complete export of their data including: client records, shipment history, financial transactions, mailbox records, proof of delivery photos, and uploaded documents. Data will be delivered in standard machine-readable formats (CSV and JSON) within 30 business days. There are no fees or penalties for data export. CargoOS will not withhold or delay data export as a means of retaining Operators.</p>
            <p><strong className="text-gray-900">4.4 Data Deletion:</strong> Upon termination, CargoOS will first deliver the complete data export to the Operator. After written confirmation of receipt — or written waiver by the Operator — CargoOS shall permanently delete all Operator and End User data from its systems within 90 days. CargoOS will provide written confirmation of deletion upon request.</p>
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
        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Service Availability & Support (SLA)</h2>
        <div className="space-y-3 text-gray-600 leading-relaxed">
           <p><strong className="text-gray-900">Uptime Target:</strong> CargoOS targets 99.5% monthly uptime, excluding scheduled maintenance. Our infrastructure providers — Vercel and Supabase — maintain 99.9%+ uptime on their end.</p>
          <p><strong className="text-gray-900">Incident Response:</strong> In the event of a platform outage affecting core functionality (shipment management, proof of delivery, client portal), CargoOS will acknowledge the incident within 4 business hours and provide status updates every 2 hours until resolution.</p>
          <p><strong className="text-gray-900">Scheduled Maintenance:</strong> At least 24 hours advance notice will be provided. Maintenance windows are typically 2:00 AM – 5:00 AM EST.</p>
          <p><strong className="text-gray-900">Support Response Times:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
         <li><strong className="text-gray-900">Starter:</strong> Within 2 business days</li>
         <li><strong className="text-gray-900">Growth:</strong> Within 1 business day</li>
         <li><strong className="text-gray-900">Pro:</strong> Within 4 business hours</li>
        </ul>
         <p><strong className="text-gray-900">SLA Credits:</strong> If monthly uptime falls below 99.5%, Growth and Pro Operators are eligible for a service credit of 10% of their monthly fee per full percentage point below target, up to 30% maximum. Credits apply to the next billing cycle upon written request to hello@cargoos.io.</p>
        <p className="text-xs text-gray-400 mt-2">CargoOS does not currently hold third-party SLA certification. Uptime targets are based on infrastructure provider commitments from Vercel and Supabase.</p>
        </div>
        <p><strong className="text-gray-900">Live Status:</strong> Operators can monitor real-time platform status at{' '}
        <a href="https://cargoos.betteruptime.com" target="_blank" className="text-black underline">cargoos.betteruptime.com</a>
        </p>
       </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Indemnification</h2>
          <p className="text-gray-600 leading-relaxed">
            The Operator agrees to indemnify, defend, and hold harmless <span className="whitespace-nowrap">Gasp Maker LLC</span> and its officers, employees, and agents from any claims, damages, or expenses (including reasonable attorney's fees) arising from: (a) the Operator's use of the Platform in violation of this Agreement; (b) the Operator's violation of applicable law; or (c) claims by End Users related to the Operator's business operations.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            Notwithstanding the above, SLA credits as described in Section 8 are the Operator's sole and exclusive remedy for service interruptions or downtime.
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
      <section className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
  <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to Sign?</h2>
  <p className="text-gray-600 text-sm mb-4">
    Request a countersigned copy of this MSA. We will send you a DocuSign document within 1 business day.
  </p>
  <a 
    href="mailto:hello@cargoos.io?subject=MSA Request — CargoOS&body=Company name: %0AContact name: %0APhone: %0AWebsite: "
    className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
  >
    Request MSA Signature →
  </a>
  <p className="text-sm text-gray-500 mt-4">
    Or email us directly at{' '}
    <a href="mailto:hello@cargoos.io" className="text-black underline font-bold">
  hello@cargoos.io
   </a>
    {' '}with subject: <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">MSA Request — CargoOS</span>
  </p>
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