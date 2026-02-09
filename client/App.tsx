
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
import { storageService } from './services/storageService';
import { generateShortCode, generateMockIp, getCountryFromIp } from './utils/geoUtils';
import { ShortUrl, ClickRecord, AnalyticsStats } from './types';
import { StatsCard } from './components/StatsCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'create'>('dashboard');
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  
  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', originalUrl: '' });
  
  const [newUrl, setNewUrl] = useState({ title: '', original: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = () => {
    setUrls(storageService.getUrls());
    setStats(storageService.getStats());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.original) return;

    const entry: ShortUrl = {
      id: crypto.randomUUID(),
      title: newUrl.title || new URL(newUrl.original.startsWith('http') ? newUrl.original : `https://${newUrl.original}`).hostname,
      originalUrl: newUrl.original.startsWith('http') ? newUrl.original : `https://${newUrl.original}`,
      shortCode: generateShortCode(),
      createdAt: new Date().toISOString()
    };

    storageService.saveUrl(entry);
    setNewUrl({ title: '', original: '' });
    refreshData();
    setActiveTab('list');
  };

  const simulateClick = (url: ShortUrl) => {
    const ip = generateMockIp();
    const click: ClickRecord = {
      id: crypto.randomUUID(),
      urlId: url.id,
      shortCode: url.shortCode,
      timestamp: new Date().toISOString(),
      ip,
      country: getCountryFromIp(ip),
      userAgent: navigator.userAgent
    };
    storageService.recordClick(click);
    refreshData();
    window.open(url.originalUrl, '_blank');
  };

  const startEditing = (url: ShortUrl) => {
    setEditingId(url.id);
    setEditFields({ title: url.title, originalUrl: url.originalUrl });
  };

  const handleUpdate = (id: string) => {
    storageService.updateUrl(id, { 
      title: editFields.title, 
      originalUrl: editFields.originalUrl.startsWith('http') ? editFields.originalUrl : `https://${editFields.originalUrl}` 
    });
    setEditingId(null);
    refreshData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('この短縮URLとクリック統計をすべて削除してもよろしいですか？')) {
      storageService.deleteUrl(id);
      refreshData();
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/#/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MousePointer2 size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ClickLens</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> ダッシュボード
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={20} /> URL一覧
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <PlusCircle size={20} /> URL作成
          </button>
        </nav>

        <div className="p-6 text-xs text-slate-500 border-t border-slate-800">
          ClickLens v2.1 <br /> Full Editing Support
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
              <p className="text-slate-500">システム全体の概況を確認できます。</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="総クリック数" value={stats.totalClicks} icon={<MousePointer2 />} trend="Active Tracking" />
              <StatsCard title="ユニークURL" value={stats.uniqueUrls} icon={<Link2 />} />
              <StatsCard title="トップ国" value={stats.topCountry} icon={<Globe />} />
              <StatsCard title="最新動向" value={stats.recentClicks.length > 0 ? "Normal" : "Idle"} icon={<TrendingUp />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  直近7日間のクリック推移
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyClicks}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Globe size={18} className="text-blue-600" />
                  国別分布
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.countryStats}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={70}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {stats.countryStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {stats.countryStats.slice(0, 4).map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-slate-600">{s.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  最新のアクティビティ
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">URLタイトル</th>
                      <th className="px-6 py-4 font-semibold">日時</th>
                      <th className="px-6 py-4 font-semibold">IPアドレス</th>
                      <th className="px-6 py-4 font-semibold">国</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentClicks.map(click => (
                      <tr key={click.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{click.urlTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {new Date(click.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-sm">{click.ip}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {click.country}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {stats.recentClicks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                          データがまだありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">URL一覧</h2>
                <p className="text-slate-500">登録済みのすべての短縮URLを管理・編集します。</p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all"
              >
                <PlusCircle size={18} /> 新規作成
              </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">タイトル / 元のURL</th>
                      <th className="px-6 py-4 font-semibold">短縮URL</th>
                      <th className="px-6 py-4 font-semibold text-center">クリック</th>
                      <th className="px-6 py-4 font-semibold">作成日</th>
                      <th className="px-6 py-4 font-semibold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urls.map(u => {
                      const urlClicks = storageService.getClicks().filter(c => c.urlId === u.id).length;
                      return (
                        <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <input 
                                  value={editFields.title}
                                  placeholder="タイトル"
                                  onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  autoFocus
                                />
                                <input 
                                  value={editFields.originalUrl}
                                  placeholder="元のURL"
                                  onChange={(e) => setEditFields({ ...editFields, originalUrl: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdate(u.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><Check size={14} /> 保存</button>
                                  <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs flex items-center gap-1"><X size={14} /> 閉じる</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{u.title}</span>
                                  <button 
                                    onClick={() => startEditing(u)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 transition-all"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-400 truncate max-w-xs">{u.originalUrl}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-blue-600 font-medium">clink.co/{u.shortCode}</span>
                              <button 
                                onClick={() => copyToClipboard(u.shortCode, u.id)}
                                className={`p-1.5 rounded transition-colors ${copiedId === u.id ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-200'}`}
                              >
                                {copiedId === u.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm">
                              {urlClicks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => simulateClick(u)}
                                className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                              >
                                訪問 <ExternalLink size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(u.id)}
                                className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {urls.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          URLが登録されていません。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto py-10 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
              <div className="text-center mb-10">
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PlusCircle size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">URLを短縮する</h2>
                <p className="text-slate-500 mt-2">元のURLと管理用のタイトルを入力してください。</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">元のURL</label>
                  <input 
                    type="text"
                    placeholder="https://example.com/very-long-link-here"
                    value={newUrl.original}
                    onChange={(e) => setNewUrl({ ...newUrl, original: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">タイトル (任意)</label>
                  <input 
                    type="text"
                    placeholder="例: 夏のキャンペーンページ"
                    value={newUrl.title}
                    onChange={(e) => setNewUrl({ ...newUrl, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-lg mt-4"
                >
                  <PlusCircle size={20} />
                  短縮URLを発行する
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
