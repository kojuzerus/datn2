import Link from "next/link";
import type { ElementType, ReactNode } from "react";

type InfoCard = {
  title: string;
  description: string;
  icon: ElementType;
  accent: string;
};

export default function InfoPage({
  title,
  subtitle,
  cards,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  cards: InfoCard[];
  children?: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-12">
          <div className="mb-10 max-w-3xl">
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-red-600">
              Trợ giúp
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl border border-gray-100 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.accent} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              );
            })}
          </div>

          {children && <div className="mt-10">{children}</div>}

          {action && (
            <div className="mt-12">
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/10 transition hover:bg-red-700"
              >
                {action.label}
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-sm">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
