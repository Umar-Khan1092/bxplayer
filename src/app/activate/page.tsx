"use client";

import { MainLayout } from "@/components/layout/MainLayout";

export default function ActivatePage() {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-5rem)] bg-[#050505] pt-20 pb-20 px-4 sm:px-8 mt-20 flex justify-center items-start text-white">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-[#111111] rounded-3xl shadow-2xl border border-white/5 overflow-hidden p-8 sm:p-12 relative group">
             {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-[#0F763F]/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#0F763F]/10 transition-all duration-1000"></div>

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-100 mb-8">Activate on Our Store:</h3>
                
                <div className="w-72 h-44 bg-black/50 rounded-2xl mb-14 flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden group/card cursor-pointer transition-transform hover:scale-105 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0F763F]/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-green-300 mr-3 drop-shadow-lg">
                      BX
                    </div>
                    <span className="font-bold text-gray-200 tracking-wider text-2xl mt-1 drop-shadow-md">STORE</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-400 mb-8">Or Use Other Payment Methods:</h3>

                <p className="text-sm text-gray-400 leading-relaxed mb-12 max-w-3xl">
                  <span className="text-[#0F763F] font-bold text-base">NOTE:</span> BX Player does not provide contents and it is pure media player. To use BX Player, you have to upload your own playlist. If you have not playlist, then you can't use BX Player anymore so in this case do not pay. Also we are not allowing activation for the users that don't have a playlist.
                </p>

                <button disabled className="bg-[#0F763F] text-white font-bold text-sm px-14 py-4 rounded-xl tracking-widest transition-all shadow-lg opacity-50 cursor-not-allowed">
                  PAY
                </button>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
