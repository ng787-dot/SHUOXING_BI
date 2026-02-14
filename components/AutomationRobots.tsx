import React, { useState } from 'react';
import { Bot, MessageSquare, FileText, UploadCloud, Workflow, Plus, Settings, PlayCircle, MoreHorizontal } from 'lucide-react';

interface Robot {
  id: number;
  name: string;
  icon: any;
  color: string;
  status: 'running' | 'stopped' | 'error';
  lastRun: string;
}

const AutomationRobots = () => {
  const [robots, setRobots] = useState<Robot[]>([
    { id: 1, name: '微信数据机器人', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-50', status: 'running', lastRun: '10 mins ago' },
    { id: 2, name: '日报机器人', icon: FileText, color: 'text-blue-500 bg-blue-50', status: 'running', lastRun: '1 hour ago' },
    { id: 3, name: '传素材机器人', icon: UploadCloud, color: 'text-orange-500 bg-orange-50', status: 'stopped', lastRun: 'Yesterday' },
    { id: 4, name: '工作流自动化机器人', icon: Workflow, color: 'text-purple-500 bg-purple-50', status: 'running', lastRun: 'Just now' },
  ]);

  const handleAddRobot = () => {
    const name = prompt("请输入新机器人的名称:");
    if (name) {
      const newRobot: Robot = {
        id: Date.now(),
        name,
        icon: Bot,
        color: 'text-slate-500 bg-slate-50',
        status: 'stopped',
        lastRun: 'Never'
      };
      setRobots([...robots, newRobot]);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'running': return 'bg-emerald-400 animate-pulse';
          case 'error': return 'bg-red-500';
          default: return 'bg-slate-300';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight mb-2">自动化机器人中心</h2>
            <p className="text-slate-400 text-sm max-w-lg">
                管理和监控您的 RPA (Robotic Process Automation) 任务。此处集成了所有后台自动化流程，支持实时状态监控与手动触发。
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
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="配置">
                        <Settings size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="立即运行">
                        <PlayCircle size={16} />
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
    </div>
  );
};

export default AutomationRobots;