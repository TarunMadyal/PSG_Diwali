import Image from "next/image";
export function BrandLogo({ compact = false, priority = false }: { compact?: boolean; priority?: boolean }) {
  return <Image src="/brand/padamshree-garments.png" alt="Padamshree Garments" width={1024} height={552} priority={priority} className={`brand-logo${compact ? " compact" : ""}`} sizes={compact ? "118px" : "210px"} />;
}
