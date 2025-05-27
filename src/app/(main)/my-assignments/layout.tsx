'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import NavBar from '@/components/nav';
import Footer from '@/components/footer';
import { Toaster } from 'sonner';
import { Geist, Geist_Mono } from 'next/font/google';
import '../../globals.css';
import { DraftProvider, useDraft } from '@/app/context/draftContext';
import DraftDialog from "@/components/common/DraftDialog";

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const profilePage = pathname === '/profile';
  const paymentPage = pathname.startsWith('/payment');

  // --- Draft navigation logic ---
  const { dirtyAssignments, saveAllDrafts, clearDrafts } = useDraft?.() || {};
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const navigateWithDraftCheck = useCallback(
    (to: string) => {
      if (dirtyAssignments && dirtyAssignments.size > 0) {
        setPendingNav(to);
        setShowDraftModal(true);
      } else {
        router.push(to);
      }
    },
    [dirtyAssignments, router]
  );

  const handleConfirmDraftSave = async () => {
    if (pendingNav && saveAllDrafts) {
      await saveAllDrafts();
      setShowDraftModal(false);
      router.push(pendingNav);
      setPendingNav(null);
    }
  };

  const handleDiscardDraft = () => {
    if (pendingNav) {
      setShowDraftModal(false);
      router.push(pendingNav);
      setPendingNav(null);
      if (clearDrafts) clearDrafts();
    }
  };
  // --- End draft navigation logic ---

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen overflow-x-hidden`}>
      {/* Draft confirmation modal */}
      <DraftDialog
        open={showDraftModal}
        onOpenChange={setShowDraftModal}
        onConfirm={handleConfirmDraftSave}
        onDiscard={handleDiscardDraft}
      />
      {!profilePage && !paymentPage && <NavBar navigate={navigateWithDraftCheck} />}
      <div className="flex-grow">{children}</div>
      <Toaster position="bottom-right" richColors />
      {!profilePage && !paymentPage && <Footer navigate={navigateWithDraftCheck} />}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DraftProvider>
      <LayoutContent>{children}</LayoutContent>
    </DraftProvider>
  );
}

