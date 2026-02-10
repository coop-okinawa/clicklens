import React from "react";

export const Detail = ({ url, clicks }) => {
  if (!url) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">詳細ページ</h2>
        <p className="text-slate-500">データが見つかりませんでした。</p>
      </div>
    );
  }

  const totalClicks = clicks.length;

  // 国別集計
  const countryStats = clicks.reduce((acc, c) => {
    acc[c.country] = (acc[c.country] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 p-6">

      {/* ← 戻るボタン */}
      <button
        onClick={() => window.history.back()}
        className="text-blue-600 hover:underline mb-4"
      >
        ← 戻る
      </button>

      <header>
        <h2 className="text-2xl font-bold text-slate-900">{url.title}</h2>
        <p className="text-slate-500 mt-1">{url.originalUrl}</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">短縮リンク</h3>
        <div className="font-mono text-blue-600 bg-blue-50 px-3 py-2 rounded-md inline-block">
          {window.location.origin}/r/{url.shortCode}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">総クリック数</h3>
        <div className="text-3xl font-bold text-slate-900">{totalClicks}</div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">国別アクセス</h3>
        {Object.keys(countryStats).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(countryStats).map(([country, count]) => (
              <li key={country} className="flex justify-between text-sm">
                <span>{country}</span>
                <span className="font-bold">{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">データがありません。</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">最近のアクセス</h3>
        {clicks.length > 0 ? (
          <ul className="space-y-3">
            {clicks.slice(0, 10).map((c) => (
              <li key={c.id} className="text-sm border-b pb-2">
                <div className="font-bold">{c.country}</div>
                <div className="text-slate-500 text-xs">
                  {new Date(c.timestamp).toLocaleString()}
                </div>
                <div className="font-mono text-xs">{c.ip}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">アクセス履歴がありません。</p>
        )}
      </div>
    </div>
  );
};
