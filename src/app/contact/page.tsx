"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Mail, Send } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:baridx.solution@gmail.com?subject=${encodeURIComponent(subject || "Contact from BX Player")}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;
    window.location.href = mailtoLink;
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-8 bg-[#050505] text-white">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#0F763F] mb-4">
              Let's get in touch.
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-gray-200">
              We look forward to hearing from you!
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-[#111111] rounded-3xl p-8 md:p-12 shadow-2xl border border-white/5 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-[#0F763F]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#0F763F]/20 transition-all duration-1000"></div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-sm font-bold tracking-wider text-gray-300">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-white/20 focus:border-[#0F763F] focus:ring-0 text-white px-0 py-3 transition-colors outline-none font-medium"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold tracking-wider text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-white/20 focus:border-[#0F763F] focus:ring-0 text-white px-0 py-3 transition-colors outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold tracking-wider text-gray-300">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/20 focus:border-[#0F763F] focus:ring-0 text-white px-0 py-3 transition-colors outline-none font-medium"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold tracking-wider text-gray-300">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-white/20 focus:border-[#0F763F] focus:ring-0 text-white px-0 py-3 transition-colors outline-none font-medium resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
                
                {/* Contact Email Display */}
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Mail className="w-4 h-4 text-[#0F763F]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Email Us Directly</p>
                    <a href="mailto:baridx.solution@gmail.com" className="text-gray-300 hover:text-white font-medium transition-colors">
                      baridx.solution@gmail.com
                    </a>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="bg-[#0F763F] hover:bg-[#0c6133] text-white px-10 py-4 rounded-xl font-bold tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#0F763F]/20 flex items-center justify-center gap-3 group/btn"
                >
                  Send Message
                  <Send className="w-4 h-4 group-hover/btn:-mt-1 group-hover/btn:ml-1 transition-all" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
