"use client";
import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  Edit2,
  Eye,
  EyeOff,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Minus,
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
import { autoTranslateToKannada } from "@/lib/kannada";
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
  // Navigation Tabs (Mobile-first)
  const [activeTab, setActiveTab] = useState<"upload" | "products" | "categories" | "orders">("upload");

  // Catalog State
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // New Product Form State (English only)
  const [nameEn, setNameEn] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizeVariants, setSizeVariants] = useState<Array<{ size: string; stock: number; colorEn: string }>>([
    { size: "M", stock: 10, colorEn: "Standard" },
    { size: "L", stock: 10, colorEn: "Standard" },
    { size: "XL", stock: 10, colorEn: "Standard" },
  ]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPriceRupees, setEditPriceRupees] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editVariants, setEditVariants] = useState<Array<{ id: string; size: string; stock: number; colorEn: string }>>([]);
  const [editCustomSize, setEditCustomSize] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Category Add/Edit Modal State (English only)
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameEn, setCatNameEn] = useState("");
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [selectedId, setSelectedId] = useState(demoOrders[0]?.id);
  const [connected, setConnected] = useState(isDemoMode());
  const seen = useRef(new Set(demoOrders.map((o) => o.id)));

  // Edit & Delete Order State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderName, setEditOrderName] = useState("");
  const [editOrderPhone, setEditOrderPhone] = useState("");
  const [editOrderItems, setEditOrderItems] = useState<
    Array<{ id: string; productNameEn: string; size: string; quantity: number; unitPricePaise: number }>
  >([]);
  const [isSavingOrderEdit, setIsSavingOrderEdit] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

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
          nameKn: c.name_kn ?? autoTranslateToKannada(c.name_en),
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
          nameKn: p.name_kn ?? autoTranslateToKannada(p.name_en),
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

  // Load Orders
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

  // -------------------------------------------------------------
  // Product Creation Handlers
  // -------------------------------------------------------------
  const handleProductImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleSize = (size: string) => {
    if (sizeVariants.some((v) => v.size === size)) {
      setSizeVariants(sizeVariants.filter((v) => v.size !== size));
    } else {
      setSizeVariants([...sizeVariants, { size, stock: 10, colorEn: "Standard" }]);
    }
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !sizeVariants.some((v) => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setSizeVariants([...sizeVariants, { size: trimmed, stock: 10, colorEn: "Standard" }]);
      setCustomSizeInput("");
    }
  };

  const updateSizeStock = (size: string, stock: number) => {
    setSizeVariants(sizeVariants.map((v) => (v.size === size ? { ...v, stock: Math.max(0, stock) } : v)));
  };

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
      setBannerMessage({ text: "Please enter a valid price in ₹.", type: "error" });
      return;
    }
    if (sizeVariants.length === 0) {
      setBannerMessage({ text: "Please select at least one size.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setBannerMessage({ text: "Uploading product from your phone…", type: "info" });

    const productId = crypto.randomUUID();
    let imageUrl = "/demo/product-1.svg";
    const autoKn = autoTranslateToKannada(nameEn.trim());

    try {
      if (!isDemoMode()) {
        const supabase = createBrowserSupabase();

        // 1. Upload image if provided
        if (imageFile) {
          const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
          const storagePath = `products/${productId}/${crypto.randomUUID()}-${cleanName}`;
          const { error: uploadError } = await supabase.storage.from("catalog").upload(storagePath, imageFile);
          if (!uploadError) {
            const { data } = supabase.storage.from("catalog").getPublicUrl(storagePath);
            imageUrl = data.publicUrl;
          }
        }

        // 2. Insert product
        const { error: productError } = await supabase.from("products").insert({
          id: productId,
          category_id: catId,
          name_en: nameEn.trim(),
          name_kn: autoKn,
          price_paise: Math.round(priceNum * 100),
          image_path: imageUrl,
          sort_order: products.length * 10 + 10,
          active: true,
        });

        if (productError) throw new Error(productError.message);

        // 3. Insert size variants
        const variantRows = sizeVariants.map((v) => ({
          id: crypto.randomUUID(),
          product_id: productId,
          size: v.size,
          color_en: v.colorEn || "Standard",
          color_kn: autoTranslateToKannada(v.colorEn || "Standard"),
          stock_on_hand: v.stock,
          reserved_quantity: 0,
          sold_quantity: 0,
          low_stock_threshold: 2,
          active: true,
        }));

        const { error: variantsError } = await supabase.from("product_variants").insert(variantRows);
        if (variantsError) throw new Error(variantsError.message);
      }

      // Reset form
      setNameEn("");
      setPriceRupees("");
      setImageFile(null);
      setImagePreview(null);
      setSizeVariants([
        { size: "M", stock: 10, colorEn: "Standard" },
        { size: "L", stock: 10, colorEn: "Standard" },
        { size: "XL", stock: 10, colorEn: "Standard" },
      ]);

      setBannerMessage({ text: `🎉 "${nameEn}" added to shop!`, type: "success" });
      await loadCatalog();
      setActiveTab("products");
    } catch (err: unknown) {
      setBannerMessage({ text: err instanceof Error ? err.message : "Upload failed", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Product Edit Handlers
  // -------------------------------------------------------------
  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditNameEn(product.nameEn);
    setEditCategoryId(product.categoryId);
    setEditPriceRupees((product.pricePaise / 100).toString());
    setEditImageFile(null);
    setEditImagePreview(product.imageUrl);
    setEditVariants(
      product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        stock: v.stockOnHand,
        colorEn: v.colorEn || "Standard",
      })),
    );
  };

  const handleSaveProductEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = parseFloat(editPriceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price in ₹.");
      return;
    }

    setIsSavingEdit(true);
    const autoKn = autoTranslateToKannada(editNameEn.trim());
    let imageUrl = editingProduct.imageUrl;

    try {
      if (!isDemoMode()) {
        const supabase = createBrowserSupabase();

        // 1. Upload replacement image if selected
        if (editImageFile) {
          const cleanName = editImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
          const storagePath = `products/${editingProduct.id}/${crypto.randomUUID()}-${cleanName}`;
          const { error: uploadError } = await supabase.storage.from("catalog").upload(storagePath, editImageFile);
          if (!uploadError) {
            const { data } = supabase.storage.from("catalog").getPublicUrl(storagePath);
            imageUrl = data.publicUrl;
          }
        }

        // 2. Update product
        const { error: pError } = await supabase
          .from("products")
          .update({
            name_en: editNameEn.trim(),
            name_kn: autoKn,
            category_id: editCategoryId,
            price_paise: Math.round(priceNum * 100),
            image_path: imageUrl,
          })
          .eq("id", editingProduct.id);

        if (pError) throw new Error(pError.message);

        // 3. Upsert variants
        for (const v of editVariants) {
          await supabase.from("product_variants").upsert({
            id: v.id,
            product_id: editingProduct.id,
            size: v.size,
            color_en: v.colorEn,
            color_kn: autoTranslateToKannada(v.colorEn),
            stock_on_hand: v.stock,
            active: true,
          });
        }
      }

      setBannerMessage({ text: `Updated "${editNameEn}" successfully!`, type: "success" });
      setEditingProduct(null);
      await loadCatalog();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Quick stock adjuster (+1 / -1) from card view
  const adjustQuickStock = async (product: Product, variantId: string, delta: number) => {
    const v = product.variants.find((item) => item.id === variantId);
    if (!v) return;
    const newStock = Math.max(0, v.stockOnHand + delta);

    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("product_variants").update({ stock_on_hand: newStock }).eq("id", variantId);
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              variants: p.variants.map((item) => (item.id === variantId ? { ...item, stockOnHand: newStock } : item)),
            }
          : p,
      ),
    );
  };

  const handleToggleProductActive = async (product: Product) => {
    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
    setBannerMessage({
      text: `"${product.nameEn}" is now ${!product.active ? "Visible" : "Hidden"}.`,
      type: "info",
    });
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.nameEn}"?`)) return;
    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("product_variants").delete().eq("product_id", product.id);
      await supabase.from("products").delete().eq("id", product.id);
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setBannerMessage({ text: `Product "${product.nameEn}" deleted.`, type: "info" });
  };

  // -------------------------------------------------------------
  // Category Handlers (Add / Edit / Delete)
  // -------------------------------------------------------------
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatNameEn("");
    setCatImageFile(null);
    setCatImagePreview(null);
    setShowAddCategory(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatNameEn(cat.nameEn);
    setCatImageFile(null);
    setCatImagePreview(cat.imageUrl);
    setShowAddCategory(true);
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catNameEn.trim()) return;

    const name = catNameEn.trim();
    const autoKn = autoTranslateToKannada(name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`;
    const id = editingCategory ? editingCategory.id : crypto.randomUUID();
    let imagePath = editingCategory ? editingCategory.imageUrl : "/demo/category-1.svg";

    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      if (catImageFile) {
        const path = `categories/${id}/${crypto.randomUUID()}-${catImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadErr } = await supabase.storage.from("catalog").upload(path, catImageFile);
        if (!uploadErr) {
          const { data } = supabase.storage.from("catalog").getPublicUrl(path);
          imagePath = data.publicUrl;
        }
      }

      if (editingCategory) {
        const { error } = await supabase.from("categories").update({
          name_en: name,
          name_kn: autoKn,
          image_path: imagePath,
        }).eq("id", id);
        if (error) {
          alert(`Error updating category: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase.from("categories").insert({
          id,
          slug,
          name_en: name,
          name_kn: autoKn,
          image_path: imagePath,
          sort_order: categories.length * 10 + 10,
          active: true,
        });
        if (error) {
          alert(`Error adding category: ${error.message}`);
          return;
        }
      }
    }

    setShowAddCategory(false);
    setBannerMessage({ text: `Category "${name}" saved!`, type: "success" });
    await loadCatalog();
  };

  const handleDeleteCategory = async (cat: Category) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    if (count > 0) {
      alert(`Cannot delete category "${cat.nameEn}" because it has ${count} product(s). Please move or delete those products first.`);
      return;
    }
    if (!confirm(`Delete category "${cat.nameEn}"?`)) return;

    if (!isDemoMode()) {
      const supabase = createBrowserSupabase();
      await supabase.from("categories").delete().eq("id", cat.id);
    }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    setBannerMessage({ text: `Category "${cat.nameEn}" deleted.`, type: "info" });
  };

  // Order transition
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

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order);
    setEditOrderName(order.customerName);
    setEditOrderPhone(order.customerPhone ?? "");
    setEditOrderItems(
      order.items.map((i) => ({
        id: i.id,
        productNameEn: i.productNameEn,
        size: i.size,
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
      })),
    );
  };

  const handleSaveOrderEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (editOrderItems.length === 0) {
      alert("Order must have at least one item.");
      return;
    }
    setIsSavingOrderEdit(true);
    try {
      if (isDemoMode()) {
        const updatedTotal = editOrderItems.reduce((sum, i) => sum + i.quantity * i.unitPricePaise, 0);
        const updated: Order = {
          ...editingOrder,
          customerName: editOrderName.trim(),
          customerPhone: editOrderPhone.trim() || undefined,
          items: editingOrder.items
            .map((orig) => {
              const edited = editOrderItems.find((e) => e.id === orig.id);
              return edited
                ? { ...orig, quantity: edited.quantity, lineTotalPaise: edited.quantity * orig.unitPricePaise }
                : orig;
            })
            .filter((orig) => editOrderItems.some((e) => e.id === orig.id)),
          totalPaise: updatedTotal,
        };
        setOrders(orders.map((o) => (o.id === editingOrder.id ? updated : o)));
        setBannerMessage({ text: `Order ${editingOrder.token} updated!`, type: "success" });
        setEditingOrder(null);
      } else {
        const res = await fetch(`/api/owner/orders/${editingOrder.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customerName: editOrderName.trim(),
            customerPhone: editOrderPhone.trim() || null,
            items: editOrderItems.map((i) => ({ id: i.id, quantity: i.quantity, unitPricePaise: i.unitPricePaise })),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update order");
        const updatedOrder: Order = await res.json();
        setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
        setBannerMessage({ text: `Order ${editingOrder.token} updated successfully!`, type: "success" });
        setEditingOrder(null);
      }
    } catch (err) {
      setBannerMessage({ text: err instanceof Error ? err.message : "Update failed", type: "error" });
    } finally {
      setIsSavingOrderEdit(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete order ${order.token} for ${order.customerName}? This will cancel the order and release reserved stock.`,
      )
    ) {
      return;
    }
    setIsDeletingOrder(true);
    try {
      if (isDemoMode()) {
        const nextOrders = orders.filter((o) => o.id !== order.id);
        setOrders(nextOrders);
        if (selectedId === order.id) setSelectedId(nextOrders[0]?.id);
        setBannerMessage({ text: `Order ${order.token} deleted!`, type: "success" });
      } else {
        const res = await fetch(`/api/owner/orders/${order.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to delete order");
        const nextOrders = orders.filter((o) => o.id !== order.id);
        setOrders(nextOrders);
        if (selectedId === order.id) setSelectedId(nextOrders[0]?.id);
        setBannerMessage({ text: `Order ${order.token} deleted successfully!`, type: "success" });
      }
    } catch (err) {
      setBannerMessage({ text: err instanceof Error ? err.message : "Delete failed", type: "error" });
    } finally {
      setIsDeletingOrder(false);
    }
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
    <div className="owner-shell" style={{ paddingBottom: 80 }}>
      {/* Top Header */}
      <header
        className="owner-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "#fff",
          borderBottom: "1px solid #e2ddd8",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/owner">
            <BrandLogo compact priority />
          </Link>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, background: "#fae8ea", color: "var(--wine)", padding: "3px 8px", borderRadius: 999 }}>
            Owner
          </span>
        </div>

        {/* Desktop/Tablet Top Tabs */}
        <nav className="owner-nav" style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={activeTab === "upload" ? "primary" : "secondary"}
            style={{ minHeight: 38, padding: "6px 14px", borderRadius: 10, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Add Product
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={activeTab === "products" ? "primary" : "secondary"}
            style={{ minHeight: 38, padding: "6px 14px", borderRadius: 10, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Package size={16} /> Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={activeTab === "categories" ? "primary" : "secondary"}
            style={{ minHeight: 38, padding: "6px 14px", borderRadius: 10, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Layers size={16} /> Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={activeTab === "orders" ? "primary" : "secondary"}
            style={{ minHeight: 38, padding: "6px 14px", borderRadius: 10, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Bell size={16} /> Orders ({orders.filter((o) => activeStatuses.includes(o.status)).length})
          </button>
        </nav>

        <Link
          className="secondary"
          href="/"
          target="_blank"
          style={{ minHeight: 36, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", borderRadius: 10 }}
        >
          <ShoppingBag size={15} /> Shop
        </Link>
      </header>

      {/* Main Container */}
      <main className="owner-main" style={{ maxWidth: 840, margin: "0 auto", padding: "16px" }}>
        {/* Banner Alert */}
        {bannerMessage && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: "0.92rem",
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

        {/* ========================================================= */}
        {/* TAB 1: ADD / UPLOAD PRODUCT (Mobile Optimized) */}
        {/* ========================================================= */}
        {activeTab === "upload" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: "1.6rem", margin: 0, color: "var(--ink)" }}>➕ Upload Product</h1>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                Add photo, name, category, price and sizes directly from your phone.
              </p>
            </div>

            <form
              onSubmit={handleUploadProduct}
              style={{
                background: "#fff",
                borderRadius: 18,
                border: "1px solid #e0dcd7",
                padding: "20px 16px",
                boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
                display: "grid",
                gap: 20,
              }}
            >
              {/* 1. Category Selector */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 900, fontSize: "0.95rem", color: "var(--ink)" }}>
                    1. Select Category <span style={{ color: "var(--wine)" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={openAddCategoryModal}
                    style={{
                      background: "transparent",
                      border: "1px dashed var(--wine)",
                      color: "var(--wine)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FolderPlus size={14} /> + New
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 10,
                          border: isSelected ? "2px solid var(--wine)" : "1px solid #ddd6ce",
                          background: isSelected ? "#fff0f2" : "#fdfbf8",
                          color: isSelected ? "var(--wine)" : "var(--ink)",
                          fontWeight: isSelected ? 900 : 700,
                          fontSize: "0.88rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected && <Check size={14} />}
                        {cat.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Product Name & Price */}
              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "0.95rem", marginBottom: 6, color: "var(--ink)" }}>
                  2. Product Name (English) <span style={{ color: "var(--wine)" }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cotton Check Shirt, Men's Night Pant"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  style={{ width: "100%", height: 48, padding: "10px 14px", border: "1.5px solid #cbbcab", borderRadius: 12, fontSize: "1rem" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 3, display: "block" }}>
                  Auto-translates to Kannada when customers switch language.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "0.95rem", marginBottom: 6, color: "var(--ink)" }}>
                  3. Price (₹) <span style={{ color: "var(--wine)" }}>*</span>
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
                    style={{
                      width: "100%",
                      height: 48,
                      paddingLeft: 34,
                      paddingRight: 14,
                      border: "1.5px solid #cbbcab",
                      borderRadius: 12,
                      fontSize: "1.1rem",
                      fontWeight: 800,
                    }}
                  />
                </div>
              </div>

              {/* 4. Product Photo Upload (Camera / File) */}
              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "0.95rem", marginBottom: 8, color: "var(--ink)" }}>
                  4. Product Photo
                </label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <label
                    style={{
                      flex: 1,
                      minHeight: 100,
                      border: "2px dashed #cbbcab",
                      borderRadius: 14,
                      background: "#faf7f2",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <Camera size={26} color="var(--wine)" />
                    <span style={{ marginTop: 4, fontWeight: 800, fontSize: "0.9rem", color: "var(--ink)" }}>Take photo or pick image</span>
                    <input type="file" accept="image/*" onChange={handleProductImageChange} style={{ display: "none" }} />
                  </label>

                  {imagePreview ? (
                    <div style={{ position: "relative", width: 100, height: 100, borderRadius: 12, overflow: "hidden", border: "2px solid var(--wine)", flexShrink: 0 }}>
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
                          width: 22,
                          height: 22,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 100, height: 100, borderRadius: 12, border: "1px dashed #d5ccc0", background: "#f7f3ee", display: "grid", placeItems: "center", color: "var(--muted)", flexShrink: 0 }}>
                      <ImageIcon size={28} />
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Sizes and Stock Quantities */}
              <div>
                <label style={{ display: "block", fontWeight: 900, fontSize: "0.95rem", marginBottom: 6, color: "var(--ink)" }}>
                  5. Sizes & Stock Quantity <span style={{ color: "var(--wine)" }}>*</span>
                </label>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 8 }}>
                  Tap sizes you have, then set stock (customers only see available sizes, not numbers):
                </div>

                {/* Standard Sizes */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {STANDARD_SIZES.map((size) => {
                    const active = sizeVariants.some((v) => v.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        style={{
                          minWidth: 44,
                          height: 38,
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

                {/* Pant Waist Sizes */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ fontSize: "0.75rem", alignSelf: "center", color: "var(--muted)", fontWeight: 800 }}>Waist:</span>
                  {PANT_SIZES.map((size) => {
                    const active = sizeVariants.some((v) => v.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        style={{
                          minWidth: 40,
                          height: 34,
                          borderRadius: 7,
                          border: active ? "2px solid var(--wine)" : "1px solid #d5ccc0",
                          background: active ? "var(--wine)" : "#fff",
                          color: active ? "#fff" : "var(--ink)",
                          fontWeight: 900,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Size Input */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <input
                    placeholder="Custom size (e.g. 42, XXL, 30-32)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    style={{ height: 38, padding: "6px 10px", border: "1px solid #cbbcab", borderRadius: 8, fontSize: "0.85rem", flex: 1 }}
                  />
                  <button type="button" onClick={handleAddCustomSize} className="secondary" style={{ minHeight: 38, padding: "6px 12px", fontSize: "0.85rem" }}>
                    + Add Size
                  </button>
                </div>

                {/* Size list with stock counters */}
                {sizeVariants.length > 0 ? (
                  <div style={{ background: "#fbf9f6", border: "1px solid #e5dfd6", borderRadius: 12, padding: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                      {sizeVariants.map((item) => (
                        <div
                          key={item.size}
                          style={{
                            background: "#fff",
                            border: "1px solid #ded6cc",
                            borderRadius: 8,
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <strong style={{ fontSize: "0.9rem", color: "var(--wine)" }}>{item.size}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Qty:</span>
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={(e) => updateSizeStock(item.size, parseInt(e.target.value) || 0)}
                              style={{ width: 50, height: 32, textAlign: "center", border: "1.5px solid #cbbcab", borderRadius: 6, fontWeight: 900 }}
                            />
                            <button
                              type="button"
                              onClick={() => toggleSize(item.size)}
                              style={{ background: "transparent", border: 0, color: "#991b1b", padding: 2 }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "10px", background: "#fef2f2", color: "#991b1b", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700 }}>
                    ⚠️ Please select at least one size.
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="primary"
                style={{
                  minHeight: 52,
                  width: "100%",
                  fontSize: "1.1rem",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Upload size={20} />
                {isSubmitting ? "Uploading Product…" : "Publish Product to Shop"}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRODUCTS LIST (Visual, Mobile Cards, Quick Stock) */}
        {/* ========================================================= */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", margin: 0, color: "var(--ink)" }}>📦 All Products ({products.length})</h1>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                  Adjust stock with + / -, edit details, or hide from shop.
                </p>
              </div>
              <button onClick={() => setActiveTab("upload")} className="primary" style={{ minHeight: 38, padding: "6px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={16} /> Add
              </button>
            </div>

            {catalogLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading products…</div>
            ) : products.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid #eee" }}>
                <h3>No products yet</h3>
                <button onClick={() => setActiveTab("upload")} className="primary" style={{ marginTop: 10 }}>
                  + Upload First Product
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {products.map((product) => {
                  const cat = categories.find((c) => c.id === product.categoryId);
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stockOnHand, 0);

                  return (
                    <div
                      key={product.id}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: product.active ? "1px solid #e0dcd7" : "1.5px dashed #c0b8af",
                        padding: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        opacity: product.active ? 1 : 0.65,
                      }}
                    >
                      {/* Top Row: Photo + Title + Price */}
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ position: "relative", width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: "#f2ece4", flexShrink: 0 }}>
                          <Image src={product.imageUrl} alt={product.nameEn} fill style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 900, background: "#f5eee7", color: "var(--wine)", padding: "2px 6px", borderRadius: 6 }}>
                              {cat?.nameEn ?? "Category"}
                            </span>
                            {!product.active && (
                              <span style={{ fontSize: "0.72rem", fontWeight: 800, background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: 6 }}>
                                Hidden
                              </span>
                            )}
                          </div>
                          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {product.nameEn}
                          </h3>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--wine-dark)", marginTop: 2 }}>
                            {money(product.pricePaise)}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Sizes & Quick Stock Adjusters */}
                      <div style={{ marginTop: 10, background: "#faf7f2", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                          Stock on Hand (Total: {totalStock}):
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {product.variants.map((v) => (
                            <div
                              key={v.id}
                              style={{
                                background: "#fff",
                                border: "1px solid #ddd6cc",
                                borderRadius: 8,
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <strong style={{ fontSize: "0.85rem", color: "var(--wine)" }}>{v.size}</strong>
                              <span style={{ fontSize: "0.85rem", fontWeight: 900 }}>{v.stockOnHand}</span>
                              <div style={{ display: "flex", gap: 2 }}>
                                <button
                                  type="button"
                                  onClick={() => adjustQuickStock(product, v.id, -1)}
                                  style={{ width: 22, height: 22, border: "1px solid #d5ccc0", borderRadius: 4, background: "#f8f5f0", display: "grid", placeItems: "center" }}
                                >
                                  <Minus size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => adjustQuickStock(product, v.id, 1)}
                                  style={{ width: 22, height: 22, border: "1px solid #d5ccc0", borderRadius: 4, background: "#f8f5f0", display: "grid", placeItems: "center" }}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Row: Edit / Hide / Delete Buttons */}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="secondary"
                          style={{ flex: 1, minHeight: 36, padding: "4px 8px", fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProductActive(product)}
                          className="secondary"
                          style={{ minHeight: 36, padding: "4px 10px", fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          {product.active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          className="danger"
                          style={{ minHeight: 36, padding: "4px 10px", fontSize: "0.82rem", display: "grid", placeItems: "center" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CATEGORIES LIST & CRUD */}
        {/* ========================================================= */}
        {activeTab === "categories" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", margin: 0, color: "var(--ink)" }}>📁 Categories ({categories.length})</h1>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                  Clothing categories shown on shop home page (e.g. Shirt, Night pant, Night shirt).
                </p>
              </div>
              <button onClick={openAddCategoryModal} className="primary" style={{ minHeight: 38, padding: "6px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={16} /> Add Category
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e0dcd7",
                      borderRadius: 14,
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", width: 50, height: 50, borderRadius: 10, overflow: "hidden", background: "#f2ece4", flexShrink: 0 }}>
                        <Image src={cat.imageUrl} alt={cat.nameEn} fill style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)" }}>{cat.nameEn}</h4>
                        <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--wine)", marginTop: 2 }}>
                          {count} {count === 1 ? "product" : "products"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(cat)}
                        className="secondary"
                        style={{ minHeight: 34, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="danger"
                        style={{ minHeight: 34, padding: "4px 8px", display: "grid", placeItems: "center" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS QUEUE */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", margin: 0, color: "var(--ink)" }}>📋 Live Orders</h1>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                  {connected ? "● Live orders connected" : "○ Reconnecting..."}
                </p>
              </div>
              <button onClick={refreshOrders} className="secondary" style={{ minHeight: 36, padding: "6px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
                <RefreshCw size={15} /> Reload
              </button>
            </div>

            <section className="metric-grid" style={{ marginBottom: 14 }}>
              <div className="metric"><span>NEW</span><strong>{metrics.placed}</strong></div>
              <div className="metric"><span>PREPARING</span><strong>{metrics.preparing}</strong></div>
              <div className="metric"><span>READY</span><strong>{metrics.ready}</strong></div>
              <div className="metric"><span>TODAY REVENUE</span><strong>{money(metrics.revenue)}</strong></div>
            </section>

            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-title">
                  <h2><Bell size={16} /> Incoming Orders</h2>
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
                        <small>{selectedOrder.customerPhone || "No phone"}</small>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <span className={`status-pill ${selectedOrder.status}`}>{statusLabel[selectedOrder.status].en}</span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: "0.76rem",
                            fontWeight: 900,
                            background: selectedOrder.paymentStatus === "paid" ? "#dcf6e9" : "#fff0cc",
                            color: selectedOrder.paymentStatus === "paid" ? "#09643f" : "#765200",
                          }}
                        >
                          {selectedOrder.paymentStatus === "paid" ? "✓ PAID via UPI" : "₹ PAYMENT DUE"}
                        </span>
                      </div>
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

                    <div className="action-row" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {nextActions[selectedOrder.status].map((status) => (
                        <button
                          key={status}
                          className={status === "cancelled" || status === "expired" ? "danger" : "primary"}
                          onClick={() => handleOrderTransition(status)}
                        >
                          {statusLabel[status].en}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => openEditOrderModal(selectedOrder)}
                        className="secondary"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Edit2 size={16} /> Edit Order
                      </button>
                      {["accepted", "preparing", "ready", "collected"].includes(selectedOrder.status) && (
                        <Link className="secondary" href={`/owner/receipt/${selectedOrder.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Printer size={16} /> Print
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={isDeletingOrder}
                        onClick={() => handleDeleteOrder(selectedOrder)}
                        className="danger"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
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

      {/* ========================================================= */}
      {/* EDIT PRODUCT MODAL / DRAWER */}
      {/* ========================================================= */}
      {editingProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 600,
              maxHeight: "90dvh",
              overflowY: "auto",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Edit Product</h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Product Name (English)</label>
                <input
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10 }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Price (₹)</label>
                  <input
                    required
                    type="number"
                    value={editPriceRupees}
                    onChange={(e) => setEditPriceRupees(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10, fontWeight: 800 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Replace Photo (optional)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {editImagePreview && (
                    <div style={{ position: "relative", width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <Image src={editImagePreview} alt="Preview" fill style={{ objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes and Stock in Edit modal */}
              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 6 }}>Sizes and Stock Quantity</label>
                <div style={{ display: "grid", gap: 8, background: "#fbf9f6", padding: 10, borderRadius: 10 }}>
                  {editVariants.map((v) => (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}>
                      <strong>Size {v.size}</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditVariants(editVariants.map((item) => (item.id === v.id ? { ...item, stock: val } : item)));
                          }}
                          style={{ width: 60, height: 32, textAlign: "center", border: "1.5px solid #cbbcab", borderRadius: 6, fontWeight: 900 }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditVariants(editVariants.filter((item) => item.id !== v.id))}
                          style={{ background: "transparent", border: 0, color: "#991b1b", padding: 2 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add size inside edit modal */}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <input
                      placeholder="Add another size (e.g. XXL, 38)"
                      value={editCustomSize}
                      onChange={(e) => setEditCustomSize(e.target.value)}
                      style={{ height: 34, padding: "4px 8px", border: "1px solid #cbbcab", borderRadius: 6, fontSize: "0.85rem", flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = editCustomSize.trim();
                        if (trimmed && !editVariants.some((v) => v.size.toLowerCase() === trimmed.toLowerCase())) {
                          setEditVariants([...editVariants, { id: crypto.randomUUID(), size: trimmed, stock: 10, colorEn: "Standard" }]);
                          setEditCustomSize("");
                        }
                      }}
                      className="secondary"
                      style={{ minHeight: 34, padding: "4px 10px", fontSize: "0.82rem" }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="submit" disabled={isSavingEdit} className="primary" style={{ flex: 1, minHeight: 46 }}>
                  {isSavingEdit ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingProduct(null)} className="secondary" style={{ minHeight: 46, padding: "8px 16px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT CATEGORY MODAL */}
      {/* ========================================================= */}
      {showAddCategory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 440,
              borderRadius: 18,
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{editingCategory ? "Edit Category" : "Add Category"}</h2>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.88rem", marginBottom: 4 }}>
                  Category Name (English) *
                </label>
                <input
                  required
                  placeholder="e.g. Shirt, Night pant, Night shirt, Dhoti"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10, fontSize: "0.95rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.88rem", marginBottom: 4 }}>
                  Category Photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCatImageFile(file);
                      setCatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {catImagePreview && (
                  <div style={{ position: "relative", width: 44, height: 44, borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                    <Image src={catImagePreview} alt="Preview" fill style={{ objectFit: "cover" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="primary" style={{ flex: 1, minHeight: 44 }}>
                  Save Category
                </button>
                <button type="button" onClick={() => setShowAddCategory(false)} className="secondary" style={{ minHeight: 44, padding: "8px 14px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT ORDER MODAL / DRAWER */}
      {/* ========================================================= */}
      {editingOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 580,
              maxHeight: "90dvh",
              overflowY: "auto",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 16px",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span className="eyebrow">EDIT ORDER</span>
                <h2 style={{ margin: "2px 0 0", fontSize: "1.3rem" }}>Token {editingOrder.token}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>
                  Customer Name
                </label>
                <input
                  required
                  value={editOrderName}
                  onChange={(e) => setEditOrderName(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Optional phone number"
                  value={editOrderPhone}
                  onChange={(e) => setEditOrderPhone(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "8px 12px", border: "1.5px solid #cbbcab", borderRadius: 10 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 800, fontSize: "0.9rem", marginBottom: 6 }}>
                  Order Items & Quantities
                </label>
                <div style={{ display: "grid", gap: 8, background: "#fbf9f6", padding: 12, borderRadius: 12 }}>
                  {editOrderItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#fff",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.92rem", color: "var(--ink)", display: "block" }}>{item.productNameEn}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--wine)", fontWeight: 800 }}>
                          Size: {item.size} · ₹{(item.unitPricePaise / 100).toFixed(0)} each
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() =>
                              setEditOrderItems(
                                editOrderItems.map((i) => (i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)),
                              )
                            }
                            style={{ width: 28, height: 28, border: "1px solid #cbbcab", borderRadius: 6, background: "#f8f5f0", display: "grid", placeItems: "center" }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ minWidth: 24, textAlign: "center", fontWeight: 900 }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditOrderItems(
                                editOrderItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
                              )
                            }
                            style={{ width: 28, height: 28, border: "1px solid #cbbcab", borderRadius: 6, background: "#f8f5f0", display: "grid", placeItems: "center" }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditOrderItems(editOrderItems.filter((i) => i.id !== item.id))}
                          style={{ background: "transparent", border: 0, color: "#991b1b", padding: 4, cursor: "pointer" }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px dashed #ccc", fontWeight: 900 }}>
                    <span>Recalculated Total:</span>
                    <span style={{ color: "var(--wine)", fontSize: "1.1rem" }}>
                      ₹{(editOrderItems.reduce((sum, i) => sum + i.quantity * i.unitPricePaise, 0) / 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" disabled={isSavingOrderEdit} className="primary" style={{ flex: 1, minHeight: 46 }}>
                  {isSavingOrderEdit ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingOrder(null)} className="secondary" style={{ minHeight: 46, padding: "8px 16px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky, Thumb-Friendly) */}
      {/* ========================================================= */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #ded9d4",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          padding: "6px 6px calc(10px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          style={{
            background: "transparent",
            border: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "6px 4px",
            color: activeTab === "upload" ? "var(--wine)" : "#746b64",
            fontWeight: activeTab === "upload" ? 900 : 700,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 32,
              borderRadius: 10,
              background: activeTab === "upload" ? "#fce8eb" : "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Plus size={22} strokeWidth={activeTab === "upload" ? 3 : 2} />
          </div>
          <span>Add</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          style={{
            background: "transparent",
            border: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "6px 4px",
            color: activeTab === "products" ? "var(--wine)" : "#746b64",
            fontWeight: activeTab === "products" ? 900 : 700,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 32,
              borderRadius: 10,
              background: activeTab === "products" ? "#fce8eb" : "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Package size={20} strokeWidth={activeTab === "products" ? 2.5 : 2} />
          </div>
          <span>Products</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          style={{
            background: "transparent",
            border: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "6px 4px",
            color: activeTab === "categories" ? "var(--wine)" : "#746b64",
            fontWeight: activeTab === "categories" ? 900 : 700,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 32,
              borderRadius: 10,
              background: activeTab === "categories" ? "#fce8eb" : "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Layers size={20} strokeWidth={activeTab === "categories" ? 2.5 : 2} />
          </div>
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          style={{
            background: "transparent",
            border: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "6px 4px",
            color: activeTab === "orders" ? "var(--wine)" : "#746b64",
            fontWeight: activeTab === "orders" ? 900 : 700,
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 32,
              borderRadius: 10,
              background: activeTab === "orders" ? "#fce8eb" : "transparent",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Bell size={20} strokeWidth={activeTab === "orders" ? 2.5 : 2} />
          </div>
          <span>Orders</span>
        </button>
      </div>
    </div>
  );
}
