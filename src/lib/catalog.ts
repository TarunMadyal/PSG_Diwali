import { createClient } from "@supabase/supabase-js";
import { demoCategories,demoProducts,isDemoMode } from "./demo-data";
import type { Category,Product } from "./types";

export async function getCatalog():Promise<{categories:Category[];products:Product[]}>{
  if(isDemoMode())return {categories:demoCategories,products:demoProducts};
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
  const [categoryResult,productResult]=await Promise.all([supabase.from("categories").select("*").order("sort_order"),supabase.from("products").select("*,product_variants(*)").order("sort_order")]);
  if(categoryResult.error||productResult.error)throw new Error(categoryResult.error?.message??productResult.error?.message??"Catalog unavailable");
  const categories:Category[]=(categoryResult.data??[]).map((x)=>({id:x.id,slug:x.slug,nameEn:x.name_en,nameKn:x.name_kn,imageUrl:x.image_path??"/demo/category-1.svg",sortOrder:x.sort_order,active:x.active}));
  const products:Product[]=(productResult.data??[]).map((x)=>({id:x.id,categoryId:x.category_id,nameEn:x.name_en,nameKn:x.name_kn,pricePaise:x.price_paise,imageUrl:x.image_path??"/demo/product-1.svg",sortOrder:x.sort_order,active:x.active,variants:x.product_variants.map((v:{id:string;product_id:string;size:string;color_en:string;color_kn:string;stock_on_hand:number;reserved_quantity:number;low_stock_threshold:number;active:boolean})=>({id:v.id,productId:v.product_id,size:v.size,colorEn:v.color_en,colorKn:v.color_kn,stockOnHand:v.stock_on_hand,reservedQuantity:v.reserved_quantity,lowStockThreshold:v.low_stock_threshold,active:v.active}))}));
  return {categories,products};
}
