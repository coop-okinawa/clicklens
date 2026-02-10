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
import { generateShortCode } from './utils/geoUtils';
import { ShortUrl, AnalyticsStats } from './types';
import { StatsCard } from './components/StatsCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', originalUrl: '' });
  
  const [newUrl, setNewUrl] = useState({ title: '', original: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
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
      id: window.crypto.randomUUID(),
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
    if (window.confirm('このURLと関連データをすべて削除しますか？')) {
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
  
const clickCountByUrl = stats?.recentClicks?.reduce(
  (acc: any, c: any) => {
    acc[c.urlId] = (acc[c.urlId] || 0) + 1;
    return acc;
  },
  {}
) || {};
  
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
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> ダッシュボード
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <List size={20} /> URL一覧
          </button>
          <button onClick={() => setActiveTab('create')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'create' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <PlusCircle size={20} /> URL作成
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading analysis data...</div>
        ) : (
          <div className="animate-in max-w-6xl mx-auto">
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                <header className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">ダッシュボード概要</h2>
                  <p className="text-slate-500">トラフィックと地理的分布を把握します。</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard title="総クリック数" value={stats.totalClicks} icon={<MousePointer2 />} />
                  <StatsCard title="リンク数" value={stats.uniqueUrls} icon={<Link2 />} />
                  <StatsCard title="主要アクセス国" value={stats.topCountry} icon={<Globe />} />
                  <StatsCard title="稼働状況" value="Active" icon={<TrendingUp />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <TrendingUp size={18} className="text-blue-600" /> クリック推移 (直近7日間)
                    </h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={stats.dailyClicks}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Globe size={18} className="text-blue-600" /> 国別分布
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.countryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                            {stats.countryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {stats.countryStats.slice(0, 3).map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx]}}></div> {item.name}</span>
                          <span className="font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Clock size={18} className="text-blue-600" /> 最新のアクティビティ</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">URLタイトル</th>
                          <th className="px-6 py-4">日時</th>
                          <th className="px-6 py-4">IPアドレス</th>
                          <th className="px-6 py-4">国</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.recentClicks.length > 0 ? (
                          stats.recentClicks.map(click => (
                            <tr key={click.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">{click.urlTitle}</td>
                              <td className="px-6 py-4 text-slate-500">{new Date(click.timestamp).toLocaleString()}</td>
                              <td className="px-6 py-4 font-mono text-xs">{click.ip}</td>
                              <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{click.country}</span></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">データがまだありません。</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-6">
                <header className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">URL管理</h2>
                  <p className="text-slate-500">登録されているリンクの編集と削除を行います。</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">タイトル / 元URL</th>
                          <th className="px-6 py-4">短縮リンク</th>
                           <th className="px-6 py-4">アクセス数</th>
                          <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {urls.length > 0 ? (
                          urls.map(u => (
                            <tr key={u.id} 
                              className="group hover:bg-slate-50 transition-colors cursor-pointer" 
                              onClick={() => setActiveTab(`detail-${u.id}`)} 
                              >
                              <td className="px-6 py-4">
                                {editingId === u.id ? (
                                  <div className="flex flex-col gap-2 min-w-[300px]">
                                    <input value={editFields.title} onChange={e => setEditFields({...editFields, title: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="タイトル" />
                                    <input value={editFields.originalUrl} onChange={e => setEditFields({...editFields, originalUrl: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="元のURL" />
                                    <div className="flex gap-2">
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation(); 
                                         handleUpdate(u.id); 
                                       }} 
                                       className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors" 
                                       > 
                                       保存 
                                     </button>
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation(); 
                                         setEditingId(null); 
                                       }}
                                       className="text-slate-400 text-xs hover:text-slate-600"
                                       >
                                       キャンセル 
                                     </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-bold text-slate-900">{u.title}</div>
                                    <div className="text-xs text-slate-400 truncate max-w-md">{u.originalUrl}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">{window.location.origin}/r/{u.shortCode}</span>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     copyToClipboard(u.shortCode, u.id);
                                   }} 
                                   className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" 
                                   title="コピー"
                                   >
                                   {copiedId === u.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />} 
                                 </button>
                                </div>
                              </td>
                              <td className="px-6 py-4"> 
                                {clickCountByUrl[u.id] || 0} 
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-3">
                                  <a 
                                    href={`/r/${u.shortCode}`}
                                    target="_blank" 
                                    onClick={(e) => e.stopPropagation()} 
                                    className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-all shadow-md" 
                                    title="開く" 
                                    >
                                    <ExternalLink size={16} /> 
                                  </a>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setEditingId(u.id); 
                                      setEditFields({ title: u.title, originalUrl: u.originalUrl }); 
                                    }} 
                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors" 
                                    title="編集" 
                                    > 
                                    <Edit3 size={18} /> 
                                  </button>
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     handleDelete(u.id); 
                                   }} 
                                   className="p-2 text-red-400 hover:text-red-600 transition-colors" 
                                   title="削除" 
                                   > 
                                   <Trash2 size={18} /> 
                                 </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">リンクがまだ登録されていません。</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'detail' && selectedUrlId && ( <Detail url={urls.find(u => u.id === selectedUrlId)} clicks={stats?.clicks.filter(c => c.urlId === selectedUrlId) || []} /> )}

           {activeTab.startsWith("detail-") && (() => {
  const selectedId = activeTab.replace("detail-", "");
  const selectedUrl = urls.find(u => u.id === selectedId);

  if (!selectedUrl) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">詳細ページ</h2>
        <p className="text-slate-500">データが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{selectedUrl.title}</h2>

      <div className="space-y-2 text-slate-700">
        <p><span className="font-bold">元URL:</span> {selectedUrl.originalUrl}</p>
        <p>
          <span className="font-bold">短縮URL:</span>  
          {window.location.origin}/r/{selectedUrl.shortCode}
        </p>
      </div>
    </div>
  );
})()}

            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto py-10">
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100">
                  <div className="text-center mb-10">
                    <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <PlusCircle size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">新しいリンクを生成</h2>
                    <p className="text-slate-500 mt-2">元の長いURLを短縮し、クリック解析を開始します。</p>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">元の長いURL</label>
                      <input 
                        type="url" 
                        value={newUrl.original} 
                        onChange={e => setNewUrl({...newUrl, original: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="https://example.com/very-long-product-page-link" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">タイトル (管理用ラベル)</label>
                      <input 
                        type="text" 
                        value={newUrl.title} 
                        onChange={e => setNewUrl({...newUrl, title: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="例: 夏休みキャンペーン用" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-[0.98]"
                    >
                      短縮URLを発行して開始
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
