import AboutSectionRenderer from "../components/cms/AboutSections";
import { PageEmpty, PageError, PageLoading } from "../components/cms/PageState";
import { fetchAboutPage } from "../lib/api";
import { usePageContent } from "../lib/usePageContent";
import { usePageMeta } from "../lib/usePageTitle";

function About() {
  usePageMeta({
    page: "about",
    fallbackTitle: "About",
    fallbackDescription:
      "Learn about our mission to make music accessible to everyone in Pampanga. Free lessons, free instruments, free concerts.",
  });

  const { data, loading, error, reload } = usePageContent(fetchAboutPage);

  if (loading && !data) {
    return <PageLoading label="Loading the band's story…" />;
  }

  if (error && !data) {
    return (
      <PageError
        title="We couldn't open the band's story"
        message="The about page could not reach the content server. Please try again."
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  if (data.sections.length === 0) {
    return (
      <PageEmpty
        title="The band's story is being written"
        message="Our about page is being updated. Please check back soon."
      />
    );
  }

  return <AboutSectionRenderer content={data} />;
}

export default About;
