import { HomepageRenderer } from "@/components/homepage/HomepageRenderer";
import { getHomepageDocument } from "@/services/publicDiscoveryService";

export const revalidate = 60;

export default async function HomePage(): Promise<React.JSX.Element> {
  const document = await getHomepageDocument();
  return <main><HomepageRenderer document={document} /></main>;
}
