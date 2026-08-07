import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  domain: string;
  title: string;
  description?: string;
  image?: string;
}

export function extractFirstUrl(text?: string): string | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);

  useEffect(() => {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace(/^www\./, '');
      const pathTitle = parsed.pathname.split('/').filter(Boolean).pop() || domain;
      const cleanTitle = decodeURIComponent(pathTitle).replace(/[-_]/g, ' ');

      setPreview({
        url,
        domain,
        title: cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : domain,
        description: `Visit ${domain}`,
      });
    } catch (_) {
      setPreview(null);
    }
  }, [url]);

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-900/90 hover:bg-zinc-900 transition-colors group text-left no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <Globe className="h-3 w-3" />
            <span className="truncate">{preview.domain}</span>
          </div>
          <h5 className="text-xs font-semibold text-zinc-100 truncate mt-0.5 group-hover:text-emerald-300 transition-colors">
            {preview.title}
          </h5>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{preview.description}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white shrink-0">
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </a>
  );
}
