import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { setModelPricing } from "./api/tauriCommands";
import Dashboard from "./routes/Dashboard";
import Sessions from "./routes/Sessions";
import Settings from "./routes/Settings";
import Analytics from "./routes/Analytics";
import TrendChart from "./components/TrendChart";
import WidgetApp from "./widget/WidgetApp";
import { exportExcelReport } from "./utils/excelExport";
import { useStatsStore } from "./stores/useStatsStore";
import { useWidgetStore } from "./stores/useWidgetStore";

const capturedSheets: Array<{ name: string; rows: unknown[][] }> = [];

vi.mock("xlsx", () => ({
  utils: {
    book_new: () => ({}),
    aoa_to_sheet: (rows: unknown[][]) => ({ rows }),
    book_append_sheet: (_wb: unknown, ws: { rows: unknown[][] }, name: string) => {
      capturedSheets.push({ name, rows: ws.rows });
    },
  },
  write: () => "binary",
}));

vi.mock("@tauri-apps/api/event", () => ({
  emit: vi.fn(),
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    hide: vi.fn().mockResolvedValue(undefined),
    startDragging: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

vi.mock("echarts-for-react", () => ({
  default: ({ option, style, ...props }: { option: { title?: { text?: string }; legend?: { data?: string[] }, series?: unknown[]; calendar?: { monthLabel?: { nameMap?: string[] } }; yAxis?: { name?: string } | Array<{ name?: string }> }; style?: { height?: number | string } }) => (
    <div data-testid={`echarts-${option.title?.text ?? props["aria-label"] ?? "chart"}`} data-height={String(style?.height ?? "") }>
      <div data-testid="echarts-title">{option.title?.text ?? ""}</div>
      <div data-testid="echarts-legend">{JSON.stringify(option.legend?.data ?? [])}</div>
      <div data-testid="echarts-calendar-months">{JSON.stringify(option.calendar?.monthLabel?.nameMap ?? [])}</div>
      <div data-testid="echarts-yaxis">{JSON.stringify(option.yAxis ?? null)}</div>
      <pre data-testid="echarts-series">{JSON.stringify(option.series ?? [])}</pre>
    </div>
  ),
}));

vi.mock("./api/tauriCommands", () => ({
  getOverviewStats: vi.fn().mockResolvedValue({
    total_requests: 12,
    total_cost: 1.23,
    total_tokens: 1000,
    total_input: 500,
    total_output: 300,
    total_cache_read: 100,
    total_cache_creation: 100,
    currency: "USD",
  }),
  getTrendData: vi.fn().mockResolvedValue([
    {
      date: "2026-05-20",
      input_tokens: 10,
      output_tokens: 20,
      cache_read_tokens: 30,
      cache_creation_tokens: 40,
      cost: 0.5,
    },
  ]),
  getFilterOptions: vi.fn().mockResolvedValue({ sources: [], models: [], projects: [] }),
  refreshData: vi.fn().mockResolvedValue(0),
  exportData: vi.fn().mockResolvedValue(""),
  getSessionList: vi.fn().mockImplementation((_filters, limit: number, offset: number) => {
    const allItems = Array.from({ length: 21 }, (_, index) => ({
      session_id: `session-${index + 1}`,
      source: index === 20 ? "codex" : "claude",
      project_path: null,
      start_time: 1716163200 + index * 3600,
      end_time: 1716166800 + index * 3600,
      total_input: 500 + index * 10,
      total_output: 300,
      total_cache_read: 100,
      total_cache_creation: 0,
      total_cost: 1.23 + index,
      message_count: index + 1,
      agent_count: 1,
    }));
    const items = allItems.slice(offset, offset + limit);
    return Promise.resolve({
      items,
      has_more: offset + limit < allItems.length,
      total: allItems.length,
    });
  }),
  getSessionDetail: vi.fn().mockResolvedValue([
    {
      id: 1,
      source: "claude",
      session_id: "session-1",
      agent_type: "root",
      agent_id: null,
      timestamp: 1716163200,
      model: "claude-4",
      input_tokens: 10,
      output_tokens: 20,
      cache_read_tokens: 30,
      cache_creation_tokens: 40,
      project_path: null,
      message_id: null,
      cost_estimate: 0.5,
    },
  ]),
  getModelPricing: vi.fn().mockResolvedValue([
    {
      model: "claude-4",
      input_price: 1,
      output_price: 2,
      cache_read_price: 0.1,
      cache_creation_price: 0.5,
      currency: "USD",
    },
  ]),
  setModelPricing: vi.fn().mockResolvedValue(undefined),
  loadWidgetConfig: vi.fn().mockResolvedValue({}),
  saveWidgetConfig: vi.fn().mockResolvedValue(undefined),
  toggleWidget: vi.fn().mockResolvedValue(undefined),
  embedWidgetToDesktop: vi.fn().mockResolvedValue(undefined),
  unpinWidgetFromDesktop: vi.fn().mockResolvedValue(undefined),
  getDistribution: vi.fn().mockImplementation((_filters, dimension: string) => {
    if (dimension === "model") {
      return Promise.resolve([
        { name: "claude-4-super-long-model-name", value: 70, cost: 0.7 },
        { name: "gpt-4.1", value: 30, cost: 0.3 },
      ]);
    }
    if (dimension === "source") {
      return Promise.resolve([
        { name: "claude", value: 70, cost: 0.7 },
        { name: "codex", value: 30, cost: 0.3 },
      ]);
    }
    if (dimension === "agent_type") {
      return Promise.resolve([
        { name: "root", value: 80, cost: 0.8 },
        { name: "worker", value: 20, cost: 0.2 },
      ]);
    }
    return Promise.resolve([]);
  }),
  getHourlyDistribution: vi.fn().mockResolvedValue([]),
  getTopN: vi.fn().mockResolvedValue([
    { name: "session-1", value: 700, cost: 0.7 },
    { name: "session-2", value: 300, cost: 0.3 },
  ]),
  getHeatmapData: vi.fn().mockResolvedValue([{ date: "2026-05-20", value: 100 }]),
  getModelTrend: vi.fn().mockResolvedValue([
    { date: "2026-05-20", model: "claude-4-super-long-model-name", tokens: 700 },
    { date: "2026-05-20", model: "gpt-4.1", tokens: 300 },
  ]),
  getCumulativeCost: vi.fn().mockResolvedValue([{ date: "2026-05-20", cost: 1.23 }]),
  getScatterData: vi.fn().mockResolvedValue([
    { input: 500, output: 300, model: "claude-4-super-long-model-name", cost: 0.7 },
  ]),
  getSankeyData: vi.fn().mockResolvedValue([["输入", "输出", 800]]),
}));

function resetStatsStore() {
  useStatsStore.setState({
    filters: {
      start_time: null,
      end_time: null,
      sources: null,
      models: null,
      projects: null,
      agent_types: null,
    },
    overview: {
      total_requests: 12,
      total_cost: 1.23,
      total_tokens: 1000,
      total_input: 500,
      total_output: 300,
      total_cache_read: 100,
      total_cache_creation: 100,
      currency: "USD",
    },
    trendData: [
      {
        date: "2026-05-20",
        input_tokens: 10,
        output_tokens: 20,
        cache_read_tokens: 30,
        cache_creation_tokens: 40,
        cost: 0.5,
      },
    ],
    isLoading: false,
    isSyncing: false,
    lastSyncTime: null,
    availableSources: [],
    availableModels: [],
    availableProjects: [],
    theme: "light",
    costDisplaySettings: {
      display_currency: "CNY",
      usd_to_cny_rate: 6.8304,
      exchange_rate_date: "2026-05-06",
      exchange_rate_note: "test",
    },
    refreshVersion: 0,
  });
}

function resetWidgetStore() {
  useWidgetStore.setState({
    config: {
      locked: false,
      pinned_to_desktop: false,
      selected_modules: ["overview"],
      layout: "vertical",
      background_mode: "solid",
      background_opacity: 0.88,
      resizable: false,
      width: 320,
      height: 440,
      x: null,
      y: null,
      theme: "light",
      refresh_interval_sec: 0,
      time_period: "7d",
    },
    overview: {
      total_requests: 12,
      total_cost: 1.23,
      total_tokens: 1000,
      total_input: 500,
      total_output: 300,
      total_cache_read: 100,
      total_cache_creation: 100,
      currency: "USD",
    },
    trendData: [],
    distribution: [],
    modelDistribution: [],
    hourlyData: [],
    topProjects: [],
    isLoading: false,
    refreshVersion: 0,
    showSettings: false,
    costDisplaySettings: {
      display_currency: "CNY",
      usd_to_cny_rate: 6.8304,
      exchange_rate_date: "2026-05-06",
      exchange_rate_note: "test",
    },
  });
}

afterEach(() => {
  cleanup();
  capturedSheets.length = 0;
  vi.restoreAllMocks();
});

describe("cache creation visibility", () => {
  it("shows dashboard totals and secondary cards with the requested labels and layout", async () => {
    resetStatsStore();
    const { container } = render(<Dashboard />);

    await screen.findByText("消费额度");
    expect(screen.queryByText("总成本")).not.toBeInTheDocument();
    expect(screen.getByText("总 Tokens")).toBeInTheDocument();
    expect(screen.queryByText("总 Token 数")).not.toBeInTheDocument();
    expect(screen.queryByText(/Input:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Output:/)).not.toBeInTheDocument();
    expect(screen.getByText("¥8.4")).toBeInTheDocument();
    expect(screen.queryByText("¥8.4014")).not.toBeInTheDocument();

    const cacheReadLabels = screen.getAllByText("缓存读取");
    expect(cacheReadLabels).toHaveLength(1);
    expect(screen.queryByText("缓存 Token")).not.toBeInTheDocument();
    expect(screen.queryByText(/创建:/)).not.toBeInTheDocument();

    expect(screen.getByText("输入 Tokens")).toBeInTheDocument();
    expect(screen.getByText("输出 Tokens")).toBeInTheDocument();

    const topRowTitles = Array.from(container.querySelectorAll(".xl\\:grid-cols-3 > div .text-sm")).map((node) => node.textContent);
    expect(topRowTitles.slice(0, 3)).toEqual(["消费额度", "总请求数", "总 Tokens"]);
  });

  it("removes cache creation series and keeps spending labels consistent in trend chart", () => {
    resetStatsStore();
    render(<TrendChart data={useStatsStore.getState().trendData} showCost={true} />);
    expect(screen.getByTestId("echarts-legend")).not.toHaveTextContent("缓存创建");
    expect(screen.getByTestId("echarts-legend")).toHaveTextContent("消费额度");
    const seriesText = screen.getByTestId("echarts-series").textContent ?? "";
    expect(seriesText).toContain('"name":"消费额度"');
    expect(seriesText).toContain('"lineStyle":{"type":"solid","width":2}');
  });

  it("shows session page with updated wording, total pages, and page jump", async () => {
    resetStatsStore();
    render(<Sessions />);

    await screen.findByText("会话浏览");
    expect(screen.queryByText("会话浏览器")).not.toBeInTheDocument();
    expect(screen.getByText("总Tokens")).toBeInTheDocument();
    expect(screen.queryByText("总Token")).not.toBeInTheDocument();
    expect(screen.getByText("消费额度")).toBeInTheDocument();
    expect(screen.queryByText("成本")).not.toBeInTheDocument();
    expect(screen.getByText("对话数")).toBeInTheDocument();
    expect(screen.queryByText("消息数")).not.toBeInTheDocument();

    expect(screen.getByText("session-1")).toBeInTheDocument();
    expect(screen.getByText("第 1 / 2 页，共 21 条")).toBeInTheDocument();

    const pageInput = screen.getByLabelText("跳转页码");
    fireEvent.change(pageInput, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "跳转" }));

    await screen.findByText("session-21");
    expect(screen.queryByText("session-1")).not.toBeInTheDocument();
    expect(screen.getByText("第 2 / 2 页，共 21 条")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /查看会话 session-21 详情/i }));
    await screen.findByText("Cache: 30");
    expect(screen.queryByText("Cache: 70")).not.toBeInTheDocument();
  });

  it("removes cost display card and renames visible product branding to TokenScope", async () => {
    resetStatsStore();
    render(<Settings />);
    await screen.findByText("输入价格");
    expect(screen.getByText("输出价格")).toBeInTheDocument();
    expect(screen.getByText("缓存补全价格")).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("单位: CNY") && text.includes("/ 1M tokens"))).toBeInTheDocument();
    expect(screen.queryByText("成本显示")).not.toBeInTheDocument();
    expect(screen.queryByText("显示币种")).not.toBeInTheDocument();
    expect(screen.getByText("TokenScope v0.3.1")).toBeInTheDocument();
    expect(screen.queryByText("Token Cost Analyzer v0.3.1")).not.toBeInTheDocument();

    const pricingInputs = screen.getAllByRole("spinbutton").slice(0, 3) as HTMLInputElement[];
    expect(pricingInputs[0]?.value).toBe("6.83");
    expect(pricingInputs[1]?.value).toBe("13.66");
    expect(pricingInputs[2]?.value).toBe("0.68");

    fireEvent.change(pricingInputs[0]!, { target: { value: "68.3" } });
    fireEvent.click(screen.getByRole("button", { name: "保存配置" }));
    await waitFor(() => expect(setModelPricing).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("保存成功！成本已重新计算")).toBeInTheDocument());
    const savedPricing = vi.mocked(setModelPricing).mock.calls[0]?.[0];
    expect(savedPricing?.input_price).toBeCloseTo(68.3 / 6.8304, 6);
  });

  it("shows TokenScope branding and updated overview labels in widget", async () => {
    resetWidgetStore();
    render(<WidgetApp />);
    await screen.findByText("TokenScope");
    expect(screen.queryByText("Token 小组件")).not.toBeInTheDocument();
    expect(screen.getByText("消费额度")).toBeInTheDocument();
    expect(screen.getByText("总 Tokens")).toBeInTheDocument();
    expect(screen.getByText("总请求数")).toBeInTheDocument();
    expect(screen.queryByText("总成本")).not.toBeInTheDocument();
    expect(screen.queryByText("总 Token")).not.toBeInTheDocument();
    expect(screen.queryByText("总请求")).not.toBeInTheDocument();
    expect(screen.getByText("¥8.4")).toBeInTheDocument();
    expect(screen.queryByText("¥8.40")).not.toBeInTheDocument();
    expect(screen.getByText("缓存读取")).toBeInTheDocument();
    expect(screen.queryByText("缓存命中")).not.toBeInTheDocument();
  });

  it("omits cache creation rows and columns from excel export", () => {
    resetStatsStore();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });

    exportExcelReport({
      overview: useStatsStore.getState().overview,
      modelDist: [],
      sourceDist: [],
      topSessions: [],
      trendData: useStatsStore.getState().trendData,
      costDisplaySettings: useStatsStore.getState().costDisplaySettings,
    });

    const sheetText = capturedSheets.flatMap((sheet) => sheet.rows.flat()).join(" |");
    expect(sheetText).not.toContain("缓存创建");
    expect(sheetText).not.toContain("Cache Creation");
  });

  it("reorders analytics panels and shows full model names with centered percentages", async () => {
    resetStatsStore();
    const { container } = render(<Analytics />);

    await screen.findByLabelText("模型分布饼图");
    expect(screen.queryByLabelText("Token 消耗热力图")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Input Output 散点图")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("代理类型分布")).not.toBeInTheDocument();
    expect(screen.getByLabelText("24小时时段分布")).toBeInTheDocument();
    expect(screen.getByLabelText("Top 10 会话柱状图")).toBeInTheDocument();

    const modelChart = screen.getByTestId("echarts-模型分布");
    expect(modelChart).toHaveAttribute("data-height", "340");

    const modelSeriesText = modelChart.querySelector('[data-testid="echarts-series"]')?.textContent ?? "";
    expect(modelSeriesText).toContain('"formatter":"{b}\\n{d}%"');
    expect(modelSeriesText).not.toContain('"overflow":"truncate"');
    expect(modelSeriesText).toContain('"name":"claude-4-super-long-model-name"');

    expect(screen.getAllByLabelText("累计消费额度")).toHaveLength(1);
    expect(screen.queryByLabelText("累计成本曲线")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Token 流向桑基图")).toBeInTheDocument();

    const cumulativeChart = screen.getByTestId("echarts-累计消费额度");
    const cumulativeSeriesText = cumulativeChart.querySelector('[data-testid="echarts-series"]')?.textContent ?? "";
    expect(cumulativeSeriesText).not.toContain('"name":"累计消费额度"');

    const sankeyChart = screen.getByTestId("echarts-Token 流向");
    const sankeySeriesText = sankeyChart.querySelector('[data-testid="echarts-series"]')?.textContent ?? "";
    expect(sankeySeriesText).toContain('"top":48');

    const grids = Array.from(container.querySelectorAll(".grid.gap-6"));
    expect(grids).toHaveLength(4);
    expect(grids[1]?.textContent).toContain("Top 10 会话");
    expect(grids[1]?.textContent).toContain("时段分布（24小时）");
    expect(grids[2]?.textContent).toContain("累计消费额度");
    expect(grids[2]?.textContent).toContain("Token 流向");
    expect(grids[3]?.textContent).toContain("模型迁移趋势");
  });
});
