// SIM-TIRTA LESTARI Main Application Entry
// KPSPAM TIRTA LESTARI, Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { AppStorage } from './services/storage';
import { Lock } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Dashboard } from './components/Dashboard';
import { CustomersView } from './components/CustomersView';
import { MetersView } from './components/MetersView';
import { BillsView } from './components/BillsView';
import { PaymentsView } from './components/PaymentsView';
import { ReceiptsView } from './components/ReceiptsView';
import { ArrearsView } from './components/ArrearsView';
import { ComplaintsView } from './components/ComplaintsView';
import { FinanceView } from './components/FinanceView';
import { ReportsView } from './components/ReportsView';
import { AssetsView } from './components/AssetsView';
import { WebsiteCmsView } from './components/WebsiteCmsView';
import { PublicPortalView } from './components/PublicPortalView';
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { AuditLogView } from './components/AuditLogView';
import { SystemHealthView } from './components/SystemHealthView';
import { TestRunnerView } from './components/TestRunnerView';
import { GasCodeExportView } from './components/GasCodeExportView';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('USR-01');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cross-view state passing
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<string | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<string | null>(null);

  useEffect(() => {
    AppStorage.initialize();
    setIsInitialized(true);
  }, []);

  const handleResetData = () => {
    AppStorage.resetToDefaults();
    window.location.reload();
  };

  const handleGoToPaymentFromBill = (billId: string) => {
    setSelectedBillForPayment(billId);
    setActiveView('payments');
  };

  const handleViewReceiptFromPayment = (receiptNumber: string) => {
    setSelectedReceiptForView(receiptNumber);
    setActiveView('receipts');
  };

  const handleLogout = () => {
    AppStorage.setActiveSession(null);
    setActiveView('public');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-lg font-bold">
        Memuat SIM-TIRTA LESTARI...
      </div>
    );
  }

  // Jika tampilan aktif adalah Portal Publik (Website Warga)
  if (activeView === 'public') {
    return (
      <PublicPortalView
        onGoToAdmin={(user) => {
          if (user) {
            setCurrentRole(user.role);
            setCurrentUserId(user.user_id);
          } else {
            setCurrentRole('ADMIN');
          }
          setActiveView('dashboard');
        }}
      />
    );
  }

  const isViewAllowed =
    activeView === 'dashboard' ||
    activeView === 'public' ||
    AppStorage.hasPermission(currentRole, activeView);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-900 selection:bg-sky-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        currentUserId={currentUserId}
        onUserChange={(userId) => setCurrentUserId(userId)}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setIsMobileMenuOpen(false);
        }}
        onResetData={handleResetData}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex w-full max-w-[1536px] mx-auto min-w-0">
        {/* Left Sidebar (Desktop static & Mobile drawer) */}
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => {
            setActiveView(view);
            setIsMobileMenuOpen(false);
          }}
          userRole={currentRole}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area with generous bottom padding for Mobile Bottom Nav */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-12 overflow-y-auto overflow-x-hidden">
          {!isViewAllowed ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-md mx-auto my-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-slate-900">Hak Akses Terbatas</h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Peran aktif saat ini (<strong className="text-slate-900">{currentRole}</strong>) tidak memiliki izin untuk membuka modul <strong className="font-mono text-sky-700">{activeView}</strong>.
              </p>
              <p className="text-slate-400 text-xs">
                Hubungi Administrator desa untuk menambahkan izin modul ini pada menu Manajemen Pengguna & Hak Akses (RBAC).
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
                {currentRole === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setActiveView('users')}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    Buka Menu Hak Akses
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && <Dashboard onNavigate={(view) => setActiveView(view)} />}
              {activeView === 'customers' && <CustomersView />}
              {activeView === 'meters' && <MetersView />}
              {activeView === 'bills' && <BillsView onGoToPayment={handleGoToPaymentFromBill} />}
              {activeView === 'payments' && (
                <PaymentsView
                  initialBillId={selectedBillForPayment}
                  onClearInitialBill={() => setSelectedBillForPayment(null)}
                  onViewReceipt={handleViewReceiptFromPayment}
                />
              )}
              {activeView === 'receipts' && (
                <ReceiptsView initialReceiptNumber={selectedReceiptForView} />
              )}
              {activeView === 'arrears' && <ArrearsView />}
              {activeView === 'complaints' && <ComplaintsView />}
              {activeView === 'maintenance' && <AssetsView />}
              {activeView === 'cashin' && <FinanceView />}
              {activeView === 'cashout' && <FinanceView />}
              {activeView === 'bank' && <FinanceView />}
              {activeView === 'reports' && <ReportsView />}
              {activeView === 'assets' && <AssetsView />}
              {activeView === 'announcements' && <WebsiteCmsView />}
              {activeView === 'transparency' && (
                <PublicPortalView
                  onGoToAdmin={() => {
                    setActiveView('dashboard');
                  }}
                />
              )}
              {activeView === 'tariffs' && <SettingsView initialTab="TARIFFS" />}
              {activeView === 'users' && <UsersView />}
              {activeView === 'settings' && <SettingsView initialTab="GENERAL" />}
              {activeView === 'audit' && <AuditLogView />}
              {activeView === 'health' && <SystemHealthView />}
              {activeView === 'tests' && <TestRunnerView />}
              {activeView === 'gasexport' && <GasCodeExportView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <MobileBottomNav
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setIsMobileMenuOpen(false);
        }}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        userRole={currentRole}
      />
    </div>
  );
}
