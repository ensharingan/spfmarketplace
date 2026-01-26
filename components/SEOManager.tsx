
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogPost } from '../types';

interface SEOManagerProps {
  onAddPost: (post: BlogPost) => void;
  blogPosts: BlogPost[];
}

export const SEOManager: React.FC<SEOManagerProps> = ({ onAddPost, blogPosts }) => {
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'posts'>('generate');

  // Fix: simplified contents property to be a string
  const generateSEOContent = async () => {
    if (!keyword.trim()) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a high-converting, SEO-optimized blog post for an auto parts marketplace specializing in "${keyword}". 
      Include a catchy title, 5-10 high-traffic keywords for South Africa car parts search, a meta description, and at least 300 words of engaging content. 
      Format as JSON with keys: 'title', 'slug', 'content', 'keywords' (array).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      const newPost: BlogPost = {
        id: 'post-' + Date.now(),
        title: result.title,
        slug: result.slug || result.title.toLowerCase().replace(/ /g, '-'),
        content: result.content,
        keywords: result.keywords || [],
        createdAt: new Date().toISOString()
      };

      onAddPost(newPost);
      setActiveTab('posts');
      setKeyword('');
    } catch (error) {
      console.error("SEO Generation failed:", error);
      alert("Failed to generate SEO content. Please try a different keyword.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
        >
          Generate New Content
        </button>
        <button 
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
        >
          Published Content ({blogPosts.length})
        </button>
      </div>

      {activeTab === 'generate' ? (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="material-symbols-outlined text-3xl">language</span>
            </div>
            <h3 className="text-2xl font-display font-black text-dark tracking-tight">AI Organic Traffic Engine</h3>
            <p className="text-sm text-slate-500 font-medium">Generate SEO-optimized landing pages and blog posts to rank #1 on Google.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Search Keyword / Niche</label>
              <input 
                type="text" 
                className="w-full rounded-2xl border-slate-200 py-4 text-sm font-bold shadow-sm focus:ring-primary focus:border-primary"
                placeholder="e.g. Second hand VW Golf 7 parts in Durban"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>

            <button 
              onClick={generateSEOContent}
              disabled={isGenerating || !keyword}
              className="w-full bg-dark text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Analyzing Keywords & Writing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Generate High-Rank Content
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SEO PRO TIP</p>
            <p className="text-xs text-slate-400 mt-2 font-medium italic">"Use specific locations (suburbs/cities) to capture high-intent local buyers."</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map(post => (
            <div key={post.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col group hover:border-primary transition-all">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Organic Landing Page</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
               </div>
               <h4 className="text-xl font-display font-black text-dark mb-4 leading-tight group-hover:text-primary transition-colors">{post.title}</h4>
               <div className="flex flex-wrap gap-2 mb-6">
                  {post.keywords.map(k => (
                    <span key={k} className="text-[8px] font-black text-slate-500 uppercase px-2 py-0.5 bg-slate-50 border rounded-md">#{k}</span>
                  ))}
               </div>
               <div className="flex-1 text-sm text-slate-500 line-clamp-4 font-medium mb-6">
                  {post.content}
               </div>
               <div className="flex gap-3 mt-auto">
                  <button className="flex-1 bg-slate-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copy URL
                  </button>
                  <button className="flex-1 bg-white text-dark border border-slate-200 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    Edit
                  </button>
               </div>
            </div>
          ))}
          {blogPosts.length === 0 && (
            <div className="md:col-span-2 text-center py-20 bg-white rounded-[3rem] border border-slate-100 italic font-bold text-slate-400">
              No SEO content generated yet. Go to the "Generate" tab to start ranking.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
