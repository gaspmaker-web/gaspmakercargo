"use client";

import { usePathname } from 'next/navigation';

const HIDDEN_PATHS = ['/dashboard', '/admin', '/driver', '/warehouse'];

export default function WhatsAppButton() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PATHS.some(p => pathname.includes(p));
  if (isHidden) return null;

  return (
    
      href="https://wa.me/17869468802?text=Hola%20Gasp%20Maker%20Cargo%2C%20necesito%20informaci%C3%B3n"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.826.736 5.476 2.027 7.77L0 32l8.445-2.01A15.938 15.938 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.79-1.858l-.486-.29-5.013 1.194 1.234-4.874-.317-.5A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.87c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.265.398-1.029 1.294-1.261 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.62-3.203-1.98-1.184-1.057-1.983-2.363-2.215-2.761-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.399-.664.132-.265.066-.497-.033-.696-.1-.2-.897-2.163-1.229-2.961-.323-.778-.651-.672-.897-.684l-.764-.013c-.265 0-.696.1-1.061.497-.365.398-1.394 1.362-1.394 3.325s1.427 3.856 1.626 4.122c.2.265 2.808 4.287 6.802 6.014.951.41 1.693.655 2.271.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.891.332-.93.332-1.727.232-1.891-.099-.165-.365-.265-.763-.464z"/>
      </svg>
    </a>
  );
}
