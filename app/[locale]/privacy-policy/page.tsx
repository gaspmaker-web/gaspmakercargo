import React from 'react';
import { Lock, Eye, Database, Globe, Shield, Mail, FileText } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | GaspMakerCargo',
  description: 'How we collect, use, and protect your personal data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HERO SECTION */}
      <div className="bg-gmc-gris-oscuro text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                    <Lock size={48} className="text-green-400" />
                </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-garamond mb-4">Privacy Policy</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                We are committed to protecting your personal information and your right to privacy.
            </p>
            <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
                Last Updated: {lastUpdated}
            </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-12 -mt-8">
        
        {/* Intro */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="text-blue-600" /> Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed">
                This Privacy Policy explains how <strong>GaspMakerCargo LLC</strong> ("we", "us", "our") collects, uses, shares, and protects your personal information when you visit our website or use our logistics services. 
                By using our services, you consent to the data practices described in this policy.
            </p>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-6">

            {/* 1. DATA WE COLLECT */}
            <Section 
                icon={<Database size={24} className="text-indigo-600"/>}
                title="1. Information We Collect"
            >
                <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services.</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li><strong>Personal Info:</strong> Names, phone numbers, email addresses, mailing addresses, billing addresses.</li>
                    <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases (credit card numbers), managed securely via Stripe.</li>
                    <li><strong>Logistics Data:</strong> Information about your shipments, tracking numbers, package contents, and declared values.</li>
                </ul>
            </Section>

            {/* 2. HOW WE USE DATA */}
            <Section 
                icon={<Eye size={24} className="text-teal-600"/>}
                title="2. How We Use Your Information"
            >
                <p>We use personal information collected via our website for a variety of business purposes described below:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li>To facilitate account creation and logon process.</li>
                    <li>To fulfill and manage your orders, payments, and returns.</li>
                    <li>To send administrative information to you (tracking updates, invoices).</li>
                    <li>To protect our Services (fraud monitoring and prevention).</li>
                </ul>
            </Section>

            {/* 3. COOKIES */}
            <Section 
                icon={<Globe size={24} className="text-orange-600"/>}
                title="3. Cookies and Tracking Technologies"
            >
                <p>
                    We use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. 
                    Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
                </p>
                <div className="mt-3 bg-orange-50 p-3 rounded text-xs text-orange-800 border border-orange-100">
                    <strong>Essential Cookies:</strong> Required for the website to function (e.g., login session, language preference).
                </div>
            </Section>

            {/* 4. THIRD PARTIES */}
            <Section 
                icon={<FileText size={24} className="text-purple-600"/>}
                title="4. Sharing with Third Parties"
            >
                <p>We only share information with the following third parties to perform specific services:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li><strong>Payment Processors:</strong> Stripe (for secure credit card transactions).</li>
                    <li><strong>Logistics Partners:</strong> Airlines, sea freight carriers, and local delivery services (Tookan) strictly for delivery fulfillment.</li>
                    <li><strong>Cloud Infrastructure:</strong> Vercel and Supabase (for hosting and database security).</li>
                </ul>
            </Section>

             {/* CONTACT */}
             <Section 
                icon={<Mail size={24} className="text-gray-600"/>}
                title="5. Contact Us"
            >
                <p>
                    If you have questions or comments about this policy, you may email us at:
                </p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <a href="mailto:privacy@gaspmakercargo.com" className="text-blue-600 hover:underline font-bold">
                        privacy@gaspmakercargo.com
                    </a>
                    <p className="text-xs text-gray-500 mt-1">GaspMakerCargo LLC, Miami, FL.</p>
                </div>
            </Section>

        </div>
      </div>
    </div>
  );
}

// Helper Component
function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg">{icon}</div>
                {title}
            </h3>
            <div className="text-gray-600 leading-relaxed text-sm md:text-base">
                {children}
            </div>
        </section>
    );
}