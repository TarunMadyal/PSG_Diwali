import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
const schema=z.object({status:z.enum(["accepted","preparing","ready","collected","cancelled","expired"])});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const {status}=schema.parse(await request.json());const supabase=await createServerSupabase();const {data,error}=await supabase.rpc("update_order_status",{p_order_id:id,p_status:status});if(error)return NextResponse.json({error:error.message},{status:409});return NextResponse.json(data);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid request"},{status:400});}}
