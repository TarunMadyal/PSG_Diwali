import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/product-browser";
import { getCatalog } from "@/lib/catalog";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const {categories,products}=await getCatalog();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return <ProductBrowser category={category} products={products.filter((item) => item.categoryId === category.id)} />;
}
