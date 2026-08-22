import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { LanguageToggle } from "./language-toggle";
export function CustomerHeader() { return <header className="topbar"><Link href="/" aria-label="Padamshree Garments home"><BrandLogo compact priority /></Link><LanguageToggle /></header>; }
