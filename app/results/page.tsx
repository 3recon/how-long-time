import { RecommendResultsPage } from "@/components/recommend/recommend-results-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ResultsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  return <RecommendResultsPage searchParams={searchParams} />;
}
