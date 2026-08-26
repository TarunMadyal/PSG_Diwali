"use client";
import { ChangeEvent,useEffect,useState } from "react";
import { demoCategories,demoProducts,isDemoMode } from "@/lib/demo-data";
import type { Category,Product,Variant } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { OwnerHeader } from "./owner-header";

export function CatalogManager(){
  const [categories,setCategories]=useState<Category[]>(demoCategories);
  const [products,setProducts]=useState<Product[]>(demoProducts);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    if(isDemoMode())return;
    const supabase=createBrowserSupabase();
    void Promise.all([supabase.from("categories").select("*").order("sort_order"),supabase.from("products").select("*,product_variants(*)").order("sort_order")]).then(([c,p])=>{
      const visibleCategories=(c.data??[]).filter((x)=>x.active).map((x)=>({id:x.id,slug:x.slug,nameEn:x.name_en,nameKn:x.name_kn,imageUrl:x.image_path??"/demo/category-1.svg",sortOrder:x.sort_order,active:x.active}));
      const categoryIds=new Set(visibleCategories.map((category)=>category.id));
      setCategories(visibleCategories);
      if(p.data)setProducts(p.data.filter((x)=>categoryIds.has(x.category_id)).map((x)=>({id:x.id,categoryId:x.category_id,nameEn:x.name_en,nameKn:x.name_kn,pricePaise:x.price_paise,imageUrl:x.image_path??"/demo/product-1.svg",sortOrder:x.sort_order,active:x.active,variants:x.product_variants.map((v:{id:string;product_id:string;size:string;color_en:string;color_kn:string;stock_on_hand:number;reserved_quantity:number;low_stock_threshold:number;active:boolean})=>({id:v.id,productId:v.product_id,size:v.size,colorEn:v.color_en,colorKn:v.color_kn,stockOnHand:v.stock_on_hand,reservedQuantity:v.reserved_quantity,lowStockThreshold:v.low_stock_threshold,active:v.active}))})));
    });
  },[]);

  async function saveCategories(){
    setMessage("Saving categories…");
    if(!isDemoMode()){
      const {error}=await createBrowserSupabase().from("categories").upsert(categories.map((c,i)=>({id:c.id,slug:c.slug,name_en:c.nameEn,name_kn:c.nameKn,image_path:c.imageUrl,sort_order:i*10,active:c.active})));
      if(error){setMessage(error.message);return;}
    }
    setMessage(isDemoMode()?"Demo changes remain in this view":"Categories saved");
  }

  async function saveProduct(product:Product){
    setMessage("Saving product…");
    if(!isDemoMode()){
      const supabase=createBrowserSupabase();
      const {error}=await supabase.from("products").upsert({id:product.id,category_id:product.categoryId,name_en:product.nameEn,name_kn:product.nameKn,price_paise:product.pricePaise,active:product.active,sort_order:product.sortOrder,image_path:product.imageUrl});
      if(error){setMessage(error.message);return;}
      for(const v of product.variants){
        const {error:variantError}=await supabase.from("product_variants").upsert({id:v.id,product_id:product.id,size:v.size,color_en:v.colorEn,color_kn:v.colorKn,stock_on_hand:v.stockOnHand,reserved_quantity:v.reservedQuantity,low_stock_threshold:v.lowStockThreshold,active:v.active});
        if(variantError){setMessage(variantError.message);return;}
      }
    }
    setMessage(isDemoMode()?"Demo changes remain in this view":"Product and variants saved");
  }

  async function upload(product:Product,event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file)return;
    if(isDemoMode()){setMessage("Uploads require a connected Supabase project.");return;}
    const supabase=createBrowserSupabase();
    const path=`products/${product.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g,"-")}`;
    const {error}=await supabase.storage.from("catalog").upload(path,file,{upsert:false});
    if(error){setMessage(error.message);return;}
    const {data}=supabase.storage.from("catalog").getPublicUrl(path);
    const updated={...product,imageUrl:data.publicUrl};
    setProducts((items)=>items.map((p)=>p.id===product.id?updated:p));
    await saveProduct(updated);
  }

  async function uploadCategory(category:Category,event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file)return;
    if(isDemoMode()){setMessage("Uploads require a connected Supabase project.");return;}
    const supabase=createBrowserSupabase();
    const path=`categories/${category.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g,"-")}`;
    const {error}=await supabase.storage.from("catalog").upload(path,file,{upsert:false});
    if(error){setMessage(error.message);return;}
    const {data}=supabase.storage.from("catalog").getPublicUrl(path);
    setCategories((all)=>all.map((c)=>c.id===category.id?{...c,imageUrl:data.publicUrl}:c));
    const {error:saveError}=await supabase.from("categories").upsert({id:category.id,slug:category.slug,name_en:category.nameEn,name_kn:category.nameKn,image_path:data.publicUrl,sort_order:category.sortOrder,active:category.active});
    setMessage(saveError?.message??"Category image saved");
  }

  function patchProduct(id:string,patch:Partial<Product>){setProducts((items)=>items.map((p)=>p.id===id?{...p,...patch}:p));}
  function addVariant(product:Product){
    const variant:Variant={id:crypto.randomUUID(),productId:product.id,size:"M",colorEn:"New colour",colorKn:"ಹೊಸ ಬಣ್ಣ",stockOnHand:0,reservedQuantity:0,lowStockThreshold:2,active:false};
    patchProduct(product.id,{variants:[...product.variants,variant]});
  }

  return <div className="owner-shell"><OwnerHeader/><main className="owner-main">
    <div className="owner-heading"><div><h1>Men’s catalog & inventory</h1><p>Photo, bilingual names, displayed price, sizes and exact stock</p></div><button className="primary" onClick={()=>{const c=categories[0];if(!c){setMessage("Add a men’s category first.");return;}const id=crypto.randomUUID();setProducts((all)=>[...all,{id,categoryId:c.id,nameEn:"New product",nameKn:"ಹೊಸ ಉತ್ಪನ್ನ",pricePaise:0,imageUrl:"/demo/product-1.svg",sortOrder:all.length*10,active:false,variants:[]}]);}}>+ Add product</button></div>
    {message&&<p className="notice">{message}</p>}
    <section className="panel"><div className="panel-title"><h2>Categories</h2><div><button className="secondary" onClick={()=>{const id=crypto.randomUUID();setCategories((all)=>[...all,{id,slug:`category-${all.length+1}`,nameEn:"New category",nameKn:"ಹೊಸ ವರ್ಗ",imageUrl:"/demo/category-1.svg",sortOrder:all.length*10,active:false}]);}}>+ Add category</button> <button className="primary" onClick={()=>void saveCategories()}>Save categories</button></div></div>
      <table className="admin-table"><thead><tr><th>Order</th><th>English</th><th>ಕನ್ನಡ</th><th>Image</th><th>Visible</th></tr></thead><tbody>{categories.map((c,i)=><tr key={c.id}><td><button className="secondary" onClick={()=>setCategories((all)=>{const next=[...all];if(i>0)[next[i-1],next[i]]=[next[i],next[i-1]];return next;})}>↑</button> {i+1}</td><td><input value={c.nameEn} onChange={(e)=>setCategories((all)=>all.map((x)=>x.id===c.id?{...x,nameEn:e.target.value}:x))}/></td><td><input value={c.nameKn} onChange={(e)=>setCategories((all)=>all.map((x)=>x.id===c.id?{...x,nameKn:e.target.value}:x))}/></td><td><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>void uploadCategory(c,e)}/></td><td><input type="checkbox" checked={c.active} onChange={(e)=>setCategories((all)=>all.map((x)=>x.id===c.id?{...x,active:e.target.checked}:x))}/></td></tr>)}</tbody></table>
    </section>
    <section className="panel" style={{marginTop:18}}><div className="panel-title"><h2>Products and variants</h2></div>{products.map((p)=><details key={p.id} style={{borderBottom:"1px solid var(--line)",padding:"12px 0"}}><summary style={{cursor:"pointer",fontWeight:900}}>{p.nameEn} · ₹{p.pricePaise/100} {p.active?"":"(archived)"}</summary>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}><label className="field">English<input value={p.nameEn} onChange={(e)=>patchProduct(p.id,{nameEn:e.target.value})}/></label><label className="field">ಕನ್ನಡ<input value={p.nameKn} onChange={(e)=>patchProduct(p.id,{nameKn:e.target.value})}/></label><label className="field">Price ₹<input type="number" min="0" value={p.pricePaise/100} onChange={(e)=>patchProduct(p.id,{pricePaise:Number(e.target.value)*100})}/></label><label className="field">Category<select value={p.categoryId} onChange={(e)=>patchProduct(p.id,{categoryId:e.target.value})}>{categories.map((c)=><option key={c.id} value={c.id}>{c.nameEn}</option>)}</select></label><label className="field">Replace image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>void upload(p,e)}/></label><label className="field">Customer visible<input type="checkbox" checked={p.active} onChange={(e)=>patchProduct(p.id,{active:e.target.checked})}/></label></div>
      <table className="admin-table"><thead><tr><th>Size</th><th>Colour</th><th>ಕನ್ನಡ ಬಣ್ಣ</th><th>On hand</th><th>Reserved</th><th>Low alert</th><th>Active</th></tr></thead><tbody>{p.variants.map((v)=><tr key={v.id}><td><input value={v.size} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,size:e.target.value}:x)})}/></td><td><input value={v.colorEn} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,colorEn:e.target.value}:x)})}/></td><td><input value={v.colorKn} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,colorKn:e.target.value}:x)})}/></td><td><input type="number" min={v.reservedQuantity} value={v.stockOnHand} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,stockOnHand:Number(e.target.value)}:x)})}/></td><td>{v.reservedQuantity}</td><td><input type="number" min="0" value={v.lowStockThreshold} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,lowStockThreshold:Number(e.target.value)}:x)})}/></td><td><input type="checkbox" checked={v.active} onChange={(e)=>patchProduct(p.id,{variants:p.variants.map((x)=>x.id===v.id?{...x,active:e.target.checked}:x)})}/></td></tr>)}</tbody></table>
      <div className="action-row"><button className="primary" onClick={()=>void saveProduct(p)}>Save product</button><button className="secondary" onClick={()=>addVariant(p)}>+ Add variant</button><button className="secondary" onClick={()=>patchProduct(p.id,{active:!p.active})}>{p.active?"Archive":"Restore"}</button></div>
    </details>)}</section>
  </main></div>;
}
