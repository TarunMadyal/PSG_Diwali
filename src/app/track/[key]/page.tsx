import { TrackingPage } from "@/components/tracking-page";
export default async function Page({ params }: { params: Promise<{ key: string }> }) { const { key } = await params; return <TrackingPage trackingKey={key} />; }
