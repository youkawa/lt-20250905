export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Notebook Report Weaver</h1>
      <p className="text-slate-600 mt-2">Front-end scaffold (Next.js 14)</p>
      <ul className="mt-4 list-disc list-inside">
        <li>
          <a className="text-blue-600 underline" href="/projects">プロジェクト一覧</a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/parse">Notebook解析デモ</a>
        </li>
      </ul>
    </main>
  );
}
