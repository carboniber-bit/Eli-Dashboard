import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  neutro: "bg-areia text-cacau",
  ambar: "bg-ambarclaro text-[#8a6a2f]",
  salvia: "bg-salviaclaro text-[#53694e]",
  rose: "bg-roseclaro text-[#8c4a4a]",
  taupe: "bg-nude/70 text-cacau",
};

export function Badge({ tone = "neutro", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone] ?? tones.neutro
      )}
    >
      {children}
    </span>
  );
}
