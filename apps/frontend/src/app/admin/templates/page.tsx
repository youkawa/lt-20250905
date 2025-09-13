"use client";

import { useEffect, useState } from 'react';

import { TemplatesApi } from '@/lib/api';
import { toDisplayMessage } from '@/lib/errors';
import type { Template } from '@/types/api';

// 型は共有定義を使用

export default function AdminTemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [defaultTplId, setDefaultTplId] = useState<string>('');
  const [ruleProjectId, setRuleProjectId] = useState<string>('');
  const [ruleTitlePattern, setRuleTitlePattern] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TemplatesApi.list();
      setItems(data);
    } catch (e) {
      setError(toDisplayMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    setUploading(true);
    try {
      await TemplatesApi.upload(file, title.trim(), version || 1);
      setTitle('');
      setVersion(1);
      await load();
      e.currentTarget.value = '';
    } catch (err) {
      alert(toDisplayMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const isDefault = (t: Template) => !!t.content?.isDefault;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">テンプレート管理</h1>

      <section className="space-y-2">
        <div className="font-semibold">アップロード</div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            className="border rounded px-2 py-1 w-64"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            className="border rounded px-2 py-1 w-28"
            placeholder="バージョン"
            value={version}
            min={1}
            onChange={(e) => setVersion(Number(e.target.value))}
          />
          <input type="file" accept=".pptx" onChange={onUpload} disabled={uploading} />
        </div>
      </section>

      <section className="space-y-2">
        <div className="font-semibold">一覧</div>
        {loading ? (
          <div>読み込み中…</div>
        ) : error ? (
          <div className="text-red-700">{error}</div>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-2 border">タイトル</th>
                <th className="p-2 border">バージョン</th>
                <th className="p-2 border">ファイル</th>
                <th className="p-2 border">既定</th>
                <th className="p-2 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="p-2 border">{t.title}</td>
                  <td className="p-2 border">{t.version}</td>
                  <td className="p-2 border text-xs">
                    {t.content?.originalName || '-'}
                    <div className="text-slate-500">{t.content?.filename}</div>
                  </td>
                  <td className="p-2 border">{isDefault(t) ? '✓' : ''}</td>
                  <td className="p-2 border space-x-2">
                    {!isDefault(t) && (
                      <button
                        className="px-2 py-1 text-xs border rounded hover:bg-slate-50"
                        onClick={async () => {
                          await TemplatesApi.setDefault(t.id);
                          await load();
                        }}
                      >
                        既定にする
                      </button>
                    )}
                    <button
                      className="px-2 py-1 text-xs border rounded text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm('削除しますか？')) return;
                        await TemplatesApi.remove(t.id);
                        await load();
                      }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">既定ルールの追加</div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border rounded px-2 py-1 w-64"
            value={defaultTplId}
            onChange={(e) => setDefaultTplId(e.target.value)}
          >
            <option value="">テンプレートを選択</option>
            {items.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} v{t.version}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="border rounded px-2 py-1 w-56"
            placeholder="Project ID（任意）"
            value={ruleProjectId}
            onChange={(e) => setRuleProjectId(e.target.value)}
          />
          <input
            type="text"
            className="border rounded px-2 py-1 w-72"
            placeholder="Title 正規表現（任意）"
            value={ruleTitlePattern}
            onChange={(e) => setRuleTitlePattern(e.target.value)}
          />
          <button
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
            disabled={!defaultTplId}
            onClick={async () => {
              await TemplatesApi.setDefault(defaultTplId, {
                projectId: ruleProjectId || undefined,
                titlePattern: ruleTitlePattern || undefined,
              });
              setRuleProjectId('');
              setRuleTitlePattern('');
              await load();
            }}
          >
            ルール追加
          </button>
        </div>
        <div className="text-xs text-slate-600">未指定で追加するとグローバル既定になります（他のグローバル既定は解除されます）。</div>
      </section>
    </main>
  );
}
