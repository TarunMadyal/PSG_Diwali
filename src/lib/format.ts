import type { Language, OrderStatus } from "./types";

export const money = (paise: number, language: Language = "en") =>
  new Intl.NumberFormat(language === "kn" ? "kn-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);

export const statusLabel: Record<OrderStatus, { en: string; kn: string }> = {
  placed: { en: "Order placed", kn: "ಆರ್ಡರ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ" },
  accepted: { en: "Accepted", kn: "ಅಂಗೀಕರಿಸಲಾಗಿದೆ" },
  preparing: { en: "Preparing", kn: "ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ" },
  ready: { en: "Ready for pickup", kn: "ಪಡೆಯಲು ಸಿದ್ಧವಾಗಿದೆ" },
  collected: { en: "Collected", kn: "ಪಡೆಯಲಾಗಿದೆ" },
  cancelled: { en: "Cancelled", kn: "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ" },
  expired: { en: "Expired", kn: "ಅವಧಿ ಮುಗಿದಿದೆ" },
};

export const activeStatuses: OrderStatus[] = ["placed", "accepted", "preparing", "ready"];
