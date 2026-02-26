"use client";

import { useState, useEffect } from 'react'; 
import { useSession } from "next-auth/react"; 
// 🔥 1. AGREGAMOS LAS FLECHITAS DE LUCIDE-REACT (ChevronDown, ChevronUp)
import { Edit, Plus, Settings, MapPin, CheckCircle, Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react'; 
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

// --- Imports ---
import LanguageSwitcher from '@/components/LanguageSwitcher'; 
import { ALL_COUNTRIES } from '@/lib/countries'; 
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
    
    // ESTADOS PARA LA LIBRETA DE DIRECCIONES
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    // 🔥 2. NUEVO ESTADO PARA ESCONDER/MOSTRAR LA LISTA (Falso por defecto para que inicie escondida)
    const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
    
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [currentAddressData, setCurrentAddressData] = useState({
        fullName: '', address: '', cityZip: '', country: '', phone: ''
    });

    // Estado de Datos de Usuario
    const [userData, setUserData] = useState({
        name: '...', email: '...', suiteNumber: '...', country: '...', countryCode: 'US', phone: '...', dob: '...'
    });

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    // Cargar Datos del Perfil Base
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
            
            setUserData({
                name: user.name || 'Usuario',
                email: user.email || 'Sin email',
                suiteNumber: user.suiteNo || 'Pendiente',
                country: countryObj ? countryObj.name : code,
                countryCode: code,
                phone: user.phone || 'N/A',
                dob: dobFormatted,
            });
            
            fetchAddresses();
        }
    }, [session]);

    // Traer todas las direcciones de la base de datos
    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const res = await fetch('/api/user/addresses');
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || []);
            }
        } catch (e) { console.error("Error fetching addresses", e); }
        finally { setLoadingAddresses(false); }
    };

    if (!isMounted || status === "loading") {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // --- Handlers del Perfil ---
    const handleSaveName = async (newName: string) => {
        try {
            const res = await fetch('/api/user/update-name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
            if (res.ok) { await update({ ...session, user: { ...session?.user, name: newName } }); router.refresh(); setIsEditNameModalOpen(false); }
        } catch(e) { console.error(e); }
    };

    const handleSaveMobile = async (newMobile: string) => {
        try {
            const res = await fetch('/api/user/update-mobile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: newMobile }) });
            if (res.ok) { await update({ ...session, user: { ...session?.user, phone: newMobile } }); router.refresh(); setIsEditMobileModalOpen(false); }
        } catch(e) { console.error(e); }
    };

    const handleSaveCountry = async (newCode: string) => {
        try {
            const res = await fetch('/api/user/update-country', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countryCode: newCode }) });
            if (res.ok) { await update({ ...session, user: { ...session?.user, countryCode: newCode } }); router.refresh(); setIsEditCountryModalOpen(false); }
        } catch(e) { console.error(e); }
    };

    // --- Handlers de Libreta de Direcciones ---
    const openNewAddressModal = () => {
        setEditingAddressId(null);
        setCurrentAddressData({ fullName: '', address: '', cityZip: '', country: '', phone: '' });
        setIsAddressModalOpen(true);
    };

    const openEditAddressModal = (addr: any) => {
        setEditingAddressId(addr.id);
        setCurrentAddressData({ fullName: addr.fullName, address: addr.address, cityZip: addr.cityZip, country: addr.country, phone: addr.phone });
        setIsAddressModalOpen(true);
    };

    const handleSaveAddress = async (data: any) => {
        try {
            const endpoint = editingAddressId ? '/api/user/addresses/update' : '/api/user/addresses/create';
            const payload = editingAddressId ? { ...data, id: editingAddressId } : data;

            const res = await fetch(endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsAddressModalOpen(false);
                fetchAddresses(); 
                router.refresh();
                // 🔥 Abrimos el acordeón automáticamente si guardan una nueva dirección para que la vean
                setIsAddressesExpanded(true);
            }
        } catch (error) { console.error("Error saving address", error); }
    };

    const handleMakeDefault = async (id: string) => {
        try {
            const res = await fetch('/api/user/addresses/set-default', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
            });
            if (res.ok) fetchAddresses(); 
        } catch (error) { console.error("Error setting default", error); }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;
        try {
            const res = await fetch('/api/user/addresses/delete', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
            });
            if (res.ok) fetchAddresses();
        } catch (error) { console.error("Error deleting address", error); }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-montserrat">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-center items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-3 rounded-full text-gmc-dorado-principal shadow-sm border border-gray-100">
                            <Settings size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond tracking-tight">{t('title')}</h1>
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
                
                {/* 🔥 LIBRETA DE DIRECCIONES (MODO ACORDEÓN) 🔥 */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-6 transition-all duration-300">
                    {/* 3. Cabecera clickeable */}
                    <div 
                        className="flex justify-between items-center cursor-pointer group"
                        onClick={() => setIsAddressesExpanded(!isAddressesExpanded)}
                    >
                        <h2 className="text-xl font-bold text-gmc-gris-oscuro font-garamond flex items-center gap-2 group-hover:text-gmc-dorado-principal transition-colors">
                            <MapPin size={22}/> {t('sectionAddresses')}
                        </h2>
                        {/* 4. Flechita que cambia si está abierto o cerrado */}
                        <button className="text-gray-400 group-hover:text-gmc-dorado-principal transition-all">
                            {isAddressesExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </button>
                    </div>

                    {/* 5. Contenido oculto/mostrado dinámicamente */}
                    {isAddressesExpanded && (
                        <div className="mt-6 border-t border-gray-100 pt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                            {loadingAddresses ? (
                                <div className="text-center py-6 text-gray-400">Cargando direcciones...</div>
                            ) : addresses.length > 0 ? (
                                <div className="space-y-4">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className={`p-5 border-2 rounded-xl transition-all ${addr.isDefault ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                            {addr.isDefault && (
                                                <div className="flex items-center gap-1 text-green-700 text-xs font-black uppercase tracking-wider mb-3 bg-green-200/50 inline-block px-3 py-1 rounded-full">
                                                    <CheckCircle size={14} /> DEFAULT
                                                </div>
                                            )}
                                            <p className="text-lg text-gray-900 font-bold mb-1">{addr.fullName}</p>
                                            <p className="text-gray-600 text-sm">{addr.address}</p>
                                            <p className="text-gray-600 text-sm">{addr.cityZip}</p>
                                            <p className="text-gray-600 text-sm font-bold mt-1">{addr.country}</p>
                                            <p className="text-gray-500 text-xs mt-1">{addr.phone}</p>
                                            
                                            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200/60">
                                                {!addr.isDefault && (
                                                    <button onClick={() => handleMakeDefault(addr.id)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Star size={16}/> {t('makeDefault')}</button>
                                                )}
                                                <button onClick={() => openEditAddressModal(addr)} className="text-sm font-bold text-gmc-dorado-principal hover:underline flex items-center gap-1"><Edit size={16}/> {t('edit')}</button>
                                                {!addr.isDefault && (
                                                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 size={16}/> {t('btnDelete')}</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-gray-500 mb-2 font-medium">{t('noAddressFound') || "No tienes direcciones guardadas."}</p>
                                </div>
                            )}

                            <button 
                                onClick={openNewAddressModal} 
                                className="mt-6 w-full py-3.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                            >
                                <Plus size={20} /> {t('addNewAddress')}
                            </button>
                        </div>
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
            
            <EditAddressModal 
                isOpen={isAddressModalOpen} 
                onClose={() => setIsAddressModalOpen(false)} 
                onSave={handleSaveAddress} 
                currentData={currentAddressData} 
            />
        </div>
    );
}