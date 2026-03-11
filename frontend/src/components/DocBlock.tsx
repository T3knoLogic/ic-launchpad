export function Code({ children, ...p }: React.ComponentProps<"pre">) {
  return (
    <pre className="rounded-lg bg-black/40 border border-ic-border p-4 overflow-x-auto text-sm font-mono text-gray-300 my-4" {...p}>
      <code>{children}</code>
    </pre>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-ic-panel border border-ic-border px-1.5 py-0.5 text-ic-green text-sm font-mono">{children}</code>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-3xl font-bold text-white mb-6">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-semibold text-white mt-10 mb-3 border-b border-ic-border pb-2">{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-lg font-semibold text-white mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 leading-relaxed mb-4">{children}</p>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">{children}</ul>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-6 rounded-lg border border-ic-border">
      <table className="w-full text-sm text-left">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 bg-ic-panel text-gray-400 font-medium border-b border-ic-border">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-300 border-b border-ic-border last:border-0">{children}</td>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-ic-green hover:underline">
      {children}
    </a>
  );
}
