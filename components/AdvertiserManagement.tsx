import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { INITIAL_AD_DATA } from '../constants';

const AdvertiserManagement = () => {
  const [filters, setFilters] = useState({ name: '', account: '', media: [] as string[], status: '' });
  const [filteredData, setFilteredData] = useState(INITIAL_AD_DATA);
  const handleQuery = () => {
    let result = [...INITIAL_AD_DATA];
    if (filters.name) result = result.filter(i => i.name.includes(filters.name));
    if (filters.account) result = result.filter(i => i.account.includes(filters.account));
    if (filters.media.length > 0) result = result.filter(i => filters.media.includes(i.media));
    if (filters.status) result = result.filter(i => i.status === filters.status);
    setFilteredData(result);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-1.5 flex flex-col flex-1"><label className="text-[11px] font-bold text-slate-500 uppercase pl-1">广告主名称</label><input type="text" placeholder="输入名称检索" className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm" value={filters.name} onChange={e=>setFilters({...filters, name:e.target.value})} /></div>
          <div className="space-y-1.5 flex flex-col flex-1"><label className="text-[11px] font-bold text-slate-500 uppercase pl-1">广告主账号</label><input type="text" placeholder="输入账号检索" className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm" value={filters.account} onChange={e=>setFilters({...filters, account:e.target.value})} /></div>
          <MultiSelectDropdown label="媒体多选" options={['Facebook', 'Google Ads', 'TikTok']} selected={filters.media} onToggle={opt=>setFilters(prev=>({...prev, media: prev.media.includes(opt)?prev.media.filter(x=>x!==opt):[...prev.media, opt]}))} placeholder="过滤媒体" />
          <div className="space-y-1.5 flex flex-col flex-1"><label className="text-[11px] font-bold text-slate-500 uppercase pl-1">当前状态</label><select className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm font-bold shadow-sm" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}><option value="">全部状态</option><option value="可用">可用</option><option value="不可用">不可用</option></select></div>
          <div className="flex gap-2 h-10"><button onClick={()=>setFilteredData(INITIAL_AD_DATA)} className="flex-1 font-bold bg-slate-100 rounded-lg">重置</button><button onClick={handleQuery} className="flex-[1.5] font-bold bg-blue-600 text-white rounded-lg shadow-md">查询</button></div>
        </div>
      </section>
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black border-b h-14">
              <th className="px-8 w-20">序号</th><th className="px-8">广告主名称</th><th className="px-8">广告主账户ID</th><th className="px-8">媒体</th><th className="px-8 text-center">状态</th><th className="px-8">最后更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredData.map((item, idx) => (
              <tr key={item.id} className="hover:bg-blue-50/20 h-16 transition-colors">
                <td className="px-8 text-xs font-black text-slate-400 font-mono tracking-widest">{idx + 1}</td><td className="px-8 text-sm font-black text-slate-800 tracking-tight">{item.name}</td><td className="px-8 text-xs font-mono text-slate-500 uppercase">{item.account}</td>
                <td className="px-8"><span className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 tracking-wider">{item.media}</span></td>
                <td className="px-8 text-center"><div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{item.status}</span></div></td>
                <td className="px-8 text-[10px] text-slate-400 font-bold h-16 pt-6"><Clock className="inline mr-1" size={10}/> {item.updateTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdvertiserManagement;