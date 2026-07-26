import { HomepageRenderer } from "@/components/homepage/HomepageRenderer";
import { getHomepageExperienceData } from "@/services/homepageExperienceService";

export const revalidate = 60;

export default async function HomePage(): Promise<React.JSX.Element> {
  const experience = await getHomepageExperienceData();

  return (
    <main>
      <HomepageRenderer experience={experience} />
    </main>
  );
}
