import React, { useState, useMemo } from 'react';
import { Bot, FileText, Plus, Settings, PlayCircle, StopCircle, MoreHorizontal, X, PlusCircle, Trash2, Workflow } from 'lucide-react';
import { PROJECTS } from '../constants';

interface Robot {
  id: number;
  name: string;
  icon: any;
  color: string;
  status: 'running' | 'stopped' | 'error';
  lastRun: string;
  botType?: string;
  configRows?: BotConfigRow[];
  webhook?: string;
  period?: 'nhours'|'daily'|'weekly';
  nHours?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
}

interface BotConfigRow {
  id: string;
  project: string;
  game: string;
  dataRangeDays: string;
}

const AutomationRobots = () => {
  const [robots, setRobots] = useState<Robot[]>([
    { id: 1, name: '日报机器人', icon: FileText, color: 'text-blue-500 bg-blue-50', status: 'running', lastRun: '1 hour ago', botType: 'daily' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBotId, setEditingBotId] = useState<number | null>(null);
  
  // Modal states
  const [botType, setBotType] = useState<'daily'|'automation'|'workflow'>('daily');
  const [configRows, setConfigRows] = useState<BotConfigRow[]>([{ id: '1', project: PROJECTS[0] || '', game: '', dataRangeDays: '1' }]);
  const [webhook, setWebhook] = useState('');
  const [period, setPeriod] = useState<'nhours'|'daily'|'weekly'>('daily');
  const [nHours, setNHours] = useState('1');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // 1=Mon, 7=Sun

  const handleAddRobot = () => {
    // Reset modal state
    setEditingBotId(null);
    setBotType('daily');
    setConfigRows([{ id: Date.now().toString(), project: PROJECTS[0] || '', game: '', dataRangeDays: '1' }]);
    setWebhook('');
    setPeriod('daily');
    setTimeOfDay('09:00');
    setDayOfWeek('1');
    setNHours('1');
    setIsModalOpen(true);
  };

  const handleEditBot = (robot: Robot) => {
    setEditingBotId(robot.id);
    setBotType((robot.botType as any) || 'daily');
    setConfigRows(robot.configRows && robot.configRows.length > 0 ? robot.configRows : [{ id: Date.now().toString(), project: PROJECTS[0] || '', game: '', dataRangeDays: '1' }]);
    setWebhook(robot.webhook || '');
    setPeriod(robot.period || 'daily');
    setTimeOfDay(robot.timeOfDay || '09:00');
    setDayOfWeek(robot.dayOfWeek || '1');
    setNHours(robot.nHours || '1');
    setIsModalOpen(true);
  };

  const toggleRun = (id: number) => {
    setRobots(robots.map(r => r.id === id ? {
      ...r,
      status: r.status === 'running' ? 'stopped' : 'running'
    } : r));
  };

  const handleSaveBot = () => {
    if (!webhook.trim()) {
      alert("请输入 Webhook");
      return;
    }
    
    if (editingBotId) {
      setRobots(robots.map(r => r.id === editingBotId ? {
        ...r, botType, configRows, webhook, period, nHours, timeOfDay, dayOfWeek
      } : r));
    } else {
      let icon = FileText;
      let color = 'text-blue-500 bg-blue-50';
      let name = '自定义机器人';
       
      if (botType === 'daily') {
         icon = FileText;
         color = 'text-blue-500 bg-blue-50';
         name = '日报机器人';
      } else if (botType === 'automation') {
         icon = Bot;
         color = 'text-orange-500 bg-orange-50';
         name = '自动化机器人';
      } else if (botType === 'workflow') {
         icon = Workflow;
         color = 'text-purple-500 bg-purple-50';
         name = '流程机器人';
      }

      const newBot: Robot = {
        id: Date.now(),
        name,
        icon,
        color,
        status: 'stopped',
        lastRun: 'Never',
        botType,
        configRows, webhook, period, nHours, timeOfDay, dayOfWeek
      };
      setRobots([...robots, newBot]);
    }
    setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'running': return 'bg-emerald-400 animate-pulse';
          case 'error': return 'bg-red-500';
          default: return 'bg-slate-300';
      }
  };

  const addRow = () => {
    const defaultProject = PROJECTS[0] || '';
    setConfigRows([...configRows, { id: Date.now().toString(), project: defaultProject, game: '', dataRangeDays: '1' }]);
  };

  const removeRow = (id: string) => {
    if (configRows.length === 1) return;
    setConfigRows(configRows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: 'project' | 'game' | 'dataRangeDays', value: string) => {
    setConfigRows(configRows.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        // Reset game if project changes
        if (field === 'project') {
           updated.game = '';
        }
        return updated;
      }
      return r;
    }));
  };

  const getGameOptions = (proj: string) => {
    if (!proj) return [];
    return [`${proj}-Android`, `${proj}-iOS`, `${proj}-Huawei`, `${proj}-PC`];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight mb-2">自动化机器人中心</h2>
            <p className="text-slate-400 text-sm max-w-lg">
                管理和监控您的后台自动化流程，支持实时状态监控与手动触发。
            </p>
            <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> {robots.filter(r => r.status === 'running').length} 运行中
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div> {robots.filter(r => r.status === 'stopped').length} 已停止
                </div>
            </div>
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Existing Robots */}
        {robots.map((robot) => (
          <div key={robot.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative">
            
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><MoreHorizontal size={18}/></button>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${robot.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <robot.icon size={28} />
              </div>
            </div>

            <h3 className="font-black text-slate-800 text-base mb-1">{robot.name}</h3>
            <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(robot.status)}`}></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{robot.status}</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">Last run: {robot.lastRun}</span>
                <div className="flex gap-2">
                    <button onClick={() => handleEditBot(robot)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="配置">
                        <Settings size={16} />
                    </button>
                    <button onClick={() => toggleRun(robot.id)} className={`p-2 rounded-lg transition-colors ${robot.status === 'running' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={robot.status === 'running' ? '停止运行' : '立即运行'}>
                        {robot.status === 'running' ? <StopCircle size={16} /> : <PlayCircle size={16} />}
                    </button>
                </div>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button 
          onClick={handleAddRobot}
          className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-5 min-h-[220px] hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-blue-200 transition-all shadow-sm">
            <Plus size={24} className="text-slate-400 group-hover:text-blue-500"/>
          </div>
          <span className="font-black text-slate-500 text-sm group-hover:text-blue-600">新增机器人</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Create New Bot</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">{editingBotId ? '编辑' : '新增'}机器人配置</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
               {/* Type Config */}
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">机器人类型</label>
                 <select 
                   className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 w-full"
                   value={botType}
                   onChange={e => setBotType(e.target.value as any)}
                 >
                   <option value="daily">日报机器人</option>
                   <option value="automation">自动化机器人</option>
                   <option value="workflow">流程机器人</option>
                 </select>
               </div>

               <hr className="border-slate-100" />

               {/* Rows Config */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <div>
                       <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">项目与游戏设置</label>
                       <p className="text-[10px] text-slate-400 font-medium">每多添加一行，代表汇报将多生成一张对应的图表</p>
                     </div>
                     <button onClick={addRow} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                       <PlusCircle size={14} /> 添加一行
                     </button>
                  </div>
                  
                  <div className="space-y-2">
                     {configRows.map((row, index) => (
                       <div key={row.id} className="flex gap-4 items-center bg-slate-50 border border-slate-200 p-3 rounded-lg relative group">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">项目</label>
                                <select 
                                  className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                                  value={row.project}
                                  onChange={(e) => updateRow(row.id, 'project', e.target.value)}
                                >
                                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                             </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">游戏名称</label>
                                <select 
                                  className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                                  value={row.game}
                                  onChange={(e) => updateRow(row.id, 'game', e.target.value)}
                                >
                                  <option value="">全选</option>
                                  {getGameOptions(row.project).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                             </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">数据范围 (天)</label>
                                <select 
                                  className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                                  value={row.dataRangeDays || '1'}
                                  onChange={(e) => updateRow(row.id, 'dataRangeDays', e.target.value)}
                                >
                                  {Array.from({length: 30}).map((_, i) => (
                                     <option key={i+1} value={i+1}>{i+1} 天</option>
                                  ))}
                                </select>
                             </div>
                          </div>
                          {configRows.length > 1 && (
                            <button onClick={() => removeRow(row.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors mt-5" title="移除该行">
                                <Trash2 size={18} />
                            </button>
                          )}
                       </div>
                     ))}
                  </div>
               </div>

               <hr className="border-slate-100" />

               {/* Webhook Config */}
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">推送通知 (Webhook)</label>
                 <input 
                   type="text" 
                   placeholder="请输入企业微信/钉钉/飞书等群组机器人的 Webhook 地址..." 
                   className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 w-full placeholder:text-slate-400"
                   value={webhook}
                   onChange={e => setWebhook(e.target.value)}
                 />
               </div>

               <hr className="border-slate-100" />

               {/* Schedule Config */}
               <div className="space-y-3">
                 <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">运行时间规则</label>
                 <div className="flex flex-wrap gap-4 items-end bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="flex flex-col gap-1.5 w-40">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">运行周期</label>
                        <select 
                          className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                          value={period}
                          onChange={(e) => setPeriod(e.target.value as any)}
                        >
                          <option value="nhours">每 N 小时</option>
                          <option value="daily">每天</option>
                          <option value="weekly">每周</option>
                        </select>
                    </div>

                    {period === 'nhours' && (
                       <div className="flex flex-col gap-1.5 w-40 animate-in fade-in zoom-in-95">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">间隔数值 (小时)</label>
                          <select 
                            className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                            value={nHours}
                            onChange={(e) => setNHours(e.target.value)}
                          >
                            {Array.from({length: 24}).map((_, i) => (
                               <option key={i+1} value={i+1}>{i+1} 小时</option>
                            ))}
                          </select>
                       </div>
                    )}

                    {period === 'weekly' && (
                       <div className="flex flex-col gap-1.5 w-40 animate-in fade-in zoom-in-95">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">每周选择</label>
                          <select 
                            className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                          >
                            <option value="1">每周一 (Mon)</option>
                            <option value="2">每周二 (Tue)</option>
                            <option value="3">每周三 (Wed)</option>
                            <option value="4">每周四 (Thu)</option>
                            <option value="5">每周五 (Fri)</option>
                            <option value="6">每周六 (Sat)</option>
                            <option value="7">每周日 (Sun)</option>
                          </select>
                       </div>
                    )}

                    {(period === 'daily' || period === 'weekly') && (
                       <div className="flex flex-col gap-1.5 w-40 animate-in fade-in zoom-in-95">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">运行时刻</label>
                          <input 
                            type="time" 
                            className="h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-bold outline-none focus:border-blue-500 w-full"
                            value={timeOfDay}
                            onChange={(e) => setTimeOfDay(e.target.value)}
                          />
                       </div>
                    )}
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
               <button onClick={() => setIsModalOpen(false)} className="px-5 h-10 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  取消
               </button>
               <button onClick={handleSaveBot} className="px-6 h-10 bg-blue-600 text-white rounded-xl text-sm font-black tracking-wide hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">
                  保存机器人
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationRobots;