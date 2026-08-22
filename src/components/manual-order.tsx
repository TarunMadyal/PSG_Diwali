"use client";
import { FormEvent,useEffect,useState } from "react";
import { demoProducts,isDemoMode } from "@/lib/demo-data";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { OwnerHeader } from "./owner-header";

export function ManualOrder(){
  const [products,setProducts]=useState<Product[]>(demoProducts);
  const [name,setName]=useState("");const [phone,setPhone]=useState("");const [variantId,setVariantId]=useState(demoProducts[0]?.variants[0]?.id??"");const [quantity,setQuantity]=useState(1);const [result,setResult]=useState("");
  useEffect(()=>{if(isDemoMode())return;fetch("/api/catalog").then((r)=>r.json()).then((data:{products:Product[]})=>{setProducts(data.products);setVariantId(data.products[0]?.variants[0]?.id??"");});},[]);
  const available=products.flatMap((p)=>p.variants.filter((v)=>v.active&&v.stockOnHand>v.reservedQuantity).map((v)=>({p,v})));
  const choice=available.find(({v})=>v.id===variantId);
  async function submit(event:FormEvent){
    event.preventDefault();if(!choice)return;
    if(isDemoMode()){
      const stored=JSON.parse(localStorage.getItem("psg-demo-orders")??"[]") as unknown[];const token=`A${String(stored.length+15).padStart(3,"0")}`;
      const order={id:crypto.randomUUID(),token,trackingKey:crypto.randomUUID(),customerName:name,customerPhone:phone||undefined,status:"placed",source:"staff",totalPaise:choice.p.pricePaise*quantity,paymentStatus:"due",placedAt:new Date().toISOString(),items:[{id:crypto.randomUUID(),productNameEn:choice.p.nameEn,productNameKn:choice.p.nameKn,size:choice.v.size,colorEn:choice.v.colorEn,colorKn:choice.v.colorKn,quantity,unitPricePaise:choice.p.pricePaise,lineTotalPaise:choice.p.pricePaise*quantity}]};
      localStorage.setItem("psg-demo-orders",JSON.stringify([order,...stored]));setResult(`Created ${token}`);return;
    }
    const response=await fetch("/api/owner/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({customerName:name,customerPhone:phone||null,idempotencyKey:crypto.randomUUID(),items:[{variantId,quantity}]})});const data=await response.json();setResult(response.ok?`Created ${data.token}`:data.error);
  }
  return <div className="owner-shell"><OwnerHeader/><main className="owner-main"><div className="owner-heading"><div><h1>Manual shop order</h1><p>For customers without a smartphone · uses the same reservation and token transaction</p></div></div><form className="panel" style={{maxWidth:720}} onSubmit={submit}><label className="field">Customer short name<input required minLength={2} value={name} onChange={(e)=>setName(e.target.value)}/></label><label className="field">Phone (optional)<input value={phone} onChange={(e)=>setPhone(e.target.value)}/></label><label className="field">Product, size and colour<select value={variantId} onChange={(e)=>setVariantId(e.target.value)}>{available.map(({p,v})=><option key={v.id} value={v.id}>{p.nameEn} · {v.size} · {v.colorEn} · {money(p.pricePaise)} ({v.stockOnHand-v.reservedQuantity} available)</option>)}</select></label><label className="field">Quantity<input type="number" min="1" max={choice?choice.v.stockOnHand-choice.v.reservedQuantity:1} value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))}/></label>{choice&&<div className="summary"><div className="summary-row"><span>Total due</span><span>{money(choice.p.pricePaise*quantity)}</span></div></div>}{result&&<p className="notice">{result}</p>}<button className="primary">Reserve stock & create token</button></form></main></div>;
}
