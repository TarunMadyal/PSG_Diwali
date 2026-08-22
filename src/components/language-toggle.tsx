"use client";
import { useApp } from "./app-providers";
export function LanguageToggle() { const { language, setLanguage } = useApp(); return <div className="language-toggle" aria-label="Language / ಭಾಷೆ"><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>English</button><button className={language === "kn" ? "active" : ""} onClick={() => setLanguage("kn")} aria-pressed={language === "kn"}>ಕನ್ನಡ</button></div>; }
