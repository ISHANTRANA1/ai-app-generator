import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Zap, Database, Code2, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
            <Zap size={16} />
          </div>
          AppForge
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white">Sign in</Link>
          <Link href="/register" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-700">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-8 pt-24 pb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
          <Zap size={13} /> AI-Powered App Generation
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Describe an app.<br />
          <span className="text-violet-400">Get a working one.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
          AppForge converts your natural language description into a fully working full-stack application — with forms, tables, APIs, and a live database. No code required.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/register" className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium hover:bg-violet-700">
            Build your first app <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-300 hover:border-white/20 hover:text-white">
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-6 sm:grid-cols-3 text-left">
          {[
            { icon: <Zap size={20} />, title: "AI Config Generation", desc: "Describe your app in plain English. Claude generates a structured JSON config instantly." },
            { icon: <Database size={20} />, title: "Live Database", desc: "Every app gets its own runtime with real CRUD APIs backed by PostgreSQL." },
            { icon: <Code2 size={20} />, title: "Export to GitHub", desc: "Export your app config, schema, and README to a GitHub repo with one click." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
