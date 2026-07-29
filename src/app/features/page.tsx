import { MainLayout } from "@/components/layout/MainLayout";
import { MonitorPlay, ListVideo, ShieldCheck, Zap, Globe, Tv, Layers } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: <MonitorPlay className="w-8 h-8 text-red-500" />,
      title: "4K UHD Streaming",
      description: "Experience crystal clear video quality with seamless adaptive bitrate streaming. Hardware acceleration ensures minimal buffering and maximum performance."
    },
    {
      icon: <ListVideo className="w-8 h-8 text-blue-500" />,
      title: "M3U & Xtream Support",
      description: "Easily integrate your own external media sources via standard M3U playlists or secure Xtream Codes API setups directly from your dashboard."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
      title: "Parental Controls",
      description: "Lock specific playlists, categories, or channels behind a secure 4-digit PIN. Keep your family safe while maintaining access to all your content."
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-500" />,
      title: "Cross-Device Sync",
      description: "Your Mac Address and User ID tie your experience together. Generate your credentials once, and your playlists are securely synced."
    },
    {
      icon: <Layers className="w-8 h-8 text-orange-500" />,
      title: "Categorized Library",
      description: "Automatically parses your playlists into TV Dramas, Movies, and Series tabs. Add favorites to your personal collection with a single click."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Lightning Fast VOD",
      description: "Built on Next.js 14 and edge computing infrastructure, ensuring that your Video-On-Demand loads instantly, every single time."
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-12 animate-in fade-in duration-500">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Media Experience</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            BX Player provides industry-leading features for managing and playing your personalized media content securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="glass p-8 rounded-2xl border border-white/5 hover:border-white/20 transition-colors shadow-2xl flex flex-col items-start group">
              <div className="bg-white/5 p-4 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
