import React from 'react';
import { ScrollText, ShieldCheck, AlertTriangle, Scale, Clock, Truck, CreditCard, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'Terms of Service | GaspMakerCargo',
  description: 'Legal terms and conditions for using GaspMakerCargo services.',
};

export default function TermsOfServicePage() {
  // Nota: Si quieres traducir esto dinámicamente, usa useTranslations.
  // Por ahora, lo dejaré en inglés estático ya que la URL solicitada es /en/terms-of-service
  // y los términos legales suelen requerir redacción específica por idioma.

  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HEADER HERO */}
      <div className="bg-gmc-gris-oscuro text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                    <ScrollText size={48} className="text-gmc-dorado-principal" />
                </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-garamond mb-4">Terms of Service</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Please read these terms carefully before using our logistics and shipping services.
            </p>
            <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
                Last Updated: {lastUpdated}
            </p>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-4 py-12 -mt-8">
        
        {/* Intro Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-green-600" /> 1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 leading-relaxed">
                By accessing and using the services provided by <strong>GaspMakerCargo (GMC)</strong> ("we," "us," or "our"), 
                including our website, warehouse facilities, and shipping services, you ("the User" or "Customer") agree to comply with and be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
            </p>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-6">

            {/* SERVICE DESCRIPTION */}
            <Section 
                icon={<Truck size={24} className="text-blue-600"/>}
                title="2. Description of Services"
            >
                <p>GaspMakerCargo provides logistics solutions, including but not limited to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li>Receipt and processing of packages at our Miami warehouse.</li>
                    <li>Consolidation of merchandise (repackaging).</li>
                    <li>International air and ocean freight forwarding.</li>
                    <li>Local pickup and delivery services.</li>
                </ul>
                <p className="mt-3 text-sm italic text-gray-500">
                    We reserve the right to refuse service to anyone for any reason at any time, particularly if the goods involve prohibited items or illegal activities.
                </p>
            </Section>

            {/* STORAGE POLICY */}
            <Section 
                icon={<Clock size={24} className="text-orange-600"/>}
                title="3. Storage & Warehousing Policy"
            >
                <p className="mb-3">
                    Effective management of warehouse space is critical to our operations. Our storage policy is as follows:
                </p>
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 text-sm text-gray-700">
                    <strong>Free Storage Period:</strong> Customers are granted <strong>30 days</strong> of free storage starting from the date the package arrives at our Miami facility.
                </div>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600">
                    <li>
                        <strong>Storage Fees:</strong> After the 30-day free period, a storage fee will be applied based on the volume (CFT) of the package.
                        Currently calculated at a rate of <strong>$2.25 per CFT per month</strong> (or fraction thereof).
                    </li>
                    <li>
                        <strong>Abandonment:</strong> Packages stored for more than <strong>90 days</strong> without payment or shipping instructions will be considered abandoned. GMC reserves the right to dispose of, auction, or destroy abandoned cargo to recover costs.
                    </li>
                </ul>
            </Section>

            {/* PAYMENTS */}
            <Section 
                icon={<CreditCard size={24} className="text-purple-600"/>}
                title="4. Rates, Payments & Refunds"
            >
                <p>
                    All shipping charges, duties, and taxes must be paid before the final delivery or release of the cargo.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li><strong>Currency:</strong> All fees are billed in US Dollars (USD).</li>
                    <li><strong>Volumetric Weight:</strong> Shipping costs are calculated based on the greater of actual weight or volumetric weight, in accordance with airline/carrier standards.</li>
                    <li><strong>Refunds:</strong> Services rendered (such as shipping or consolidation already performed) are non-refundable. Claims for lost or damaged cargo must be filed within 7 days of receipt.</li>
                </ul>
            </Section>

            {/* PROHIBITED ITEMS */}
            <Section 
                icon={<AlertTriangle size={24} className="text-red-600"/>}
                title="5. Prohibited & Restricted Items"
            >
                <p>
                    The Customer is solely responsible for ensuring their cargo complies with all applicable export/import laws. 
                    We strictly do <strong>NOT</strong> ship:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Explosives or Flammables</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Illegal Drugs or Narcotics</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Firearms or Ammunition</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Perishable Foods (without prior approval)</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Cash or High-Value Jewelry</span>
                </div>
                <p className="mt-3 text-red-600 text-xs font-bold">
                    Attempting to ship prohibited items may result in the forfeiture of goods and reporting to relevant authorities (TSA, CBP).
                </p>
            </Section>

            {/* LIABILITY */}
            <Section 
                icon={<Scale size={24} className="text-gray-600"/>}
                title="6. Limitation of Liability"
            >
                <p>
                    GaspMakerCargo acts as a freight forwarder and logistics agent. We are not liable for:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li>Delays caused by customs (Aduana), airlines, or "Force Majeure" events (weather, strikes, pandemics).</li>
                    <li>Damage to improperly packaged goods (if packed by the merchant/sender).</li>
                    <li>Indirect or consequential damages (loss of profit, income, or business opportunity).</li>
                </ul>
                <p className="mt-2">
                    Our liability is limited to the declared value of the goods or the limits set by international transport treaties (Montreal/Warsaw Conventions), whichever is lower, unless additional insurance is purchased.
                </p>
            </Section>

             {/* CONTACT */}
             <Section 
                icon={<Mail size={24} className="text-teal-600"/>}
                title="7. Contact Us"
            >
                <p>
                    If you have any questions regarding these Terms, please contact our support team:
                </p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg flex flex-col gap-2">
                    <p className="text-sm font-bold text-gray-800">GaspMakerCargo LLC</p>
                    <p className="text-sm text-gray-600">Miami, Florida, USA</p>
                    <a href="mailto:support@gaspmakercargo.com" className="text-blue-600 hover:underline text-sm font-medium">
                        support@gaspmakercargo.com
                    </a>
                </div>
            </Section>

        </div>
      </div>

    </div>
  );
}

// --- Helper Component para Secciones ---
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