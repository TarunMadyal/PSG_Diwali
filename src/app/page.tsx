import { CategoryHome } from "@/components/category-home";
import { getCatalog } from "@/lib/catalog";
export const revalidate=60;
export default async function HomePage() { const {categories}=await getCatalog(); return <CategoryHome categories={categories} />; }
