"use client"; 

import { useState, useEffect } from 'react'; 
import { useSession } from "next-auth/react"; 
import { Edit, Plus, Settings } from 'lucide-react'; 
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

// --- Imports ---
import LanguageSwitcher from '@/components/LanguageSwitcher'; 
import { ALL_COUNTRIES } from '@/lib/countries'; 
// Asegúrate de que estos componentes existan en tu proyecto, si no, coméntalos temporalmente
import EditNameModal from '@/components/modals/EditNameModal'; 
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import EditMobileModal from '@/components/modals/EditMobileModal';
import EditCountryModal from '@/components/modals/EditCountryModal';
import EditAddressModal from '@/components/modals/EditAddressModal';
import PaymentMethods from '@/components/account/PaymentMethods';

export default function AccountContent() {
    const t = useTranslations('ProfilePage');
    const router = useRouter(); 
    const { data: session, status, update } = useSession({
        required: true,
        onUnauthenticated() { 
            if (typeof window !== 'undefined') window.location.href = '/login-cliente'; 
        },
    });

    const [smsToggle, setSmsToggle] = useState(false); 
    
    // Estados para los Modales
    const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
    const [isEditMobileModalOpen, setIsEditMobileModalOpen] = useState(false);
    const [isEditCountryModalOpen, setIsEditCountryModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    // Estado de Datos de Usuario
    const [userData, setUserData] = useState({
        name: '...',
        email: '...',
        suiteNumber: '...',
        country: '...',
        countryCode: 'US',
        phone: '...',
        dob: '...',
        address: '',
        cityZip: '',
        addressCountry: ''
    });

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (session?.user) {
            const user = session.user as any;

            let dobFormatted = 'N/A';
            if (user.dateOfBirth) {
                const date = new Date(user.dateOfBirth);
                dobFormatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            }

            const code = user.countryCode || 'US';
            const countryObj = ALL_COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
            const countryName = countryObj ? countryObj.name : code; 

            setUserData({
                name: user.name || 'Usuario',
                email: user.email || 'Sin email',
                suiteNumber: user.suiteNo || 'Pendiente',
                country: countryName,
                countryCode: code,
                phone: user.phone || 'N/A',
                dob: dobFormatted,
                address: user.address || '',
                cityZip: user.cityZip || '',
                addressCountry: user.country || ''
            });
        }
    }, [session]);

    if (!isMounted || status === "loading") {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // --- Handlers ---
    const handleSaveName = async (newName: string) => {
        try {
            const res = await fetch('/api/user/update-name', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }),
            });
            if (res.ok) { 
                await update({ ...session, user: { ...session?.user, name: newName } }); 
                router.refresh(); 
                setIsEditNameModalOpen(false); 
            }
        } catch(e) { console.error(e); }
    };

    const handleSaveMobile = async (newMobile: string) => {
        try {
            const res = await fetch('/api/user/update-mobile', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: newMobile }),
            });
            if (res.ok) { 
                await update({ ...session, user: { ...session?.user, phone: newMobile } }); 
                router.refresh(); 
                setIsEditMobileModalOpen(false); 
            }
        } catch(e) { console.error(e); }
    };

    const handleSaveCountry = async (newCode: string) => {
        try {
            const res = await fetch('/api/user/update-country', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countryCode: newCode }),
            });
            if (res.ok) { 
                await update({ ...session, user: { ...session?.user, countryCode: newCode } }); 
                router.refresh(); 
                setIsEditCountryModalOpen(false); 
            }
        } catch(e) { console.error(e); }
    };

    const handleSaveAddress = async (data: { address: string; cityZip: string; country: string; phone: string }) => {
        setUserData(prev => ({ ...prev, address: data.address, cityZip: data.cityZip, addressCountry: data.country, phone: data.phone }));
        setIsAddressModalOpen(false);

        try {
            const res = await fetch('/api/user/update-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                await update({
                    ...session,
                    user: { 
                        ...session?.user, 
                        address: data.address, 
                        cityZip: data.cityZip, 
                        country: data.country,
                        phone: data.phone
                    }
                });
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const hasAddress = userData.address && userData.address.trim() !== '';

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-montserrat">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-center items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-3 rounded-full text-gmc-dorado-principal shadow-sm border border-gray-100">
                            <Settings size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond tracking-tight">
                            {t('title')}
                        </h1>
                    </div>
                </div>

                {/* PERFIL */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h2 className="text-xl font-bold text-gmc-gris-oscuro mb-6 font-garamond">{t('sectionProfile')}</h2>
                    <div className="space-y-5">
                        <div><label className="block text-sm font-medium text-gray-500">{t('suiteNumber')}</label><p className="text-lg font-semibold text-gmc-gris-oscuro">{userData.suiteNumber}</p></div>
                        <div className="flex justify-between items-center"><div><label className="block text-sm font-medium text-gray-500">{t('name')}</label><p className="text-lg text-gmc-gris-oscuro">{userData.name}</p></div><button onClick={() => setIsEditNameModalOpen(true)}><Edit size={18} className="text-gray-400 hover:text-gmc-dorado-principal" /></button></div>
                        <div className="flex justify-between items-center"><div><label className="block text-sm font-medium text-gray-500">{t('country')}</label><p className="text-lg text-gmc-gris-oscuro">{userData.country}</p></div><button onClick={() => setIsEditCountryModalOpen(true)}><Edit size={18} className="text-gray-400 hover:text-gmc-dorado-principal" /></button></div>
                        <div><label className="block text-sm font-medium text-gray-500 mb-1">{t('language')}</label><LanguageSwitcher /></div>
                    </div>
                </div>

                {/* CUENTA */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h2 className="text-xl font-bold text-gmc-gris-oscuro mb-6 font-garamond">{t('sectionAccount')}</h2>
                    <div className="space-y-5">
                        <div><label className="block text-sm font-medium text-gray-500">{t('email')}</label><p className="text-lg text-gmc-gris-oscuro">{userData.email}</p></div>
                        <div className="flex justify-between items-center"><div><label className="block text-sm font-medium text-gray-500">{t('mobileNumber')}</label><p className="text-lg text-gmc-gris-oscuro">{userData.phone}</p></div><button onClick={() => setIsEditMobileModalOpen(true)}><Edit size={18} className="text-gray-400 hover:text-gmc-dorado-principal" /></button></div>
                        <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700 pr-4">{t('sendSms')}</label><div className="relative inline-block w-10 mr-2 align-middle select-none"><input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={smsToggle} onChange={() => setSmsToggle(!smsToggle)}/><label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label></div></div>
                        <div className="flex justify-between items-center"><div><label className="block text-sm font-medium text-gray-500">{t('password')}</label><p className="text-lg text-gmc-gris-oscuro">••••••••</p></div><button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-medium text-gmc-dorado-principal hover:underline">{t('changePassword')}</button></div>
                        <div className="flex justify-between items-center"><div><label className="block text-sm font-medium text-gray-500">{t('dob')}</label><p className="text-lg text-gmc-gris-oscuro capitalize">{userData.dob}</p></div><button onClick={() => alert('Fecha no editable')}><Edit size={18} className="text-gray-300 cursor-not-allowed" /></button></div>
                    </div>
                </div>
                
                {/* DIRECCIONES */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h2 className="text-xl font-bold text-gmc-gris-oscuro mb-6 font-garamond">{t('sectionAddresses')}</h2>
                    {hasAddress ? (
                        <div className="pb-5 border-b last:border-b-0">
                            <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">{t('defaultTag')}</span>
                            <p className="text-gmc-gris-oscuro font-bold">{userData.name}</p>
                            <p className="text-gmc-gris-oscuro">{userData.address}</p>
                            <p className="text-gmc-gris-oscuro">{userData.cityZip}</p>
                            <p className="text-gmc-gris-oscuro">{userData.addressCountry}</p>
                            <p className="text-gmc-gris-oscuro">{userData.phone}</p>
                            <div className="flex space-x-4 mt-3 text-sm font-medium"><button onClick={() => setIsAddressModalOpen(true)} className="text-gmc-dorado-principal hover:underline">{t('btnEdit')}</button><button onClick={() => alert("No se puede borrar la dirección principal")} className="text-red-300 cursor-not-allowed">{t('btnDelete')}</button></div>
                        </div>
                    ) : (
                        <div className="text-center py-4"><p className="text-gray-500 mb-4">{t('noAddressFound')}</p><button onClick={() => setIsAddressModalOpen(true)} className="w-full text-center py-2 bg-gray-100 text-gmc-gris-oscuro font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"><Plus size={18} /> {t('btnAddAddress')}</button></div>
                    )}
                </div>

                {/* MÉTODOS DE PAGO */}
                <div className="mb-6">
                    <PaymentMethods />
                </div>
            </div>

            {/* MODALES */}
            <EditNameModal isOpen={isEditNameModalOpen} onClose={() => setIsEditNameModalOpen(false)} onSave={handleSaveName} currentName={userData.name} />
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
            <EditMobileModal isOpen={isEditMobileModalOpen} onClose={() => setIsEditMobileModalOpen(false)} onSave={handleSaveMobile} currentMobile={userData.phone} />
            <EditCountryModal isOpen={isEditCountryModalOpen} onClose={() => setIsEditCountryModalOpen(false)} onSave={handleSaveCountry} currentCountryCode={userData.countryCode} />
            <EditAddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onSave={handleSaveAddress} currentData={{ address: userData.address, cityZip: userData.cityZip, country: userData.addressCountry, phone: userData.phone }} />
        </div>
    );
}