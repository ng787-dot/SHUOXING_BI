import React, { useState } from 'react';
import { Users, Globe, PieChart, Database, BarChart3, Smartphone, UserCheck, DollarSign, Monitor, LayoutGrid, Bot, Cpu } from 'lucide-react';
import { MenuItem } from './types';

// Feature Components
import CountryManagement from './components/CountryManagement';
import CostManagement from './components/CostManagement';
import MediaManagement from './components/MediaManagement';
import AppManagement from './components/AppManagement';
import AdvertiserManagement from './components/AdvertiserManagement';
import CPIManagement from './components/CPIManagement';
import MarketReport from './components/MarketReport';
import DataDashboard from './components/DataDashboard';
import AIAnalysis from './components/AIAnalysis';
import AutomationRobots from './components/AutomationRobots';

const App = () => {
  const [activeTab, setActiveTab] = useState('country');

  const menuItems: MenuItem[] = [
    { 
      id: 'market', icon: Globe, label: '市场管理', 
      subItems: [
        { id: 'country', label: '国家组合管理', icon: Database },
        { id: 'cost', label: '花费管理', icon: BarChart3 },
        { id: 'media', label: '媒体管理', icon: Globe },
        { id: 'app', label: '授权管理', icon: Smartphone },
        { id: 'advertiser', label: '广告主管理', icon: UserCheck },
        { id: 'cpi', label: 'CPI 管理', icon: DollarSign },
      ]
    },
    { 
      id: 'report_group', icon: PieChart, label: '市场报表',
      subItems: [
         { id: 'report', label: '综合报表', icon: PieChart },
         { id: 'dashboard', label: '数据仪表盘', icon: LayoutGrid }
      ]
    },
    // New Modules
    { id: 'ai_analysis', icon: Bot, label: 'AI 分析功能' },
    { id: 'automation', icon: Cpu, label: '自动化机器人' },
    
    { id: 'user', icon: Users, label: '用户信息' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'country': return <CountryManagement />;
      case 'cost': return <CostManagement />;
      case 'media': return <MediaManagement />;
      case 'app': return <AppManagement />;
      case 'advertiser': return <AdvertiserManagement />;
      case 'cpi': return <CPIManagement />;
      case 'report': return <MarketReport />;
      case 'dashboard': return <DataDashboard />;
      case 'ai_analysis': return <AIAnalysis />;
      case 'automation': return <AutomationRobots />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-300">
          <Monitor size={80} className="mb-6 opacity-10 animate-pulse" />
          <p className="text-2xl font-black uppercase tracking-[0.3em]">{activeTab} MODULE WIP</p>
        </div>
      );
    }
  };

  const Badge = () => (
    <span className="ml-auto text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded border border-indigo-400 font-normal opacity-90 tracking-tighter scale-90 origin-right whitespace-nowrap">
      下次需求
    </span>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-700 font-sans overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 mb-4 bg-slate-900 shadow-inner">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-blue-500/5 rotate-3 hover:rotate-0 transition-transform duration-300"><Globe className="text-white w-6 h-6" /></div>
          <span className="font-black text-2xl text-white tracking-tighter italic uppercase select-none">Shuoxing<span className="text-blue-500">BI</span></span>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
          {menuItems.map((item) => (
            <div key={item.id} className="mb-2">
              <button onClick={() => !item.subItems && setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : ''}`}>
                <item.icon size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                <div className="font-bold text-sm tracking-wide flex-1 text-left flex items-center justify-between">
                  <span>{item.label}</span>
                  {(item.id === 'ai_analysis' || item.id === 'automation') && <Badge />}
                </div>
              </button>
              {item.subItems && (
                <div className="ml-10 mt-2 space-y-1.5 border-l-2 border-slate-800 pl-4 text-left">
                  {item.subItems.map(sub => (
                    <button key={sub.id} onClick={() => setActiveTab(sub.id)} className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 ${activeTab === sub.id ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                      <sub.icon size={15} className="shrink-0" />
                      <div className="flex-1 flex items-center justify-between">
                        <span>{sub.label}</span>
                        {sub.id === 'dashboard' && <Badge />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* 主界面 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-[40]">
          <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-black shadow-inner tracking-tighter uppercase">Market_Hub_V3.0</span><span>/</span>
            <span className="text-slate-900 font-black text-sm uppercase tracking-tighter">{menuItems.flatMap(i => i.subItems || [i]).find(i => i.id === activeTab)?.label || activeTab}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pl-6 border-l-2 border-slate-100">
              <div className="text-right leading-none">
                <p className="text-sm font-black text-slate-900 tracking-tight mb-1 font-sans">邓文豪</p>
                <p className="text-[9px] font-bold text-blue-500 italic uppercase tracking-widest font-mono">Master Administrator</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-blue-200">D</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};

export default App;