'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useProjectsStore } from '@/store/projects';

export default function ProjectsPage() {
  const { projects, loading, error, fetch, create, remove } = useProjectsStore();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projects.length) fetch();
  }, [fetch, projects.length]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await create(name.trim());
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">プロジェクト</h1>

      <form onSubmit={onSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新規プロジェクト名"
          className="border rounded px-2 py-1"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
        >
          {submitting ? '作成中…' : '作成'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>読み込み中…</p>}

      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-3">
                <span>{p.name}</span>
                <Link className="text-blue-600 underline text-sm" href={`/projects/${p.id}/reports`}>
                  レポート一覧へ
                </Link>
              </div>
              <div className="text-xs text-slate-600">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <button onClick={() => remove(p.id)} className="text-sm text-red-700 hover:underline">
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
