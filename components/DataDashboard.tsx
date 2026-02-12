import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Save, BarChart3, PieChart, LineChart, TrendingUp, X, Filter, LayoutGrid, Trash2, MoreHorizontal } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { PROJECTS, COUNTRY_FULL_DATA, SYSTEM_CHANNELS } from '../constants';
import { CustomTier } from '../types';

// --- Types ---
type ChartType = 'line' | 'bar' | 'pie' | 'number';

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  metric: string; // e.g., 'cost', 'roi', 'installs'
  dimension: string; // e.g., 'date', 'country', 'media'
}

const METRICS = [
  { value: 'cost', label: '花销 (Cost)' },
  { value: 'installs', label: '安装数 (Installs)' },
  { value: 'roi', label: 'ROI' },
  { value: 'cpa', label: 'CPA' },
  { value: 'revenue', label: '收入 (Revenue)' }
];

const DIMENSIONS = [
  { value: 'date', label: '时间 (Date)' },
  { value: 'country', label: '国家 (Country)' },
  { value: 'media', label: '媒体 (Media)' },
  { value: 'project', label: '项目 (Project)' }
];

const CHART_TYPES = [
  { type: 'line', label: '折线图', icon: LineChart, desc: '适合查看趋势 (X轴通常为时间)' },
  { type: 'bar', label: '柱状图', icon: BarChart3, desc: '适合对比不同维度的数据' },
  { type: 'pie', label: '饼状图', icon: PieChart, desc: '适合查看占比 (如花费分布)' },
  { type: 'number', label: '关键指标', icon: TrendingUp, desc: '展示单一核心数据' }
];

// --- Mock Chart Components (CSS/SVG based for zero-dependency) ---

const SimpleLineChart = ({ color = '#3b82f6' }) => {
  // Generate random path
  const points = Array.from({ length: 10 }).map((_, i) => `${i * 10},${100 - Math.random() * 80}`).join(' ');
  return (
    <div className="w-full h-full flex items-end pt-4">
      <svg viewBox="0 0 90 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" />
        {/* Simple dots */}
        {points.split(' ').map((p, i) => {
           const [x, y] = p.split(',');
           return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        })}
      </svg>
    </div>
  );
};

const SimpleBarChart = () => {
  const data = [45, 70, 30, 90, 60, 20, 80];
  return (
    <div className="w-full h-full flex items-end justify-between gap-2 pt-4 px-2">
      {data.map((h, i) => (
        <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group hover:bg-blue-200 transition-colors" style={{ height: `${h}%` }}>
          <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
          {/* Tooltip hint */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {h}
          </div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = () => {
  // Conic gradient is easiest for CSS pies
  return (
    <div className="w-full h-full flex items-center justify-center pt-2">
      <div 
        className="w-32 h-32 rounded-full border-4 border-white shadow-lg relative group"
        style={{ background: 'conic-gradient(#3b82f6 0% 35%, #8b5cf6 35% 60%, #10b981 60% 85%, #f59e0b 85% 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-500 shadow-inner">
               Total
            </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value }: { title: string, value: string }) => (
    <div className="flex flex-col items-center justify-center h-full">
        <span className="text-4xl font-black text-slate-800 tracking-tighter">{value}</span>
        <span className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">{title}</span>
        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-2">▲ 12.5% vs last week</span>
    </div>
);


// --- Main Component ---

const DataDashboard = () => {
  // Filter States
  const [timeRange, setTimeRange] = useState({ start: '2026-02-01', end: '2026-02-07' });
  const [filters, setFilters] = useState({
    project: 'DawnGod',
    games: [] as string[],
    media: [] as string[],
    tiers: [] as string[],
    countries: [] as string[]
  });

  // Dashboard Data
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [dashboardName, setDashboardName] = useState('New Dashboard');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChartConfig, setNewChartConfig] = useState<Partial<ChartConfig>>({ type: 'line', metric: 'cost', dimension: 'date' });

  // Custom Tier Logic (Copied logic for consistency)
  const [customTiers, setCustomTiers] = useState<CustomTier[]>([]);
  useEffect(() => {
    const stored = localStorage.getItem('custom_tiers');
    if (stored) setCustomTiers(JSON.parse(stored));
    
    // Load dashboard
    const storedDash = localStorage.getItem('my_dashboard');
    if (storedDash) {
        try {
            const parsed = JSON.parse(storedDash);
            setCharts(parsed.charts || []);
            setDashboardName(parsed.name || 'My Dashboard');
        } catch(e) {}
    }
  }, []);

  // Options Logic
  const tierOptions = useMemo(() => ['T1', 'T2', 'T3', 'T4', ...customTiers.map(t => t.name)], [customTiers]);
  const gameOptions = useMemo(() => filters.project ? [`${filters.project}-Android`, `${filters.project}-iOS`] : [], [filters.project]);
  const countryOptions = useMemo(() => COUNTRY_FULL_DATA.map(c => c.iso2), []);
  const mediaOptions = ['Facebook', 'Google Ads', 'TikTok', 'Unity', 'Applovin', 'IronSource']; // Simplified

  // Handlers
  const handleSaveDashboard = () => {
    const dashData = { name: dashboardName, charts };
    localStorage.setItem('my_dashboard', JSON.stringify(dashData));
    alert("仪表盘布局已保存 (Dashboard Saved)");
  };

  const handleAddChart = () => {
    if (!newChartConfig.title) {
       // Auto generate title
       const mLabel = METRICS.find(m => m.value === newChartConfig.metric)?.label.split(' ')[0];
       const dLabel = DIMENSIONS.find(d => d.value === newChartConfig.dimension)?.label.split(' ')[0];
       newChartConfig.title = `${dLabel} - ${mLabel} 分析`;
    }
    
    const newChart: ChartConfig = {
        id: Date.now().toString(),
        type: newChartConfig.type || 'line',
        title: newChartConfig.title!,
        metric: newChartConfig.metric || 'cost',
        dimension: newChartConfig.dimension || 'date'
    };
    
    setCharts([...charts, newChart]);
    setIsAddModalOpen(false);
    setNewChartConfig({ type: 'line', metric: 'cost', dimension: 'date', title: '' });
  };

  const removeChart = (id: string) => {
      setCharts(charts.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* 1. Header & Global Filters */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible z-30 relative">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><LayoutGrid size={20} /></div>
                <input 
                    type="text" 
                    value={dashboardName} 
                    onChange={e => setDashboardName(e.target.value)}
                    className="text-lg font-black text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-purple-300 hover:border-slate-300 transition-colors w-64"
                />
            </div>
            <button onClick={handleSaveDashboard} className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all active:scale-95 shadow-md">
                <Save size={14} /> 保存布局
            </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase pl-1">日期范围</label>
                <div className="flex gap-2 h-10">
                    <input type="date" value={timeRange.start} onChange={e=>setTimeRange({...timeRange, start:e.target.value})} className="w-full px-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none" />
                    <input type="date" value={timeRange.end} onChange={e=>setTimeRange({...timeRange, end:e.target.value})} className="w-full px-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none" />
                </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase pl-1">项目</label>
               <select className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm font-bold outline-none" value={filters.project} onChange={e => setFilters({...filters, project: e.target.value})}>
                 {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
            
            <MultiSelectDropdown 
                label="游戏" options={gameOptions} selected={filters.games} 
                onToggle={o => setFilters(prev => ({...prev, games: prev.games.includes(o) ? prev.games.filter(x=>x!==o) : [...prev.games, o]}))} 
                placeholder="全部游戏"
            />
            
            <MultiSelectDropdown 
                label="Tier & 地区" options={tierOptions} selected={filters.tiers} 
                onToggle={o => setFilters(prev => ({...prev, tiers: prev.tiers.includes(o) ? prev.tiers.filter(x=>x!==o) : [...prev.tiers, o]}))} 
                placeholder="全部 Tier"
            />
        </div>
      </section>

      {/* 2. Dashboard Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Render Charts */}
        {charts.map((chart) => (
            <div key={chart.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[320px] group relative hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-black text-slate-700 text-sm">{chart.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                            {DIMENSIONS.find(d => d.value === chart.dimension)?.label} • {METRICS.find(m => m.value === chart.metric)?.label}
                        </p>
                    </div>
                    <button onClick={() => removeChart(chart.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div className="flex-1 w-full h-full overflow-hidden relative">
                    {chart.type === 'line' && <SimpleLineChart />}
                    {chart.type === 'bar' && <SimpleBarChart />}
                    {chart.type === 'pie' && <SimplePieChart />}
                    {chart.type === 'number' && <MetricCard title={chart.title} value="$1,245,090" />}
                </div>
            </div>
        ))}

        {/* Add Button Card */}
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-[320px] border-3 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
        >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <Plus size={32} className="group-hover:text-blue-600"/>
            </div>
            <span className="font-black text-sm uppercase tracking-wide">添加新图表 (Add Chart)</span>
        </button>
      </section>

      {/* 3. Add Chart Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
                <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">配置新图表</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. 选择图表类型</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CHART_TYPES.map(t => {
                                const Icon = t.icon;
                                const isSelected = newChartConfig.type === t.type;
                                return (
                                    <div 
                                        key={t.type} 
                                        onClick={() => setNewChartConfig({...newChartConfig, type: t.type as ChartType})}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
                                    >
                                        <Icon size={24} />
                                        <div className="text-center">
                                            <div className="text-xs font-black">{t.label}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Data Config */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">2. 数据配置</label>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-700">展示数据 (Metric)</span>
                                <select 
                                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white font-bold outline-none focus:border-blue-500"
                                    value={newChartConfig.metric}
                                    onChange={e => setNewChartConfig({...newChartConfig, metric: e.target.value})}
                                >
                                    {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-700">分组维度 (Dimension/X-Axis)</span>
                                <select 
                                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white font-bold outline-none focus:border-blue-500"
                                    value={newChartConfig.dimension}
                                    onChange={e => setNewChartConfig({...newChartConfig, dimension: e.target.value})}
                                >
                                    {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">3. 图表标题 (可选)</label>
                        <input 
                            type="text" 
                            className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                            placeholder="自定义标题，留空则自动生成"
                            value={newChartConfig.title || ''}
                            onChange={e => setNewChartConfig({...newChartConfig, title: e.target.value})}
                        />
                    </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
                    <button onClick={handleAddChart} className="px-10 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                        <Plus size={16} /> 添加图表
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DataDashboard;