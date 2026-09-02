import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categorySlug, product: productId } = await params;
  const { categories, products } = await getCatalog();

  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  const product = products.find((p) => p.id === productId && p.categoryId === category.id);
  if (!product) notFound();

  return <ProductDetail category={category} product={product} />;
}
