import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function CargoOSPrivacyPage() {
  return (
    <div className="min-h-screen font-sans">
      
      {/* Header — negro como CargoOS */}
      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <a href="/en/cargoos" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to CargoOS
          </a>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-white" size={28} />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 text-sm whitespace-nowrap">CargoOS by Gasp Maker LLC — Last updated: July 2026</p>
        </div>
      </div>

      {/* Content — blanco como CargoOS */}
      <div className="bg-white max-w-4xl mx-auto px-6 py-12 space-y-10">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            CargoOS ("we", "our", "us") is a Software-as-a-Service (SaaS) platform operated by{' '}
<span className="whitespace-nowrap">Gasp Maker LLC.</span>{' '}
This Privacy Policy explains how we collect, use, and protect information when you use our platform at cargoos.io.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p><strong className="text-gray-900">Operator Information:</strong> When a logistics company ("Operator") subscribes to CargoOS, we collect business name, contact information, billing details, and API credentials (EasyPost, Stripe) provided by the Operator.</p>
            <p><strong className="text-gray-900">End-User Information:</strong> Operators use CargoOS to manage their own customers ("End Users"). End User data — including names, addresses, shipping details, and payment information — is processed on behalf of the Operator.</p>
            <p><strong className="text-gray-900">Usage Data:</strong> We collect technical data such as IP addresses, browser type, pages visited, and actions taken within the platform to improve our service.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
            <li>To provide, maintain, and improve the CargoOS platform</li>
            <li>To process payments and manage subscriptions</li>
            <li>To generate shipping labels and rate quotes via integrated carriers</li>
            <li>To send operational notifications and support communications</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We do not sell personal data. We share data only with:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed ml-4">
            <li><strong className="text-gray-900">Stripe</strong> — payment processing</li>
            <li><strong className="text-gray-900">EasyPost</strong> — shipping label generation and carrier rate quotes</li>
            <li><strong className="text-gray-900">Supabase</strong> — secure database hosting</li>
            <li><strong className="text-gray-900">Vercel</strong> — platform hosting and deployment</li>
            <li><strong className="text-gray-900">Resend</strong> — transactional email delivery</li>
          </ul>
        </section>

    <section>
  <h2 className="text-lg font-bold text-gray-900 mb-3">5. Data Security</h2>
  <p className="text-gray-600 leading-relaxed">
    We implement the following security measures to protect your data:
  </p>
  <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3 ml-4">
    <li><strong className="text-gray-900">Encryption in transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS.</li>
    <li><strong className="text-gray-900">Supabase (Database):</strong> SOC 2 Type II certified hosting with encryption at rest.</li>
    <li><strong className="text-gray-900">Vercel (Hosting):</strong> SOC 2 Type II certified infrastructure.</li>
    <li><strong className="text-gray-900">Stripe (Payments):</strong> PCI DSS Level 1 certified. We never store raw card numbers.</li>
    <li><strong className="text-gray-900">API Credentials:</strong> Operator API keys are stored encrypted and never exposed in plaintext or logs.</li>
    <li><strong className="text-gray-900">Access Control:</strong> Role-based access limits what each user can see and do within the platform.</li>
    </ul>
    <p className="text-gray-600 leading-relaxed mt-3">
    CargoOS itself does not hold SOC 2 or ISO 27001 certification at this time. We rely on the certified infrastructure of our service providers listed above.
    </p>
  </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            Operator and End User data is retained for the duration of the active subscription plus 90 days after cancellation. Operators may request deletion of their data at any time by contacting hello@cargoos.io.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Operator Responsibilities</h2>
          <p className="text-gray-600 leading-relaxed">
            Operators are responsible for obtaining proper consent from their End Users for data collection and processing. CargoOS acts as a data processor on behalf of Operators, who serve as data controllers for their customers' information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use essential cookies for authentication and session management. We do not use tracking or advertising cookies. Language preferences are stored in a cookie to improve user experience.
          </p>
        </section>

       <section>
  <h2 className="text-lg font-bold text-gray-900 mb-3">9. Your Rights</h2>
  <p className="text-gray-600 leading-relaxed">
    CargoOS is operated by Gasp Maker LLC, a company registered in Florida, USA. We process data under applicable U.S. law.
  </p>
  <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed mt-3 ml-4">
    <li><strong className="text-gray-900">Florida residents:</strong> You have the right to request access to or deletion of your personal data.</li>
    <li><strong className="text-gray-900">California residents (CCPA):</strong> You have the right to know what data we collect, request deletion, and opt out of sale. We do not sell personal data.</li>
    <li><strong className="text-gray-900">International users:</strong> We respect data subject rights on a best-effort basis. We do not currently hold GDPR Data Processing Agreements but will cooperate with reasonable requests.</li>
  </ul>
  <p className="text-gray-600 leading-relaxed mt-3">
    To exercise any of these rights, contact us at <a href="mailto:hello@cargoos.io" className="text-black underline">hello@cargoos.io</a>.
  </p>
</section>
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy periodically. We will notify Operators of material changes via email. Continued use of CargoOS after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-3">For privacy-related questions or requests:</p>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
            <p className="font-bold text-gray-900">Gasp Maker LLC — CargoOS</p>
            <p>1861 NW 22nd St, Miami, FL 33142</p>
            <p>Email: <a href="mailto:hello@cargoos.io" className="text-black underline">hello@cargoos.io</a></p>
            <p>Website: <a href="https://cargoos.io" className="text-black underline">cargoos.io</a></p>
          </div>
        </section>

      </div>

      {/* Footer — negro como CargoOS */}
      <div className="bg-black py-8 text-center text-sm text-gray-500">
        © 2026 CargoOS by Gasp Maker LLC. All rights reserved.
      </div>

    </div>
  );
}