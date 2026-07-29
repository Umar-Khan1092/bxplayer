"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "1. What is BX Player?",
    answer: "BX Player is a premium, web-based media player designed to stream your personal Video-on-Demand (VOD) and Live TV playlists. It acts as an advanced interface for your M3U files and Xtream Codes."
  },
  {
    question: "2. How do I find my Mac Address and User ID?",
    answer: "Your unique Mac Address and User ID are automatically generated the first time you open the BX Player web app. You can find them at any time in the bottom-left corner of the main player interface."
  },
  {
    question: "3. How do I add a new playlist?",
    answer: "Click on the 'Manage Playlist' tab in the top navigation bar. Enter your Mac Address and User ID to unlock the secure dashboard. From there, you can choose to add an M3U URL or an Xtream Codes API setup."
  },
  {
    question: "4. What is the difference between M3U and Xtream Codes?",
    answer: "M3U is a standard file format that points directly to media streams. Xtream Codes is an API-based system that requires a Server URL, Username, and Password, often providing a more organized library with categories."
  },
  {
    question: "5. Are my playlists secure?",
    answer: "Yes. Playlists are tied directly to your unique device Mac Address. Nobody else can view or access your playlists unless they have both your exact Mac Address and User ID."
  },
  {
    question: "6. What happens if I reinstall the app?",
    answer: "BX Player uses persistent local storage. As long as you do not clear your browser's site data, your Mac Address and User ID will remain exactly the same even if you reinstall the PWA (Progressive Web App)."
  },
  {
    question: "7. How do I set up Parental Controls?",
    answer: "In the 'Manage Playlist' dashboard, click on the 'Parental PIN' tab. Enter a 4-digit code to securely lock sensitive categories. You will need to enter this PIN to access locked content in the main player."
  },
  {
    question: "8. Can I use BX Player on my Smart TV?",
    answer: "Yes! Because BX Player is a web-based application, you can access it via the built-in web browser on your Samsung Tizen, LG WebOS, or Android TV device."
  },
  {
    question: "9. Why are my channels buffering?",
    answer: "Buffering is usually caused by a slow internet connection or network congestion on your playlist provider's server. BX Player itself is highly optimized and does not host the content."
  },
  {
    question: "10. Does BX Player provide any content?",
    answer: "No. BX Player is purely a media player interface. We do not provide, host, or sell any media content, live streams, or playlists."
  },
  {
    question: "11. How do I add a video to my favorites?",
    answer: "While hovering over a video card in the main player, click the Heart icon in the top right corner. You can also add items to your favorites from the 'Watching Continuously' history dropdown."
  },
  {
    question: "12. Can I change the audio track or subtitles?",
    answer: "Yes. If your media source provides multiple audio tracks or subtitle streams, you can select them using the settings gear icon inside the video player controls."
  },
  {
    question: "13. What is the 'IPTV Panel' tab?",
    answer: "The IPTV Panel tab is a quick-access modal that allows you to browse and manage the raw playlist sources you have connected to your account."
  },
  {
    question: "14. How do I delete a playlist?",
    answer: "Navigate back to the 'Manage Playlist' admin dashboard. Locate the playlist in the 'Your Sources' list at the bottom, and click the red trash can icon next to it."
  },
  {
    question: "15. Is my data shared with third parties?",
    answer: "Absolutely not. Your credentials and playlist URLs are stored securely within your local environment and our private backend strictly for authorization purposes."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Questions</span>
          </h1>
          <p className="text-lg text-gray-400">
            Everything you need to know about setting up and using BX Player.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx} 
              className={cn(
                "glass rounded-xl border transition-colors overflow-hidden",
                openIndex === idx ? "border-red-500/30 bg-red-950/10" : "border-white/5 hover:border-white/10"
              )}
            >
              <button 
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <h3 className="font-semibold text-lg text-white">{faq.question}</h3>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-red-500 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                )}
              </button>
              
              {openIndex === idx && (
                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
