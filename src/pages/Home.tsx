import HomeSectionRenderer from "../components/cms/HomeSections";
import { PageEmpty, PageError, PageLoading } from "../components/cms/PageState";
import { fetchHomePage } from "../lib/api";
import { usePageContent } from "../lib/usePageContent";
import { usePageMeta } from "../lib/usePageTitle";

function Home() {
  usePageMeta({
    page: "home",
    fallbackTitle: "Music that belongs to everyone",
    fallbackDescription:
      "Free to learn, free to listen, free to join. A volunteer band making room for more music in our community.",
  });

  const { data, loading, error, reload } = usePageContent(fetchHomePage);

  if (loading && !data) {
    return <PageLoading label="Tuning up the home page…" />;
  }

  if (error && !data) {
    return (
      <PageError
        title="The bandstand is quiet for a moment"
        message="We couldn't reach the band's content server. Check your connection and try again."
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  if (data.sections.length === 0) {
    return (
      <PageEmpty
        title="The bandstand is being prepared"
        message="New stories, concerts, and programme details are on their way."
      />
    );
  }

  return <HomeSectionRenderer content={data} />;
}

export default Home;
