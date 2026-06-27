import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { ArchitectureDiagram } from "./components/Diagram";
import { architectures, architecturesByCategory, findArchitecture } from "./data/architectures";
import type { Architecture, ArchitectureCategory, QualityAttribute, RelatedArchitecture } from "./types";
import "./styles.css";

type Route =
  | { view: "home" }
  | { view: "category"; category: ArchitectureCategory }
  | { view: "architecture"; category: ArchitectureCategory; id: string };

const categoryLabel: Record<ArchitectureCategory, string> = {
  software: "ソフトウェアアーキテクチャ",
  system: "システムアーキテクチャ",
};

const categoryShortLabel: Record<ArchitectureCategory, string> = {
  software: "Software",
  system: "System",
};

const qualityLabel: Record<QualityAttribute, string> = {
  availability: "可用性",
  changeability: "変更容易性",
  "cost-predictability": "コスト予測性",
  "data-consistency": "データ整合性",
  "fault-isolation": "障害隔離",
  "independent-deployability": "独立デプロイ",
  "independent-scalability": "独立スケール",
  "learning-cost": "学習コスト",
  observability: "観測性",
  "operational-simplicity": "運用単純性",
  performance: "性能",
  "security-boundary": "セキュリティ境界",
  "team-scalability": "チーム拡張性",
  testability: "テスト容易性",
};

const commonReadingPoints = [
  "境界は runtime の話か、code dependency の話か。",
  "通常時に要求、依存、データ、イベントのどれが流れるか。",
  "利用急増時に増やせる単位と詰まる単位はどこか。",
  "変更時に影響を止める契約は何か。",
  "障害時に伝播する経路と隔離される範囲はどこか。",
  "整合性、観測、テスト、運用負荷がどこへ移るか。",
];

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw) return { view: "home" };
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "system" || parts[0] === "software") {
    if (parts[1]) return { view: "architecture", category: parts[0], id: parts[1] };
    return { view: "category", category: parts[0] };
  }
  return { view: "home" };
}

function hrefFor(architecture: Architecture): string {
  return `#/${architecture.category}/${architecture.id}`;
}

function levelValue(level: "low" | "medium" | "high"): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function oppositeCategory(category: ArchitectureCategory): ArchitectureCategory {
  return category === "system" ? "software" : "system";
}

function App(): ReactElement {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const update = () => setRoute(parseHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const content = useMemo(() => {
    if (route.view === "category") return <CategoryPage category={route.category} />;
    if (route.view === "architecture") {
      const architecture = findArchitecture(route.id);
      if (!architecture || architecture.category !== route.category) return <NotFound />;
      return <ArchitecturePage architecture={architecture} />;
    }
    return <HomePage />;
  }, [route]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#/" className="brand" aria-label="Architecture Motion Atlas home">
          <span className="brand-mark">A</span>
          <span>Architecture Motion Atlas</span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#/system">System</a>
          <a href="#/software">Software</a>
          <a href="#/system/microservices">Microservices</a>
          <a href="#/software/hexagonal">Hexagonal</a>
        </nav>
      </header>
      <main>{content}</main>
    </div>
  );
}

function HomePage(): ReactElement {
  const system = architecturesByCategory("system");
  const software = architecturesByCategory("software");

  return (
    <div className="page">
      <section className="overview-band">
        <div>
          <p className="eyebrow">動く図で読む設計スタイル</p>
          <h1>システム構成とコード構造を同じ地図で比較する</h1>
          <p className="lead">
            各スタイルを通常時、強く効くケース、弱いケースの3図で見ます。図の端点はノードのアンカーに合わせ、流れがどこから始まりどこへ着くかを確認できます。
          </p>
        </div>
        <div className="stat-grid" aria-label="Content summary">
          <Metric value={architectures.length.toString()} label="styles" />
          <Metric value={(architectures.length * 3).toString()} label="scenario diagrams" />
          <Metric value="2" label="architecture scopes" />
        </div>
      </section>

      <section className="split-index">
        <ArchitectureIndex title={categoryLabel.system} category="system" items={system} />
        <ArchitectureIndex title={categoryLabel.software} category="software" items={software} />
      </section>

      <section className="reading-points">
        <div>
          <p className="eyebrow">共通して見ること</p>
          <h2>同じ問いで比較する</h2>
        </div>
        <ol>
          {commonReadingPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CategoryPage({ category }: { category: ArchitectureCategory }): ReactElement {
  const items = architecturesByCategory(category);

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">{categoryShortLabel[category]}</p>
        <h1>{categoryLabel[category]}</h1>
        <p className="lead">
          {category === "system"
            ? "配置、実行時境界、通信、スケール、障害隔離を中心に見ます。各ページには相性の良いソフトウェアアーキテクチャを示します。"
            : "依存方向、コード境界、テスト容易性、変更容易性を中心に見ます。各ページには相性の良いシステムアーキテクチャを示します。"}
        </p>
      </header>

      <div className="architecture-list">
        {items.map((architecture) => (
          <a key={architecture.id} href={hrefFor(architecture)} className="architecture-card">
            <span className="card-kicker">{architecture.id}</span>
            <strong>{architecture.title}</strong>
            <span>{architecture.summary}</span>
            <span className="card-row">
              <span>強い: {architecture.appliesWhen[0]}</span>
              <span>弱い: {architecture.weakWhen[0]}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ArchitecturePage({ architecture }: { architecture: Architecture }): ReactElement {
  const related = architecture.relatedArchitectures
    .map((relation) => ({ relation, target: findArchitecture(relation.architectureId) }))
    .filter((item): item is { relation: RelatedArchitecture; target: Architecture } => Boolean(item.target));
  const peerItems = architecturesByCategory(architecture.category);
  const currentIndex = peerItems.findIndex((item) => item.id === architecture.id);
  const previous = peerItems[(currentIndex - 1 + peerItems.length) % peerItems.length];
  const next = peerItems[(currentIndex + 1) % peerItems.length];
  const opposite = oppositeCategory(architecture.category);

  return (
    <div className="page architecture-page">
      <header className="architecture-heading">
        <div>
          <p className="eyebrow">{categoryLabel[architecture.category]}</p>
          <h1>{architecture.title}</h1>
          <p className="lead">{architecture.summary}</p>
        </div>
        <div className="heading-actions">
          <a href={`#/${architecture.category}`}>一覧へ</a>
          <a href={hrefFor(previous)}>前へ</a>
          <a href={hrefFor(next)}>次へ</a>
        </div>
      </header>

      <section className="essence-band">
        <div>
          <span className="section-label">Essence</span>
          <p>{architecture.essence}</p>
        </div>
        <div>
          <span className="section-label">Primary question</span>
          <p>{architecture.primaryQuestion}</p>
        </div>
        <div>
          <span className="section-label">Not this</span>
          <ul className="plain-list">
            {architecture.notThis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="scenario-stack">
        <div className="section-head">
          <p className="eyebrow">Motion diagrams</p>
          <h2>通常時、強く効くケース、弱いケース</h2>
        </div>
        {architecture.diagram.scenarios.map((scenario) => (
          <article key={scenario.id} className={`scenario-section scenario-${scenario.kind}`}>
            <div className="scenario-copy">
              <span className="scenario-number">{scenario.id}</span>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
              <dl className="force-list">
                <div>
                  <dt>Trigger</dt>
                  <dd>{scenario.trigger}</dd>
                </div>
                <div>
                  <dt>Visible forces</dt>
                  <dd>{scenario.visibleForces.map((force) => qualityLabel[force]).join(" / ")}</dd>
                </div>
              </dl>
            </div>
            <ArchitectureDiagram architecture={architecture} scenario={scenario} />
          </article>
        ))}
      </section>

      <section className="analysis-grid">
        <Panel title="利点">
          <ul>
            {architecture.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="トレードオフ">
          <ul>
            {architecture.tradeoffs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="強く効く条件">
          <ul>
            {architecture.appliesWhen.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="弱い条件">
          <ul>
            {architecture.weakWhen.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="品質特性">
          <div className="quality-stack">
            {architecture.qualityFocus.map((focus) => (
              <div key={focus.attribute} className="quality-row">
                <span>{qualityLabel[focus.attribute]}</span>
                <meter min="0" max="3" value={levelValue(focus.level)} aria-label={`${qualityLabel[focus.attribute]} ${focus.level}`} />
                <small>{focus.reason}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="判断圧">
          <ul>
            {architecture.decisionForces.map((force) => (
              <li key={force.force}>
                <strong>{force.pressure}</strong> {force.force}
                <small>{force.appearsWhen}</small>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="relation-section">
        <div className="section-head">
          <p className="eyebrow">Compatible {categoryShortLabel[opposite]}</p>
          <h2>相性の良い{categoryLabel[opposite]}</h2>
        </div>
        <div className="relation-grid">
          {related.map(({ relation, target }) => (
            <a key={relation.architectureId} href={hrefFor(target)} className="relation-card">
              <span>{relation.relationship}</span>
              <strong>{target.title}</strong>
              <p>{relation.reason}</p>
              <small>条件: {relation.condition}</small>
              <small>注意: {relation.risk}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="question-section">
        <div className="section-head">
          <p className="eyebrow">Review checklist</p>
          <h2>一緒に理解すべき問い</h2>
        </div>
        <div className="question-list">
          {architecture.questions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArchitectureIndex({ title, category, items }: { title: string; category: ArchitectureCategory; items: Architecture[] }): ReactElement {
  return (
    <section className="index-column">
      <div className="index-heading">
        <h2>{title}</h2>
        <a href={`#/${category}`}>すべて見る</a>
      </div>
      <div className="compact-list">
        {items.map((architecture) => (
          <a key={architecture.id} href={hrefFor(architecture)}>
            <strong>{architecture.title}</strong>
            <span>{architecture.summary}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }): ReactElement {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function NotFound(): ReactElement {
  return (
    <div className="page">
      <section className="page-heading">
        <p className="eyebrow">Not found</p>
        <h1>ページが見つかりません</h1>
        <p className="lead">一覧からアーキテクチャを選び直してください。</p>
        <a className="inline-action" href="#/">ホームへ戻る</a>
      </section>
    </div>
  );
}

export default App;
