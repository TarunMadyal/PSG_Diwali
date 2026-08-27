import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { LanguageToggle } from "./language-toggle";
import { ActiveOrderBanner } from "./active-order-banner";

export function CustomerHeader() {
  return (
    <>
      <ActiveOrderBanner />
      <header className="topbar">
        <Link href="/" aria-label="Padamshree Garments home">
          <BrandLogo compact priority />
        </Link>
        <LanguageToggle />
      </header>
    </>
  );
}
