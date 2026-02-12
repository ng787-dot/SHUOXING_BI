import React, { useState } from 'react';
import { Plus, Link2, Edit3, X, Save, Smartphone, Key, User, Hash, ToggleLeft, ToggleRight } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { INITIAL_APP_DATA, SYSTEM_CHANNELS } from '../constants';
import { AppData } from '../types';

const AppManagement = () => {
  // Main Data State
  const [data, setData] = useState<AppData[]>(INITIAL_APP_DATA);
  const [filters, setFilters] = useState({ media: [] as string[], status: '' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppData | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<AppData>>({
    name: '',
    media: '',
    account: '',
    appId: '',
    appSecret: '',
    status: '开启'
  });

  const handleQuery = () => {
    // In a real app, this would query the backend. 
    // Here we rely on the derived filteredData below for rendering, 
    // but we can trigger a re-render or reset pagination if needed.
    // Since 'data' is local state, filtering is done on render.
  };

  const filteredData = data.filter(item => {
    if (filters.media.length > 0 && !filters.media.includes(item.media)) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ 
      name: '', 
      media: '', 
      account: '', 
      appId: '', 
      appSecret: '', 
      status: '开启' // Default status for new items
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AppData) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.media) {
      alert("请填写应用名称和媒体渠道");
      return;
    }

    const now = new Date().toLocaleString();
    const currentUser = '邓文豪'; // Mock current user

    if (editingItem) {
      // Edit Mode
      const updatedList = data.map(item => item.id === editingItem.id ? {
        ...item,
        ...formData,
        updater: currentUser,
        updateTime: now
      } as AppData : item);
      setData(updatedList);
    } else {
      // Create Mode
      const newItem: AppData = {
        id: Math.max(...data.map(d => d.id), 0) + 1,
        name: formData.name!,
        media: formData.media!,
        account: formData.account || '',
        appId: formData.appId || '',
        appSecret: formData.appSecret || '',
        creator: currentUser,
        createTime: now,
        status: '开启', // New apps default to Open per requirements (implied)
        updater: currentUser,
        updateTime: now
      };
      setData([newItem, ...data]); // Add to top
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <MultiSelectDropdown 
            label="媒体多选" 
            options={[...SYSTEM_CHANNELS, 'TikTok', 'Applovin', 'Unity']} 
            selected={filters.media} 
            onToggle={opt=>setFilters(prev=>({...prev, media: prev.media.includes(opt)?prev.media.filter(x=>x!==opt):[...prev.media, opt]}))} 
            placeholder="选择媒体" 
          />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">状态筛选</label>
            <select className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm font-bold shadow-sm outline-none" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
              <option value="">全部状态</option>
              <option value="开启">开启</option>
              <option value="关闭">关闭</option>
            </select>
          </div>
          <div className="flex gap-2 h-10">
            <button onClick={()=>{setFilters({media: [], status: ''});}} className="flex-1 font-bold bg-slate-100 rounded-lg hover:bg-slate-200">重置</button>
            <button onClick={handleQuery} className="flex-[1.5] font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all">查询</button>
          </div>
        </div>
      </section>

      <div className="flex justify-start">
        <button 
          onClick={handleOpenCreate} 
          className="h-11 px-8 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-slate-800 shadow-xl flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18}/> 新增应用授权
        </button>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1600px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black border-b h-14">
                <th className="px-4 py-5 w-20">序号</th><th className="px-4">应用名称</th><th className="px-4">媒体</th><th className="px-4">开发者账户</th><th className="px-4">应用ID</th><th className="px-4">应用密钥</th><th className="px-4 text-center">授权</th><th className="px-4">创建人</th><th className="px-4">创建时间</th><th className="px-4 text-center">状态</th><th className="px-4">更新人</th><th className="px-4">更新时间</th><th className="px-4 text-center sticky right-0 bg-white/90 border-l">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/10 h-16 transition-colors">
                  <td className="px-4 text-xs font-black text-slate-400 font-mono tracking-widest">{idx + 1}</td>
                  <td className="px-4 text-sm font-black text-slate-800 uppercase">{item.name}</td>
                  <td className="px-4"><span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-600">{item.media}</span></td>
                  <td className="px-4 text-xs font-bold text-slate-500">{item.account || '-'}</td>
                  <td className="px-4 text-xs font-mono text-slate-400 uppercase">{item.appId || '-'}</td>
                  <td className="px-4 text-xs font-mono text-slate-400 uppercase">{item.appSecret ? '******' : '-'}</td>
                  <td className="px-4 text-center">
                    <button className="h-8 px-4 bg-white border border-blue-200 text-blue-600 rounded-full text-[10px] font-black transition-all hover:bg-blue-50 shadow-sm flex items-center gap-1.5 mx-auto">
                      <Link2 size={12}/> 授权
                    </button>
                  </td>
                  <td className="px-4 text-xs font-bold text-slate-700">{item.creator}</td>
                  <td className="px-4 text-[10px] text-slate-400">{item.createTime}</td>
                  <td className="px-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${item.status === '开启' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === '开启' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      <span className={`text-[10px] font-black uppercase ${item.status === '开启' ? 'text-emerald-600' : 'text-slate-500'}`}>{item.status}</span>
                    </div>
                  </td>
                  <td className="px-4 text-xs font-bold text-slate-700">{item.updater}</td>
                  <td className="px-4 text-[10px] text-slate-400 font-mono">{item.updateTime}</td>
                  <td className="px-4 text-center sticky right-0 bg-white border-l h-16">
                    <button onClick={() => handleOpenEdit(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit3 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={13} className="text-center py-10 text-slate-300">No Apps Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-blue-600" />
                <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">{editingItem ? '编辑应用授权' : '新增应用授权'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>

            <div className="p-8 space-y-6 bg-white">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">应用名称 (App Name)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="请输入应用名称"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">媒体渠道 (Media)</label>
                <select 
                  value={formData.media}
                  onChange={e => setFormData({...formData, media: e.target.value})}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">请选择媒体</option>
                  {[...SYSTEM_CHANNELS, 'TikTok', 'Applovin', 'Unity', 'IronSource'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><User size={10}/> 开发者账户 (Account)</label>
                <input 
                  type="text" 
                  value={formData.account}
                  onChange={e => setFormData({...formData, account: e.target.value})}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Account Email / ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Hash size={10}/> 应用 ID (App ID)</label>
                   <input 
                     type="text" 
                     value={formData.appId}
                     onChange={e => setFormData({...formData, appId: e.target.value})}
                     className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Key size={10}/> 应用密钥 (Secret)</label>
                   <input 
                     type="text" 
                     value={formData.appSecret}
                     onChange={e => setFormData({...formData, appSecret: e.target.value})}
                     className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                   />
                </div>
              </div>

              {/* Status Toggle - Only visible in Edit Mode */}
              {editingItem && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">授权状态 (Status)</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border cursor-pointer transition-all ${formData.status === '开启' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm ring-2 ring-emerald-500/10' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="status" className="hidden" checked={formData.status === '开启'} onChange={() => setFormData({...formData, status: '开启'})} />
                        <ToggleRight size={20} /> <span className="text-xs font-black">开启 (Active)</span>
                      </label>
                      <label className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border cursor-pointer transition-all ${formData.status === '关闭' ? 'bg-slate-100 text-slate-600 border-slate-300 shadow-inner' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="status" className="hidden" checked={formData.status === '关闭'} onChange={() => setFormData({...formData, status: '关闭'})} />
                        <ToggleLeft size={20} /> <span className="text-xs font-black">关闭 (Inactive)</span>
                      </label>
                   </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-end gap-3 items-center">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                <Save size={14} /> 保存授权
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppManagement;
