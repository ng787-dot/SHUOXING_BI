import React, { useState, useEffect } from 'react';
import { Plus, Edit3, X, Save, Trash2, Globe, Database } from 'lucide-react';
import { INITIAL_MEDIA_DATA } from '../constants';
import { Media } from '../types';

const MediaManagement = () => {
  const [data, setData] = useState<Media[]>(INITIAL_MEDIA_DATA);
  const [nameSearch, setNameSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Media | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Media>>({
    name: '',
    mappingField: '',
    import: false,
    cpi: false,
    type: '广告'
  });

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('media_data');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse media data", e);
      }
    }
  }, []);

  // Helper to update state and localStorage
  const updateMediaData = (newData: Media[]) => {
    setData(newData);
    localStorage.setItem('media_data', JSON.stringify(newData));
  };

  // Query Filter
  const filteredData = data.filter(i => 
    !nameSearch || i.name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', mappingField: '', import: false, cpi: false, type: '广告' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Media) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      alert("请输入媒体名称");
      return;
    }

    if (editingItem) {
      // Update
      const updated = data.map(d => d.id === editingItem.id ? { ...d, ...formData } as Media : d);
      updateMediaData(updated);
    } else {
      // Create
      const newItem: Media = {
        ...formData,
        id: Math.max(...data.map(d => d.id), 0) + 1,
      } as Media;
      updateMediaData([...data, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingItem && window.confirm(`确定删除媒体 "${editingItem.name}" 吗?`)) {
      updateMediaData(data.filter(d => d.id !== editingItem.id));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">媒体名称检索</label>
            <input 
              type="text" 
              placeholder="输入名称" 
              className="w-full h-11 px-4 bg-slate-50 border rounded-lg text-sm font-bold outline-none focus:border-blue-400 transition-colors" 
              value={nameSearch} 
              onChange={e => setNameSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 h-11">
            <button onClick={()=> {setNameSearch('');}} className="h-11 px-6 font-bold bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">重置</button>
            <button className="h-11 px-10 font-bold bg-blue-600 text-white rounded-lg shadow-md active:scale-95 transition-all hover:bg-blue-700">查询</button>
          </div>
        </div>
      </section>

      <div className="flex justify-start">
        <button 
          onClick={handleOpenAdd} 
          className="h-11 px-8 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-slate-800 shadow-xl flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18}/> 新增媒体
        </button>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black border-b h-14">
              <th className="px-8 w-24">序号</th>
              <th className="px-8">媒体名称</th>
              <th className="px-8">映射字段</th>
              <th className="px-8">导入花费</th>
              <th className="px-8">CPI设置</th>
              <th className="px-8 text-center">媒体类型</th>
              <th className="px-8 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item, idx) => (
              <tr key={item.id} className="hover:bg-blue-50/10 h-16 transition-colors group">
                <td className="px-8 text-xs font-black text-slate-400 font-mono tracking-widest">{idx + 1}</td>
                <td className="px-8 text-sm font-black text-slate-800 uppercase tracking-tight">{item.name}</td>
                <td className="px-8">
                  <div className="flex flex-wrap gap-1.5 py-3 max-w-md">
                    {item.mappingField ? item.mappingField.split(/[,，]/).map((field, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold border border-slate-200 shadow-sm">
                        {field.trim()}
                      </span>
                    )) : <span className="text-slate-300 text-xs">-</span>}
                  </div>
                </td>
                <td className="px-8">
                  <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase border ${item.import ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {item.import ? '支持' : '不支持'}
                  </span>
                </td>
                <td className="px-8">
                  <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase border ${item.cpi ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {item.cpi ? '支持' : '不支持'}
                  </span>
                </td>
                <td className="px-8 text-center">
                  <span className={`px-3 py-1 rounded-md text-[10px] font-black border ${item.type === '广告' ? 'bg-blue-50 text-blue-600 border-blue-100' : item.type === '自然量' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-8 text-center">
                  <button onClick={() => handleOpenEdit(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit3 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-bold">无数据</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-600" />
                <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">{editingItem ? '编辑媒体配置' : '新增媒体配置'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">媒体名称 (Name)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="例如: Facebook Ads"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Database size={10}/> 映射字段 (Database Key)</label>
                <input 
                  type="text" 
                  value={formData.mappingField}
                  onChange={e => setFormData({...formData, mappingField: e.target.value})}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-slate-600"
                  placeholder="例如: Facebook, Instagram, Unattributed (逗号分隔)"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">导入花费</label>
                   <select 
                     className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all bg-white"
                     value={formData.import ? "true" : "false"}
                     onChange={e => setFormData({...formData, import: e.target.value === "true"})}
                   >
                     <option value="true">支持 (Support)</option>
                     <option value="false">不支持 (Not Support)</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPI 设置</label>
                   <select 
                     className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all bg-white"
                     value={formData.cpi ? "true" : "false"}
                     onChange={e => setFormData({...formData, cpi: e.target.value === "true"})}
                   >
                     <option value="true">支持 (Support)</option>
                     <option value="false">不支持 (Not Support)</option>
                   </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">媒体类型</label>
                <div className="flex gap-2 pt-1">
                  <label className={`flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border cursor-pointer transition-all ${formData.type === '广告' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" className="hidden" checked={formData.type === '广告'} onChange={() => setFormData({...formData, type: '广告'})} />
                    <span className="text-[10px] font-black uppercase">广告</span>
                  </label>
                  <label className={`flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border cursor-pointer transition-all ${formData.type === '营销' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" className="hidden" checked={formData.type === '营销'} onChange={() => setFormData({...formData, type: '营销'})} />
                    <span className="text-[10px] font-black uppercase">营销</span>
                  </label>
                  <label className={`flex-1 h-10 flex items-center justify-center gap-1 rounded-lg border cursor-pointer transition-all ${formData.type === '自然量' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" className="hidden" checked={formData.type === '自然量'} onChange={() => setFormData({...formData, type: '自然量'})} />
                    <span className="text-[10px] font-black uppercase">自然量</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-between items-center">
              <div>
                {editingItem && (
                  <button onClick={handleDelete} className="text-xs font-black text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={14} /> 删除该媒体
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
                <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                  <Save size={14} /> 保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManagement;