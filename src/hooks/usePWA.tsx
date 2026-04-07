import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the PWA prompt');
            setIsInstallable(false);
            setDeferredPrompt(null);
        } else {
            console.log('User dismissed the PWA prompt');
        }
    };

    return { isInstallable, installPWA };
};

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { isInstallable, installPWA } = usePWAInstall();

    if (!isInstallable) return null;

    return (
        <button
            onClick={installPWA}
            className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary to-[#E4B587] text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}
            title="Install Kalalak Dashboard App"
        >
            <Download size={16} />
            <span className="hidden sm:inline">Install App</span>
        </button>
    );
};
