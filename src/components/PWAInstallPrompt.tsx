import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install, hasPrompt } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [platformIcon, setPlatformIcon] = useState<string>('/api/pwa-icon');

  useEffect(() => {
    // Check if dismissed previously in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Fetch custom icon from platform settings if available
    fetch('/api/saas/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.platformIconUrl) {
          setPlatformIcon(data.platformIconUrl);
        } else if (data?.platformLogoUrl) {
          setPlatformIcon(data.platformLogoUrl);
        }
      })
      .catch(() => {});
  }, []);

  // If already installed and running standalone, do not render anything
  if (isInstalled) {
    return null;
  }

  // Only show on mobile or when Chrome/Edge can trigger native install prompt
  const shouldShow = isMobile || isInstallable || isIOS || hasPrompt;
  if (!shouldShow) {
    return null;
  }

  const handleInstallClick = async () => {
    if (hasPrompt) {
      const success = await install();
      if (!success) {
        // Fallback for browsers where prompt was cancelled
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Android browser without prompt event or desktop - open tutorial or guide
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* 1. FLOATING MINIMIZED PILL (IF DISMISSED, STAYS AVAILABLE IN CORNER) */}
      {isDismissed ? (
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-slate-900/90 text-white rounded-full shadow-xl border border-slate-700/60 backdrop-blur-md text-xs font-semibold hover:bg-slate-900 transition-all active:scale-95 cursor-pointer"
          title="Instalar aplicativo"
        >
          <img
            src={platformIcon}
            alt="App Icon"
            className="w-4 h-4 rounded-md object-contain bg-white/20 p-0.5"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Instalar App</span>
        </button>
      ) : (
        /* 2. FULL PROMPT BANNER ON MOBILE / FLOATING CARD */
        <aside
          aria-label="Instalação do Aplicativo"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-sm z-40 bg-slate-950 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex items-start gap-3">
            {/* Custom App Icon determined by user */}
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 border border-white/20 flex-shrink-0 shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src={platformIcon}
                alt="Ícone do Aplicativo"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-icon.svg';
                }}
              />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-white tracking-tight truncate">
                  AiVoucher
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] bg-sky-500/20 text-sky-300 font-medium px-1.5 py-0.5 rounded-md border border-sky-400/30">
                  <Sparkles className="w-2.5 h-2.5" /> App
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                Instale no seu smartphone para usar em tela cheia com alta velocidade e ícone próprio.
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isIOS ? 'Instalar no iPhone' : 'Instalar Aplicativo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 3. MODAL DE GUIA PASSO A PASSO (ESPECIAL PARA iOS / IPHONE E NAVEGADORES SEM PROMPT DIRETO) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header com ícone e fechar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 p-1.5 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs">
                  <img
                    src={platformIcon}
                    alt="Ícone do Aplicativo"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo-icon.svg';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Instalar no Smartphone
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atalho com ícone oficial e tela cheia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passo a passo ilustrado */}
            <div className="mt-4 space-y-3.5">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                  1
                </div>
                <div className="flex-1 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-0.5">
                    Toque no botão Compartilhar
                  </p>
                  <span>
                    No Safari (iPhone) ou Chrome, toque no ícone de compartilhar{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-blue-600 font-bold mx-0.5 align-middle">
                      <Share className="w-3 h-3 inline mr-1" /> Compartilhar
                    </span>{' '}
                    na barra inferior do seu navegador.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                  2
                </div>
                <div className="flex-1 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-0.5">
                    Adicionar à Tela de Início
                  </p>
                  <span>
                    Role o menu de opções para baixo e selecione{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-900 font-bold mx-0.5 align-middle">
                      <PlusSquare className="w-3 h-3 inline mr-1 text-blue-600" /> Adicionar à Tela de Início
                    </span>
                    .
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                  3
                </div>
                <div className="flex-1 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-0.5">
                    Confirmar "Adicionar"
                  </p>
                  <span>
                    No canto superior direito da tela, toque em <strong>"Adicionar"</strong>. O ícone oficial aparecerá na tela do seu celular como um app real.
                  </span>
                </div>
              </div>
            </div>

            {/* Dica sobre o modo app */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center gap-2 text-blue-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Ao abrir pelo ícone, ele rodará em <strong>modo aplicativo nativo</strong>, sem a barra de sites e com performance aprimorada.
              </span>
            </div>

            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
