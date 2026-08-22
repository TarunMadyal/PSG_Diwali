import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
export async function GET(){try{return NextResponse.json(await getCatalog(),{headers:{"cache-control":"public, s-maxage=60, stale-while-revalidate=300"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Catalog unavailable"},{status:503});}}
