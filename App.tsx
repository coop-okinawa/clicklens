
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  ExternalLink, 
  Copy, 
  Edit3, 
  Trash2,
  MousePointer2,
  Globe,
  Link2,
  Check,
  X,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { storageService } from './storageService';
import { generateShortCode } from './geoUtils';
import { ShortUrl, AnalyticsStats } from './types';
import { StatsCard } from './StatsCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'create'>('dashboard');
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', originalUrl: '' });
  
  const [newUrl, setNewUrl] = useState({ title: '', original: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const { urls: dataUrls, stats: dataStats } = await storageService.getStats();
    setUrls(dataUrls);
    setStats(dataStats);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.original) return;

    const entry: ShortUrl = {
      id: crypto.randomUUID(),
      title: newUrl.title || new URL(newUrl.original.startsWith('http') ? newUrl.original : `https://${newUrl.original}`).hostname,
      originalUrl: newUrl.original.startsWith('http') ? newUrl.original : `https://${newUrl.original}`,
      shortCode: generateShortCode(),
      createdAt: new Date().toISOString()
    };

    await storageService.saveUrl(entry);
    setNewUrl({ title: '', original: '' });
    await refreshData();
    setActiveTab('list');
  };

  const handleUpdate = async (id: string) => {
    await storageService.updateUrl(id, { 
      title: editFields.title, 
      originalUrl: editFields.originalUrl 
    });
    setEditingId(null);
    await refreshData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このURLと統計データを完全に削除しますか？')) {
      await storageService.deleteUrl(id);
      await refreshData();
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MousePointer2 size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ClickLens</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> ダッシュボード
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'list' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <List size={20} /> URL一覧
          </button>
          <button onClick={() => setActiveTab('create')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'create' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
            <PlusCircle size={20} /> URL作成
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading analysis data...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header><h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2></header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard title="総クリック数" value={stats.totalClicks} icon={<MousePointer2 />} />
                  <StatsCard title="ユニークURL" value={stats.uniqueUrls} icon={<Link2 />} />
                  <StatsCard title="トップ国" value={stats.topCountry} icon={<Globe />} />
                  <StatsCard title="最新動向" value={stats.recentClicks.length > 0 ? "Normal" : "Idle"} icon={<TrendingUp />} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><TrendingUp size={18} /> 推移</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyClicks}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Globe size={18} /> 国別分布</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={stats.countryStats} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                          {stats.countryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50"><h3 className="font-bold text-slate-900">最新のアクティビティ</h3></div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="px-6 py-4">URL</th><th className="px-6 py-4">日時</th><th className="px-6 py-4">IP</th><th className="px-6 py-4">国</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentClicks.map(click => (
                        <tr key={click.id} className="text-sm">
                          <td className="px-6 py-4 font-medium">{click.urlTitle}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(click.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono">{click.ip}</td>
                          <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">{click.country}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex justify-between items-end"><div><h2 className="text-2xl font-bold text-slate-900">URL一覧</h2></div></header>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="px-6 py-4">タイトル / 元URL</th><th className="px-6 py-4">短縮URL</th><th className="px-6 py-4 text-right">操作</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {urls.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50">
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <div className="flex flex-col gap-2">
                                <input value={editFields.title} onChange={e => setEditFields({...editFields, title: e.target.value})} className="border rounded p-1 text-sm" />
                                <input value={editFields.originalUrl} onChange={e => setEditFields({...editFields, originalUrl: e.target.value})} className="border rounded p-1 text-sm" />
                                <div className="flex gap-2"><button onClick={() => handleUpdate(u.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">保存</button><button onClick={() => setEditingId(null)} className="text-slate-400 text-xs">キャンセル</button></div>
                              </div>
                            ) : (
                              <div><div className="font-bold text-slate-900">{u.title}</div><div className="text-xs text-slate-400 truncate max-w-xs">{u.originalUrl}</div></div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-blue-600">clink.co/{u.shortCode}</span>
                              <button onClick={() => copyToClipboard(u.shortCode, u.id)} className="p-1.5 rounded hover:bg-slate-200">
                                {copiedId === u.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <a href={`/r/${u.shortCode}`} target="_blank" className="bg-slate-900 text-white p-2 rounded-lg"><ExternalLink size={14} /></a>
                              <button onClick={() => {setEditingId(u.id); setEditFields({title: u.title, originalUrl: u.originalUrl});}} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto py-10">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">URLを短縮</h2>
                  <form onSubmit={handleCreate} className="space-y-6">
                    <div><label className="text-sm font-semibold mb-2 block">元のURL</label><input type="text" value={newUrl.original} onChange={e => setNewUrl({...newUrl, original: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" required /></div>
                    <div><label className="text-sm font-semibold mb-2 block">タイトル</label><input type="text" value={newUrl.title} onChange={e => setNewUrl({...newUrl, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl" /></div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg">短縮URLを発行</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
