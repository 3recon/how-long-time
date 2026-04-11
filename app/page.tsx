import { RecommendRequestPage } from "@/components/recommend/recommend-request-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Home(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  return <RecommendRequestPage searchParams={searchParams} />;
}
