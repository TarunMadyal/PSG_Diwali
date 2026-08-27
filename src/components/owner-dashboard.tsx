"use client";
import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  Printer,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { demoCategories, demoOrders, demoProducts, isDemoMode } from "@/lib/demo-data";
import { activeStatuses, money, statusLabel } from "@/lib/format";
import type { Category, Order, OrderStatus, Product } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { BrandLogo } from "./brand-logo";

const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
const PANT_SIZES = ["28", "30", "32", "34", "36", "38", "40"];

const nextActions: Record<OrderStatus, OrderStatus[]> = {
  placed: ["accepted", "cancelled", "expired"],
  accepted: ["preparing", "cancelled", "expired"],
  preparing: ["ready", "cancelled"],
  ready: ["collected", "cancelled"],
  collected: [],
  cancelled: [],
  expired: [],
};

export function OwnerDashboard() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"upload" | "products" | "categories" | "orders">("upload");

  // Catalog State
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // New Product Form State
  const [nameEn, setNameEn] = useState("");
  const [nameKn, setNameKn] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizeVariants, setSizeVariants] = useState<Array<{ size: string; stock: number; colorEn: string; colorKn: string }>>([
    { size: "M", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
    { size: "L", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
    { size: "XL", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
  ]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Category Modal / Inline Form State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatNameKn, setNewCatNameKn] = useState("");
  const [newCatImageFile, setNewCatImageFile] = useState<File | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [selectedId, setSelectedId] = useState(demoOrders[0]?.id);
  const [connected, setConnected] = useState(isDemoMode());
  const seen = useRef(new Set(demoOrders.map((o) => o.id)));

  // Load Catalog from Supabase
  const loadCatalog = useCallback(async () => {
    if (isDemoMode()) return;
    setCatalogLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const [cRes, pRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*,product_variants(*)").order("sort_order"),
      ]);

      if (cRes.data) {
        const loadedCats: Category[] = cRes.data.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameEn: c.name_en,
          nameKn: c.name_kn,
          imageUrl: c.image_path ?? "/demo/category-1.svg",
          sortOrder: c.sort_order,
          active: c.active,
        }));
        setCategories(loadedCats);
        if (!selectedCategoryId && loadedCats.length > 0) {
          setSelectedCategoryId(loadedCats[0].id);
        }
      }

      if (pRes.data) {
        const loadedProducts: Product[] = pRes.data.map((p) => ({
          id: p.id,
          categoryId: p.category_id,
          nameEn: p.name_en,
          nameKn: p.name_kn,
          pricePaise: p.price_paise,
          imageUrl: p.image_path ?? "/demo/product-1.svg",
          sortOrder: p.sort_order,
          active: p.active,
          variants: (p.product_variants ?? []).map((v: {
            id: string;
            product_id: string;
            size: string;
            color_en: string;
            color_kn: string;
            stock_on_hand: number;
            reserved_quantity: number;
            low_stock_threshold: number;
            active: boolean;
          }) => ({
            id: v.id,
            productId: v.product_id,
            size: v.size,
            colorEn: v.color_en,
            colorKn: v.color_kn,
            stockOnHand: v.stock_on_hand,
            reservedQuantity: v.reserved_quantity,
            lowStockThreshold: v.low_stock_threshold,
            active: v.active,
          })),
        }));
        setProducts(loadedProducts);
      }
    } catch (e) {
      console.error("Error loading catalog:", e);
    } finally {
      setCatalogLoading(false);
    }
  }, [selectedCategoryId]);

  // Load Orders from Server API
  const refreshOrders = useCallback(async () => {
    if (isDemoMode()) {
      const local = JSON.parse(localStorage.getItem("psg-demo-orders") ?? "[]") as Order[];
      setOrders([...local, ...demoOrders]);
      return;
    }
    const response = await fetch("/api/owner/orders", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as Order[];
      const incoming = data.filter((o) => !seen.current.has(o.id));
      if (incoming.length) {
        try {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          oscillator.connect(context.destination);
          oscillator.frequency.value = 880;
          oscillator.start();
          oscillator.stop(context.currentTime + 0.16);
        } catch {}
        incoming.forEach((o) => seen.current.add(o.id));
      }
      setOrders(data);
    }
  }, []);

  useEffect(() => {
    const catTimer = window.setTimeout(() => void loadCatalog(), 0);
    const timer = window.setTimeout(() => void refreshOrders(), 0);
    if (isDemoMode()) {
      return () => {
        window.clearTimeout(catTimer);
        window.clearTimeout(timer);
      };
    }

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("owner-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void refreshOrders())
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      window.clearTimeout(catTimer);
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadCatalog, refreshOrders]);

  // Image upload handler for new product
  const handleProductImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  // Toggle size chip
  const toggleSize = (size: string) => {
    if (sizeVariants.some((v) => v.size === size)) {
      setSizeVariants(sizeVariants.filter((v) => v.size !== size));
    } else {
      setSizeVariants([...sizeVariants, { size, stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" }]);
    }
  };

  // Add custom size
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !sizeVariants.some((v) => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setSizeVariants([...sizeVariants, { size: trimmed, stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" }]);
      setCustomSizeInput("");
    }
  };

  // Update stock for a specific size
  const updateSizeStock = (size: string, stock: number) => {
    setSizeVariants(sizeVariants.map((v) => (v.size === size ? { ...v, stock: Math.max(0, stock) } : v)));
  };

  // Quick category creation
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn.trim()) return;

    const catNameEn = newCatNameEn.trim();
    const catNameKn = newCatNameKn.trim() || catNameEn;
    const slug = catNameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = crypto.randomUUID();

    let uploadedImagePath = "/demo/category-1.svg";

    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      if (newCatImageFile) {
        const path = `categories/${id}/${crypto.randomUUID()}-${newCatImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadErr } = await supabase.storage.from("catalog").upload(path, newCatImageFile);
        if (!uploadErr) {
          const { data } = supabase.storage.from("catalog").getPublicUrl(path);
          uploadedImagePath = data.publicUrl;
        }
      }

      const { error } = await supabase.from("categories").insert({
        id,
        slug,
        name_en: catNameEn,
        name_kn: catNameKn,
        image_path: uploadedImagePath,
        sort_order: categories.length * 10 + 10,
        active: true,
      });

      if (error) {
        setBannerMessage({ text: `Failed to create category: ${error.message}`, type: "error" });
        return;
      }
    }

    const newCategory: Category = {
      id,
      slug,
      nameEn: catNameEn,
      nameKn: catNameKn,
      imageUrl: uploadedImagePath,
      sortOrder: categories.length * 10 + 10,
      active: true,
    };

    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategoryId(id);
    setShowAddCategory(false);
    setNewCatNameEn("");
    setNewCatNameKn("");
    setNewCatImageFile(null);
    setBannerMessage({ text: `Category "${catNameEn}" created successfully!`, type: "success" });
  };

  // Product Submit Handler
  const handleUploadProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      setBannerMessage({ text: "Please enter product name.", type: "error" });
      return;
    }
    const catId = selectedCategoryId || categories[0]?.id;
    if (!catId) {
      setBannerMessage({ text: "Please select or create a category first.", type: "error" });
      return;
    }
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      setBannerMessage({ text: "Please enter a valid price in rupees.", type: "error" });
      return;
    }
    if (sizeVariants.length === 0) {
      setBannerMessage({ text: "Please select at least one size for this product.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setBannerMessage({ text: "Uploading product and saving sizes…", type: "info" });

    const productId = crypto.randomUUID();
    let imageUrl = "/demo/product-1.svg";

    try {
      if (!isDemoMode()) {
        const supabase = createBrowserSupabase();

        // 1. Upload image to Supabase Storage if file was provided
        if (imageFile) {
          const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
          const storagePath = `products/${productId}/${crypto.randomUUID()}-${cleanName}`;
          const { error: uploadError } = await supabase.storage.from("catalog").upload(storagePath, imageFile);
          if (uploadError) {
            console.warn("Storage upload failed, fallback to default URL:", uploadError.message);
          } else {
            const { data } = supabase.storage.from("catalog").getPublicUrl(storagePath);
            imageUrl = data.publicUrl;
          }
        }

        // 2. Insert product record
        const { error: productError } = await supabase.from("products").insert({
          id: productId,
          category_id: catId,
          name_en: nameEn.trim(),
          name_kn: nameKn.trim() || nameEn.trim(),
          price_paise: Math.round(priceNum * 100),
          image_path: imageUrl,
          sort_order: products.length * 10 + 10,
          active: true,
        });

        if (productError) {
          throw new Error(`Product save failed: ${productError.message}`);
        }

        // 3. Insert product variants for sizes
        const variantRows = sizeVariants.map((v) => ({
          id: crypto.randomUUID(),
          product_id: productId,
          size: v.size,
          color_en: v.colorEn || "Standard",
          color_kn: v.colorKn || "ಸಾಮಾನ್ಯ",
          stock_on_hand: v.stock,
          reserved_quantity: 0,
          sold_quantity: 0,
          low_stock_threshold: 2,
          active: true,
        }));

        const { error: variantsError } = await supabase.from("product_variants").insert(variantRows);
        if (variantsError) {
          throw new Error(`Size variants save failed: ${variantsError.message}`);
        }
      }

      // Reset form
      setNameEn("");
      setNameKn("");
      setPriceRupees("");
      setImageFile(null);
      setImagePreview(null);
      setSizeVariants([
        { size: "M", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
        { size: "L", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
        { size: "XL", stock: 10, colorEn: "Standard", colorKn: "ಸಾಮಾನ್ಯ" },
      ]);

      setBannerMessage({ text: `🎉 Product "${nameEn}" uploaded and published to customer shop!`, type: "success" });
      await loadCatalog();
      setActiveTab("products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setBannerMessage({ text: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle product active state
  const handleToggleProductActive = async (product: Product) => {
    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
    setBannerMessage({
      text: `Product "${product.nameEn}" is now ${!product.active ? "Visible on shop" : "Hidden from shop"}.`,
      type: "info",
    });
  };

  // Delete product
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.nameEn}"?`)) return;
    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("product_variants").delete().eq("product_id", product.id);
      await supabase.from("products").delete().eq("id", product.id);
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setBannerMessage({ text: `Product "${product.nameEn}" deleted.`, type: "info" });
  };

  // Order state transition
  const handleOrderTransition = async (status: OrderStatus) => {
    const selected = orders.find((o) => o.id === selectedId) ?? orders[0];
    if (!selected) return;
    if (isDemoMode()) {
      setOrders((current) =>
        current.map((o) => (o.id === selected.id ? { ...o, status, paymentStatus: status === "collected" ? "paid" : o.paymentStatus } : o)),
      );
      return;
    }
    const response = await fetch(`/api/owner/orders/${selected.id}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await refreshOrders();
  };

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? orders[0];
  const today = new Date().toDateString();
  const metrics = useMemo(
    () => ({
      placed: orders.filter((o) => o.status === "placed").length,
      preparing: orders.filter((o) => ["accepted", "preparing"].includes(o.status)).length,
      ready: orders.filter((o) => o.status === "ready").length,
      revenue: orders
        .filter((o) => o.status === "collected" && new Date(o.placedAt).toDateString() === today)
        .reduce((s, o) => s + o.totalPaise, 0),
    }),
    [orders, today],
  );

  return (
    <div className="owner-shell">
      {/* Top Navigation Bar */}
      <header className="owner-header" style={{ height: "auto", minHeight: 70, padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/owner" aria-label="PSG Owner Home">
            <BrandLogo compact priority />
          </Link>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--wine)", background: "#fae8ea", padding: "4px 10px", borderRadius: 999 }}>
            Owner Portal
          </span>
        </div>

        <nav className="owner-nav" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={activeTab === "upload" ? "primary" : "secondary"}
            style={{ minHeight: 42, padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }}
          >
            <Plus size={18} /> Upload Product
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={activeTab === "products" ? "primary" : "secondary"}
            style={{ minHeight: 42, padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }}
          >
            <Package size={18} /> Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={activeTab === "categories" ? "primary" : "secondary"}
            style={{ minHeight: 42, padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }}
          >
            <Layers size={18} /> Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={activeTab === "orders" ? "primary" : "secondary"}
            style={{ minHeight: 42, padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem" }}
          >
            <Bell size={18} /> Orders ({orders.filter((o) => activeStatuses.includes(o.status)).length})
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link className="secondary" href="/" target="_blank" style={{ minHeight: 40, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
            <ShoppingBag size={16} /> View Shop
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="owner-main" style={{ maxWidth: 1120, padding: "20px 16px" }}>
        {bannerMessage && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 700,
              background: bannerMessage.type === "success" ? "#dcf6e9" : bannerMessage.type === "error" ? "#fee2e2" : "#fef3c7",
              color: bannerMessage.type === "success" ? "#065f46" : bannerMessage.type === "error" ? "#991b1b" : "#92400e",
              border: `1px solid ${bannerMessage.type === "success" ? "#a7f3d0" : bannerMessage.type === "error" ? "#fecaca" : "#fde68a"}`,
            }}
          >
            <span>{bannerMessage.text}</span>
            <button
              onClick={() => setBannerMessage(null)}
              style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer", color: "inherit" }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* TAB 1: UPLOAD PRODUCT */}
        {activeTab === "upload" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--ink)" }}>Upload New Product</h1>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
                Add product name, category, image, price and available sizes. Changes appear live on the shop immediately.
              </p>
            </div>

            <form
              onSubmit={handleUploadProduct}
              style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #e0dcd7",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                display: "grid",
                gap: 24,
              }}
            >
              {/* 1. Category Selector */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 900, fontSize: "1rem", color: "var(--ink)" }}>
                    1. Choose Category <span style={{ color: "var(--wine)" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    style={{
                      background: "transparent",
                      border: "1px dashed var(--wine)",
                      color: "var(--wine)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FolderPlus size={14} /> + New Category
                  </button>
                </div>

                {/* Inline New Category Form */}
                {showAddCategory && (
                  <div style={{ background: "#fbf8f4", border: "1.5px solid var(--gold)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "var(--ink)" }}>Create a New Category</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        placeholder="Category Name (e.g. Shirt, Night pant, Night shirt)"
                        value={newCatNameEn}
                        onChange={(e) => setNewCatNameEn(e.target.value)}
                        style={{ height: 44, padding: "8px 12px", border: "1px solid #cbbcab", borderRadius: 10 }}
                      />
                      <input
                        placeholder="Kannada Name (optional)"
                        value={newCatNameKn}
                        onChange={(e) => setNewCatNameKn(e.target.value)}
                        style={{ height: 44, padding: "8px 12px", border: "1px solid #cbbcab", borderRadius: 10 }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button type="button" onClick={handleCreateCategory} className="primary" style={{ minHeight: 38, padding: "6px 14px", fontSize: "0.88rem" }}>
                        Save Category
                      </button>
                      <button type="button" onClick={() => setShowAddCategory(false)} className="secondary" style={{ minHeight: 38, padding: "6px 14px", fontSize: "0.88rem" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Chips Selection */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 12,
                          border: isSelected ? "2px solid var(--wine)" : "1px solid #ddd6ce",
                          background: isSelected ? "#fff0f2" : "#fdfbf8",
                          color: isSelected ? "var(--wine)" : "var(--ink)",
                          fontWeight: isSelected ? 900 : 700,
                          fontSize: "0.92rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected && <Check size={16} />}
                        {cat.nameEn}
                        {cat.nameKn && cat.nameKn !== cat.nameEn && (
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 400 }}>({cat.nameKn})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Product Name & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 900, fontSize: "1rem", marginBottom: 6, color: "var(--ink)" }}>
                    2. Product Name (English) <span style={{ color: "var(--wine)" }}>*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Cotton Check Shirt, Men's Night Pant"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    style={{ width: "100%", height: 50, padding: "10px 14px", border: "1.5px solid #cbbcab", borderRadius: 12, fontSize: "1rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 900, fontSize: "1rem", marginBottom: 6, color: "var(--ink)" }}>
                    Product Name (Kannada) <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ಕಾಟನ್ ಶರ್ಟ್, ನೈಟ್ ಪ್ಯಾಂಟ್"
                    value={nameKn}
                    onChange={(e) => setNameKn(e.target.value)}
                    style={{ width: "100%", height: 50, padding: "10px 14px", border: "1.5px solid #cbbcab", borderRadius: 12, fontSize: "1rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 900, fontSize: "1rem", marginBottom: 6, color: "var(--ink)" }}>
                    Price (₹) <span style={{ color: "var(--wine)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, fontSize: "1.2rem", fontWeight: 900, color: "var(--wine)" }}>₹</span>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="299"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(e.target.value)}
                      style={{ width: "100%", height: 50, paddingLeft: 34, paddingRight: 14, border: "1.5px solid #cbbcab", borderRadius: 12, fontSize: "1.1rem", fontWeight: 800 }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Product Photo Upload */}
              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "1rem", marginBottom: 8, color: "var(--ink)" }}>
                  3. Product Photo / Image
                </label>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <label
                    style={{
                      flex: 1,
                      minWidth: 260,
                      minHeight: 120,
                      border: "2px dashed #cbbcab",
                      borderRadius: 16,
                      background: "#faf7f2",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 16,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <Upload size={28} color="var(--wine)" />
                    <span style={{ marginTop: 6, fontWeight: 800, color: "var(--ink)" }}>Click to take photo or choose file</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Supports JPG, PNG, WEBP from mobile or computer</span>
                    <input type="file" accept="image/*" onChange={handleProductImageChange} style={{ display: "none" }} />
                  </label>

                  {imagePreview ? (
                    <div style={{ position: "relative", width: 120, height: 120, borderRadius: 14, overflow: "hidden", border: "2px solid var(--wine)", background: "#eee" }}>
                      <Image src={imagePreview} alt="Preview" fill style={{ objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.65)",
                          color: "#fff",
                          border: 0,
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 120, height: 120, borderRadius: 14, border: "1px dashed #d5ccc0", background: "#f7f3ee", display: "grid", placeItems: "center", color: "var(--muted)" }}>
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Sizes and Quantity / Stock */}
              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "1rem", marginBottom: 6, color: "var(--ink)" }}>
                  4. Available Sizes & Stock Quantity <span style={{ color: "var(--wine)" }}>*</span>
                </label>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Tap the sizes you have in stock, then adjust the quantity for each size:
                </p>

                {/* Standard Size Chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, alignSelf: "center", color: "var(--muted)", marginRight: 4 }}>Standard:</span>
                  {STANDARD_SIZES.map((size) => {
                    const active = sizeVariants.some((v) => v.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        style={{
                          minWidth: 46,
                          height: 38,
                          borderRadius: 10,
                          border: active ? "2px solid var(--wine)" : "1px solid #d5ccc0",
                          background: active ? "var(--wine)" : "#fff",
                          color: active ? "#fff" : "var(--ink)",
                          fontWeight: 900,
                          fontSize: "0.88rem",
                          cursor: "pointer",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Pant Waist Sizes */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, alignSelf: "center", color: "var(--muted)", marginRight: 4 }}>Waist:</span>
                  {PANT_SIZES.map((size) => {
                    const active = sizeVariants.some((v) => v.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        style={{
                          minWidth: 42,
                          height: 36,
                          borderRadius: 8,
                          border: active ? "2px solid var(--wine)" : "1px solid #d5ccc0",
                          background: active ? "var(--wine)" : "#fff",
                          color: active ? "#fff" : "var(--ink)",
                          fontWeight: 900,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Size Input */}
                <div style={{ display: "flex", gap: 8, maxWidth: 300, marginBottom: 16 }}>
                  <input
                    placeholder="Custom size (e.g. 42, XXL, Kid 10)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    style={{ height: 38, padding: "6px 10px", border: "1px solid #cbbcab", borderRadius: 8, fontSize: "0.85rem", flex: 1 }}
                  />
                  <button type="button" onClick={handleAddCustomSize} className="secondary" style={{ minHeight: 38, padding: "6px 12px", fontSize: "0.85rem" }}>
                    + Add Size
                  </button>
                </div>

                {/* Selected Sizes Stock List */}
                {sizeVariants.length > 0 ? (
                  <div style={{ background: "#fbf9f6", border: "1px solid #e5dfd6", borderRadius: 14, padding: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                      {sizeVariants.map((item) => (
                        <div
                          key={item.size}
                          style={{
                            background: "#fff",
                            border: "1px solid #ded6cc",
                            borderRadius: 10,
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "1rem", color: "var(--wine)" }}>Size {item.size}</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Stock qty</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={(e) => updateSizeStock(item.size, parseInt(e.target.value) || 0)}
                              style={{ width: 60, height: 36, textAlign: "center", border: "1.5px solid #cbbcab", borderRadius: 8, fontWeight: 900 }}
                            />
                            <button
                              type="button"
                              onClick={() => toggleSize(item.size)}
                              style={{ background: "transparent", border: 0, color: "#991b1b", padding: 2, cursor: "pointer" }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px", background: "#fef2f2", color: "#991b1b", borderRadius: 10, fontSize: "0.88rem", fontWeight: 700 }}>
                    ⚠️ Please select at least one size above.
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ borderTop: "1px solid #eee6dc", paddingTop: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary"
                  style={{ minHeight: 52, padding: "12px 32px", fontSize: "1.1rem", borderRadius: 14, display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <Upload size={20} />
                  {isSubmitting ? "Uploading & Publishing…" : "Publish Product to Shop"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--ink)" }}>Products Catalog</h1>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
                  All products available on the mobile customer website ({products.length} items)
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={loadCatalog} className="secondary" style={{ minHeight: 42, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={16} /> Reload
                </button>
                <button onClick={() => setActiveTab("upload")} className="primary" style={{ minHeight: 42, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus size={18} /> Add New Product
                </button>
              </div>
            </div>

            {catalogLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading products…</div>
            ) : products.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid #eee" }}>
                <h2>No products found</h2>
                <p>Click &ldquo;Add New Product&rdquo; to upload your first shirt or pant.</p>
                <button onClick={() => setActiveTab("upload")} className="primary" style={{ marginTop: 12 }}>
                  + Upload Product
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {products.map((product) => {
                  const cat = categories.find((c) => c.id === product.categoryId);
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stockOnHand, 0);
                  const totalReserved = product.variants.reduce((sum, v) => sum + v.reservedQuantity, 0);
                  const available = totalStock - totalReserved;

                  return (
                    <div
                      key={product.id}
                      style={{
                        background: "#fff",
                        borderRadius: 18,
                        border: product.active ? "1px solid #e0dcd7" : "1.5px dashed #c0b8af",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        opacity: product.active ? 1 : 0.65,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Thumbnail & Badges */}
                      <div style={{ position: "relative", height: 160, background: "#f2ece4" }}>
                        <Image src={product.imageUrl} alt={product.nameEn} fill style={{ objectFit: "cover" }} />
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            background: "rgba(255,255,255,0.92)",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: "var(--wine)",
                          }}
                        >
                          {cat?.nameEn ?? "Clothing"}
                        </span>
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: available > 0 ? "#17724c" : "#991b1b",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: "0.75rem",
                            fontWeight: 900,
                          }}
                        >
                          {available > 0 ? `${available} in stock` : "Sold Out"}
                        </span>
                      </div>

                      {/* Info & Sizes */}
                      <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1 }}>
                        <h3 style={{ margin: "0 0 2px", fontSize: "1.1rem", color: "var(--ink)" }}>{product.nameEn}</h3>
                        {product.nameKn && product.nameKn !== product.nameEn && (
                          <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 6 }}>{product.nameKn}</div>
                        )}
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--wine-dark)", margin: "4px 0 10px" }}>
                          {money(product.pricePaise)}
                        </div>

                        {/* Sizes Pill list */}
                        <div style={{ marginTop: "auto", borderTop: "1px solid #eee7dd", paddingTop: 10 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                            Sizes & Stock:
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {product.variants.map((v) => (
                              <span
                                key={v.id}
                                style={{
                                  background: "#f4ede4",
                                  border: "1px solid #e0d7cb",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  fontSize: "0.76rem",
                                  fontWeight: 800,
                                }}
                              >
                                {v.size}: {v.stockOnHand - v.reservedQuantity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #eee7dd", paddingTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(product)}
                            className="secondary"
                            style={{ flex: 1, minHeight: 36, padding: "4px 8px", fontSize: "0.8rem", fontWeight: 800 }}
                          >
                            {product.active ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="danger"
                            style={{ minHeight: 36, padding: "4px 10px", fontSize: "0.8rem", display: "grid", placeItems: "center" }}
                            title="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === "categories" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--ink)" }}>Product Categories</h1>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
                  Categories displayed on the shop home page (e.g. Shirt, Night pant, Night shirt)
                </p>
              </div>
              <button onClick={() => setShowAddCategory(true)} className="primary" style={{ minHeight: 42, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={18} /> Add Category
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddCategory && (
              <form
                onSubmit={handleCreateCategory}
                style={{ background: "#fff", border: "1.5px solid var(--wine)", borderRadius: 16, padding: 20, marginBottom: 20 }}
              >
                <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem" }}>Add New Category</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: 4 }}>English Name *</label>
                    <input
                      required
                      placeholder="e.g. Shirt, Night pant, Night shirt"
                      value={newCatNameEn}
                      onChange={(e) => setNewCatNameEn(e.target.value)}
                      style={{ width: "100%", height: 44, padding: "8px 12px", border: "1px solid #cbbcab", borderRadius: 10 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: 4 }}>Kannada Name (optional)</label>
                    <input
                      placeholder="e.g. ಶರ್ಟ್, ನೈಟ್ ಪ್ಯಾಂಟ್"
                      value={newCatNameKn}
                      onChange={(e) => setNewCatNameKn(e.target.value)}
                      style={{ width: "100%", height: 44, padding: "8px 12px", border: "1px solid #cbbcab", borderRadius: 10 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: 4 }}>Category Picture (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewCatImageFile(file);
                      }
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="primary" style={{ minHeight: 40, padding: "8px 18px" }}>
                    Save Category
                  </button>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="secondary" style={{ minHeight: 40, padding: "8px 16px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e0dcd7",
                      borderRadius: 16,
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div style={{ position: "relative", width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "#f2ece4", flexShrink: 0 }}>
                      <Image src={cat.imageUrl} alt={cat.nameEn} fill style={{ objectFit: "cover" }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)" }}>{cat.nameEn}</h4>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{cat.nameKn}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--wine)", marginTop: 2 }}>
                        {count} {count === 1 ? "product" : "products"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS QUEUE */}
        {activeTab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--ink)" }}>Shop Floor & Orders</h1>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
                  {connected ? "● Live customer orders connected" : "○ Reconnecting to realtime feed"}
                </p>
              </div>
              <button onClick={refreshOrders} className="secondary" style={{ minHeight: 42, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={16} /> Reload Orders
              </button>
            </div>

            <section className="metric-grid" style={{ marginBottom: 18 }}>
              <div className="metric"><span>NEW ORDERS</span><strong>{metrics.placed}</strong></div>
              <div className="metric"><span>PREPARING</span><strong>{metrics.preparing}</strong></div>
              <div className="metric"><span>READY</span><strong>{metrics.ready}</strong></div>
              <div className="metric"><span>COLLECTED REVENUE</span><strong>{money(metrics.revenue)}</strong></div>
            </section>

            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-title">
                  <h2><Bell size={18} /> Incoming Orders</h2>
                  <span>{orders.filter((o) => activeStatuses.includes(o.status)).length} active</span>
                </div>
                <div className="order-list">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      className={`order-row ${selectedOrder?.id === order.id ? "selected" : ""}`}
                      onClick={() => setSelectedId(order.id)}
                    >
                      <span className="order-token">{order.token}</span>
                      <span className="order-meta">
                        <strong>{order.customerName}</strong>
                        <small>{order.items.reduce((s, i) => s + i.quantity, 0)} items · {money(order.totalPaise)}</small>
                      </span>
                      <span className={`status-pill ${order.status}`}>{statusLabel[order.status].en}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel">
                {selectedOrder ? (
                  <>
                    <div className="order-detail-head">
                      <div>
                        <p className="eyebrow">TOKEN {selectedOrder.token}</p>
                        <h2>{selectedOrder.customerName}</h2>
                        <small>{selectedOrder.customerPhone || "No phone"} · {selectedOrder.source}</small>
                      </div>
                      <span className={`status-pill ${selectedOrder.status}`}>{statusLabel[selectedOrder.status].en}</span>
                    </div>

                    <table className="detail-table">
                      <thead>
                        <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.productNameEn}</strong><br />
                              <small>{item.size} · {item.colorEn}</small>
                            </td>
                            <td>{item.quantity}</td>
                            <td>{money(item.lineTotalPaise)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><th colSpan={2}>Pay at collection</th><th>{money(selectedOrder.totalPaise)}</th></tr>
                      </tfoot>
                    </table>

                    <div className="action-row">
                      {nextActions[selectedOrder.status].map((status) => (
                        <button
                          key={status}
                          className={status === "cancelled" || status === "expired" ? "danger" : "primary"}
                          onClick={() => handleOrderTransition(status)}
                        >
                          {statusLabel[status].en}
                        </button>
                      ))}
                      {["accepted", "preparing", "ready", "collected"].includes(selectedOrder.status) && (
                        <Link className="secondary" href={`/owner/receipt/${selectedOrder.id}`}>
                          <Printer size={17} /> Print receipt
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Select an order from the list</div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
