import sampleRecommendation from "@/data/demo/recommendation-sample.json";
import { appConfig } from "@/lib/env";

export default function Home() {
  const topOffice = sampleRecommendation.recommendations[0];

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              Minwon Now
            </p>
            <h1 className="text-lg font-semibold">{appConfig.appName}</h1>
          </div>
          <div className="rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
            {appConfig.enableDemoMode ? "demo 모드 지원" : "live 모드 전용"}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="soft-card relative overflow-hidden rounded-[2rem] px-7 py-8 sm:px-10 sm:py-10">
            <div
              className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgba(255,204,51,0.26)] blur-2xl"
              aria-hidden
            />
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              1단계 부트스트랩 완료
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              대기 인원과 이동 시간을 함께 비교하는
              <span className="block text-[var(--accent-strong)]">
                민원실 추천 서비스의 출발점
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              Next.js App Router 기반 프로젝트를 올리고, 이후 단계에서 바로
              추천 API와 demo 모드를 붙일 수 있도록 공통 타입과 샘플 데이터를
              먼저 정리했습니다.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-4">
                <p className="text-sm text-[var(--muted)]">현재 백엔드 후보</p>
                <p className="mt-2 break-all font-semibold">{appConfig.apiBaseUrl}</p>
              </article>
              <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-4">
                <p className="text-sm text-[var(--muted)]">기본 모드</p>
                <p className="mt-2 font-semibold">{sampleRecommendation.meta.mode}</p>
              </article>
              <article className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-4">
                <p className="text-sm text-[var(--muted)]">샘플 추천 1위</p>
                <p className="mt-2 font-semibold">{topOffice.name}</p>
              </article>
            </div>
          </section>

          <aside className="soft-card rounded-[2rem] px-6 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              다음 연결 지점
            </p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <li className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                추천 API 요청/응답 타입을 이미 정의해 2단계 계약 고정 작업으로
                바로 이어질 수 있습니다.
              </li>
              <li className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                `data/demo` 경로에 샘플 추천 JSON을 배치해 demo 모드 설계 기준을
                마련했습니다.
              </li>
              <li className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                환경변수는 브라우저 공개용과 서버 전용을 분리한 `.env.example`
                기준으로 정리했습니다.
              </li>
            </ul>
          </aside>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="soft-card rounded-[2rem] px-6 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              샘플 추천 결과
            </p>
            <div className="mt-5 rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{topOffice.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    처리 가능 업무:{" "}
                    {topOffice.supportedTaskMatches
                      .map((task) => task.taskName)
                      .join(", ")}
                  </p>
                </div>
                <div className="rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold">
                  score {topOffice.recommendation.score}
                </div>
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-[var(--muted)]">대기 인원</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {topOffice.waiting.count}명
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)]">예상 이동시간</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {topOffice.travel.minutes}분
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)]">추천 순위</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {topOffice.recommendation.rank}위
                  </dd>
                </div>
              </dl>
            </div>
          </article>

          <article className="soft-card rounded-[2rem] px-6 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              프로젝트 구조
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["app/", "라우팅과 화면 엔트리"],
                ["components/", "재사용 UI 조각"],
                ["lib/", "환경설정과 공용 유틸"],
                ["types/", "추천 API 계약과 도메인 타입"],
                ["data/demo/", "심사용 고정 샘플 데이터"],
                [".env.example", "배포/로컬 환경변수 기준"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-[1.35rem] border border-[var(--line)] bg-white/80 p-4"
                >
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
