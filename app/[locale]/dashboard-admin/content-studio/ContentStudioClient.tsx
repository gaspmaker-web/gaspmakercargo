"use client";

import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Instagram, Video, LayoutGrid, BookImage, Youtube, Check } from 'lucide-react';

const CONTENT_TYPES = [
  { id: 'reel', label: 'Reel / TikTok', icon: Video, color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'carousel', label: 'Carrusel', icon: LayoutGrid, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'story', label: 'Story', icon: BookImage, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'post', label: 'Post Feed', icon: Instagram, color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-50 border-red-200 text-red-700' },
];

const TOPICS = [
  { id: 'miami_locker', label: '📦 Free Miami Locker' },
  { id: 'amazon_bundle', label: '🛒 Amazon Bundle' },
  { id: 'consolidation', label: '📫 Package Consolidation' },
  { id: 'calculator', label: '💰 Shipping Calculator' },
  { id: 'referral', label: '🎁 Referral Program $25' },
  { id: 'testimonial', label: '⭐ Customer Testimonial' },
  { id: 'mailbox', label: '✉️ Virtual Mailbox' },
  { id: 'caribbean_shipping', label: '🌊 Caribbean Shipping' },
  { id: 'air_shipping', label: '✈️ Air Shipping 3-5 days' },
  { id: 'ocean_shipping', label: '🚢 Ocean Shipping' },
  { id: 'how_it_works', label: '🔄 How It Works' },
  { id: 'register', label: '🆓 Free Registration' },
];

const LANGUAGES = [
  { id: 'es', label: '🇪🇸 Español' },
  { id: 'en', label: '🇺🇸 English' },
  { id: 'pt', label: '🇧🇷 Português' },
  { id: 'fr', label: '🇫🇷 Français' },
];

interface GeneratedContent {
  caption: string;
  hashtags: string;
  hook?: string;
  slides?: string[];
  videoDescription?: string;
  cta?: string;
}

export default function ContentStudioClient() {
  const [contentType, setContentType] = useState('reel');
  const [topic, setTopic] = useState('miami_locker');
  const [language, setLanguage] = useState('es');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerated(null);

    const topicLabel = TOPICS.find(t => t.id === topic)?.label || topic;
    const typeLabel = CONTENT_TYPES.find(t => t.id === contentType)?.label || contentType;

    const systemPrompt = `You are an expert social media content creator for Gasp Maker Cargo, a Caribbean shipping and logistics company based in Miami, FL.

BRAND INFO:
- Company: Gasp Maker Cargo (Gasp Maker LLC)
- Colors: Dark navy and Gold
- Tone: Professional, trustworthy, aspirational, Caribbean-focused
- Website: gaspmakercargo.com
- Instagram: @gaspmakercargo

SERVICES:
- Free Miami locker address for online shopping
- Air shipping to Caribbean 3-5 days: Jamaica $2.35/lb, Barbados $3/lb, Trinidad $3/lb, Grenada $3.50/lb
- Ocean shipping 14-21 days: Jamaica $10.05/ft3, Barbados $10.90/ft3, Trinidad $10.30/ft3
- Package consolidation $0.60 per package
- Virtual mailbox Basic $7.99/mo, Premium $14.99/mo
- Referral program $25 credit for both parties
- Calculator: gaspmakercargo.com/en/calculadora-costos
- Register free: gaspmakercargo.com/en/registro-cliente

ALWAYS respond in JSON only, no markdown, no backticks:
{"caption":"...","hashtags":"...","hook":"...","videoDescription":"...","slides":["..."],"cta":"..."}`;

    const userPrompt = `Create ${typeLabel} content in ${language === 'es' ? 'Spanish' : language === 'en' ? 'English' : language === 'pt' ? 'Portuguese' : 'French'} about: ${topicLabel}.${customPrompt ? ` Additional: ${customPrompt}` : ''}`;

    try {
      const response = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text || '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setGenerated(parsed);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button onClick={() => copyToClipboard(text, field)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
      {copiedField === field ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copiedField === field ? 'Copied!' : 'Copy'}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-garamond">Content Studio</h1>
          <p className="text-sm text-gray-500">Generate social media content powered by Claude AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Content Type</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONTENT_TYPES.map(type => (
                <button key={type.id} onClick={() => setContentType(type.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${contentType === type.id ? 'border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                  <type.icon size={16} /><span className="truncate">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Topic</h2>
            <div className="grid grid-cols-1 gap-2">
              {TOPICS.map(t => (
                <button key={t.id} onClick={() => setTopic(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${topic === t.id ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Language</h2>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang.id} onClick={() => setLanguage(lang.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${language === lang.id ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Custom Instructions</h2>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on Back to School, mention Amazon products..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-700" rows={3} />
          </div>

          <button onClick={handleGenerate} disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg">
            {isGenerating ? <><RefreshCw size={20} className="animate-spin" />Generating...</> : <><Sparkles size={20} />Generate Content</>}
          </button>
        </div>

        <div className="space-y-4">
          {!generated && !isGenerating && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Sparkles size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Select options and click Generate</p>
              <p className="text-gray-300 text-sm mt-1">Claude AI creates your content in seconds</p>
            </div>
          )}

          {isGenerating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-yellow-500 animate-pulse" />
              </div>
              <p className="text-gray-600 font-medium">Claude is creating your content...</p>
              <p className="text-gray-400 text-sm mt-1">3-5 seconds</p>
            </div>
          )}

          {generated && (
            <div className="space-y-4">
              {generated.hook && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">🎯 Hook</h3>
                    <CopyButton text={generated.hook} field="hook" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg">{generated.hook}</p>
                </div>
              )}

              {generated.slides && generated.slides.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">📊 Slides</h3>
                    <CopyButton text={generated.slides.join('\n\n')} field="slides" />
                  </div>
                  <div className="space-y-2">
                    {generated.slides.map((slide, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-6 h-6 bg-yellow-400 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-gray-700 text-sm">{slide}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generated.videoDescription && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">🎬 For Designer</h3>
                    <CopyButton text={generated.videoDescription} field="video" />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{generated.videoDescription}</p>
                </div>
              )}

              {generated.caption && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">✍️ Caption</h3>
                    <CopyButton text={generated.caption} field="caption" />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{generated.caption}</p>
                </div>
              )}

              {generated.cta && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wider">🚀 CTA</h3>
                    <CopyButton text={generated.cta} field="cta" />
                  </div>
                  <p className="text-yellow-800 font-bold">{generated.cta}</p>
                </div>
              )}

              {generated.hashtags && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider"># Hashtags</h3>
                    <CopyButton text={generated.hashtags} field="hashtags" />
                  </div>
                  <p className="text-blue-600 text-sm">{generated.hashtags}</p>
                </div>
              )}

              <button onClick={handleGenerate}
                className="w-full py-3 border-2 border-yellow-400 text-yellow-600 font-bold rounded-2xl hover:bg-yellow-50 transition-all flex items-center justify-center gap-2">
                <RefreshCw size={16} />Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
