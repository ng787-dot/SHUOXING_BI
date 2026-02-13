import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Check, Edit3, Upload, X, Save, AlertCircle } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { INITIAL_COST_DATA, PROJECTS, SYSTEM_CHANNELS, REGIONS, INITIAL_MEDIA_DATA, COUNTRY_FULL_DATA } from '../constants';
import { CostRecord, Media } from '../types';

const CostManagement = () => {
  const [data, setData] = useState<CostRecord[]>(INITIAL_COST_DATA);
  const [filteredData, setFilteredData] = useState<CostRecord[]>(INITIAL_COST_DATA);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState({ 
    startDate: '', 
    endDate: '', 
    project: '', 
    games: [] as string[], 
    media: [] as string[],
    regions: [] as string[]
  });

  // Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Create State
  const [newCostRows, setNewCostRows] = useState<Partial<CostRecord>[]>([
    { date: new Date().toISOString().split('T')[0], currency: 'USD', operator: '邓文豪', isSystem: false }
  ]);

  // Edit State
  const [editingItem, setEditingItem] = useState<CostRecord | null>(null);

  // Load Media Data for dropdowns
  const [mediaList, setMediaList] = useState<Media[]>(INITIAL_MEDIA_DATA);
  
  useEffect(() => {
    const stored = localStorage.getItem('media_data');
    if (stored) {
      try {
        setMediaList(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load media data", e);
      }
    }
  }, []);

  // Filter available media for "Add Cost" (must support import)
  const importableMediaOptions = useMemo(() => {
    return mediaList.filter(m => m.import).map(m => m.name);
  }, [mediaList]);

  // Filter available media for Query Filter (show all)
  const allMediaOptions = useMemo(() => {
    const names = mediaList.map(m => m.name);
    return Array.from(new Set([...SYSTEM_CHANNELS, 'ASA', ...names]));
  }, [mediaList]);

  // All Regions options
  const allRegionOptions = useMemo(() => {
    return COUNTRY_FULL_DATA.map(c => c.iso2);
  }, []);

  const gameOptions = useMemo(() => filters.project ? [`${filters.project}-Android`, `${filters.project}-iOS`, `${filters.project}-Huawei`] : [], [filters.project]);

  // Calculate Total Cost
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0).toFixed(2);
  }, [filteredData]);

  const handleQuery = () => {
    let result = [...data];
    if (filters.startDate) result = result.filter(i => i.date >= filters.startDate);
    if (filters.endDate) result = result.filter(i => i.date <= filters.endDate);
    if (filters.project) result = result.filter(i => i.projectName === (filters.project === 'DawnGod' ? 'Dawn God' : 'Fruit'));
    if (filters.games.length > 0) result = result.filter(i => filters.games.includes(i.gameName));
    if (filters.media.length > 0) result = result.filter(i => filters.media.includes(i.media));
    if (filters.regions.length > 0) result = result.filter(i => filters.regions.includes(i.region));
    setFilteredData(result); 
    setSelectedIds([]);
  };

  const handleDownload = () => {
    const csv = "\ufeff日期,项目名称,游戏名称,媒体,地区,广告系列,广告组,广告,花费金额,货币\n";
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = '花费模板.csv'; 
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Upload Handling
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      alert("上传的格式不对，录入失败。");
      return;
    }
    alert(`文件 "${file.name}" 上传成功，数据已进入处理队列。`);
  };

  // Create Logic
  const handleAddRow = () => {
    setNewCostRows([...newCostRows, { date: new Date().toISOString().split('T')[0], currency: 'USD', operator: '邓文豪', isSystem: false }]);
  };

  const handleRemoveRow = (index: number) => {
    if (newCostRows.length > 1) {
      setNewCostRows(newCostRows.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index: number, field: keyof CostRecord, value: any) => {
    const updated = [...newCostRows];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill game if project changes (Mock logic)
    if (field === 'projectName') {
       updated[index].gameName = ''; // Reset game
    }
    setNewCostRows(updated);
  };

  const handleSubmitCreate = () => {
    // Basic validation
    if (newCostRows.some(r => !r.projectName || !r.gameName || !r.media || !r.cost)) {
        alert("请完善所有必填字段 (项目, 游戏, 媒体, 金额)");
        return;
    }

    const newRecords = newCostRows.map((row, idx) => ({
        ...row,
        id: Math.max(...data.map(d => d.id), 0) + 1 + idx,
        cost: Number(row.cost).toFixed(2),
        region: row.region || 'Global', // Default region if missed
        campaign: row.campaign || '-',
        adGroup: row.adGroup || '-',
        ad: row.ad || '-'
    } as CostRecord));

    const updatedData = [...newRecords, ...data].sort((a,b) => b.date.localeCompare(a.date)); // Newest first
    setData(updatedData);
    setFilteredData(updatedData); // Reset view to show new data
    setIsCreateModalOpen(false);
    setNewCostRows([{ date: new Date().toISOString().split('T')[0], currency: 'USD', operator: '邓文豪', isSystem: false }]);
  };

  // Edit Logic
  const openEditModal = (item: CostRecord) => {
    setEditingItem({...item});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const updatedData = data.map(d => d.id === editingItem.id ? editingItem : d);
    setData(updatedData);
    
    // Update filtered data as well to reflect changes immediately
    const updatedFiltered = filteredData.map(d => d.id === editingItem.id ? editingItem : d);
    setFilteredData(updatedFiltered);
    
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteEdit = () => {
    if (!editingItem) return;
    if (window.confirm("确认删除这条花费记录吗？")) {
        const updatedData = data.filter(d => d.id !== editingItem.id);
        setData(updatedData);
        setFilteredData(filteredData.filter(d => d.id !== editingItem.id));
        setIsEditModalOpen(false);
        setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
          <div className="space-y-1 flex flex-col xl:col-span-1"><label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">时间范围</label>
            <div className="grid grid-cols-2 gap-2 h-10"><input type="date" className="w-full px-2 bg-slate-50 border rounded-lg text-xs outline-none" value={filters.startDate} onChange={e=>setFilters({...filters, startDate:e.target.value})} /><input type="date" className="w-full px-2 bg-slate-50 border rounded-lg text-xs outline-none" value={filters.endDate} onChange={e=>setFilters({...filters, endDate:e.target.value})} /></div>
          </div>
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">项目</label>
            <select className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm font-bold shadow-sm outline-none" value={filters.project} onChange={e=>setFilters({...filters, project: e.target.value, games: []})}><option value="">全部项目</option>{PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <MultiSelectDropdown label="游戏名称" options={gameOptions} selected={filters.games} onToggle={opt=>setFilters(prev=>({...prev, games: prev.games.includes(opt)?prev.games.filter(x=>x!==opt):[...prev.games, opt]}))} placeholder={filters.project ? "选择名称" : "先选项目"} />
          <MultiSelectDropdown label="媒体多选" options={allMediaOptions} selected={filters.media} onToggle={opt=>setFilters(prev=>({...prev, media: prev.media.includes(opt)?prev.media.filter(x=>x!==opt):[...prev.media, opt]}))} placeholder="选择媒体" />
          <MultiSelectDropdown label="国家/地区" options={allRegionOptions} selected={filters.regions} onToggle={opt=>setFilters(prev=>({...prev, regions: prev.regions.includes(opt)?prev.regions.filter(x=>x!==opt):[...prev.regions, opt]}))} placeholder="选择地区" searchable />
          <div className="flex gap-2 h-10"><button onClick={()=>{setFilters({startDate:'', endDate:'', project:'', games:[], media:[], regions: []}); setFilteredData(data);}} className="flex-1 font-bold bg-slate-100 rounded-lg hover:bg-slate-200">重置</button><button onClick={handleQuery} className="flex-[1.5] font-bold bg-blue-600 text-white rounded-lg shadow-md active:scale-95 transition-all hover:bg-blue-700">查询</button></div>
        </div>
      </section>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
            <button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-6 bg-blue-600 text-white text-sm font-black rounded-xl shadow-md flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={18}/> 新增花费</button>
            <button disabled={selectedIds.length === 0} onClick={()=>{setData(data.filter(i=>!selectedIds.includes(i.id))); setFilteredData(filteredData.filter(i=>!selectedIds.includes(i.id))); setSelectedIds([]);}} className={`h-10 px-5 text-sm font-bold rounded-xl flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-100 text-slate-300'}`}><Trash2 size={16}/> 批量删除 ({selectedIds.length})</button>
        </div>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="h-9 px-4 text-xs font-bold text-slate-600 bg-white border rounded-lg flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50"><Download size={14}/> 下载模板</button>
            <button onClick={handleUploadClick} className="h-9 px-4 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-md flex items-center gap-2 active:scale-95 transition-all hover:bg-emerald-700">
                <Upload size={14}/> 批量上传
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1 pb-4">
          <table className="w-full text-left border-collapse min-w-[1600px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[9px] uppercase tracking-widest font-black border-b h-14">
                <th className="px-5 w-12 text-center sticky left-0 bg-slate-50 z-20"><div className="w-4 h-4 border rounded mx-auto cursor-pointer" onClick={() => {const pageIds = filteredData.slice(0, 20).filter(i=>!i.isSystem).map(i=>i.id); setSelectedIds(selectedIds.length === pageIds.length ? [] : pageIds);}}></div></th>
                <th className="px-4">日期</th>
                <th className="px-4">项目</th>
                <th className="px-4">游戏名称</th>
                <th className="px-4">媒体</th>
                {/* New Columns */}
                <th className="px-4">国家</th>
                <th className="px-4">广告系列</th>
                <th className="px-4">广告组</th>
                <th className="px-4">广告</th>
                {/* Sticky Right Columns */}
                <th className="px-5 text-right sticky right-[200px] bg-slate-50 z-20 border-l border-slate-100 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]" style={{width: '120px'}}>金额</th>
                <th className="px-5 sticky right-[100px] bg-slate-50 z-20 border-l border-slate-100" style={{width: '100px'}}>操作者</th>
                <th className="px-5 text-center sticky right-0 bg-slate-50/90 z-20 border-l border-slate-100" style={{width: '100px'}}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Summary Row */}
              {filteredData.length > 0 && (
                <tr className="bg-yellow-50 border-b border-yellow-200 font-bold shadow-sm sticky top-0 z-30">
                  <td className="px-5 text-center sticky left-0 bg-yellow-50 border-r border-transparent z-30"></td>
                  <td className="px-4 text-xs text-yellow-700 font-black tracking-wider uppercase">汇总</td>
                  <td className="px-4"></td><td className="px-4"></td><td className="px-4"></td><td className="px-4"></td><td className="px-4"></td><td className="px-4"></td><td className="px-4"></td>
                  <td className="px-5 text-xs text-yellow-700 font-black text-right sticky right-[200px] bg-yellow-50 z-30 border-l border-yellow-200" style={{width: '120px'}}>${totalAmount}</td>
                  <td className="px-5 sticky right-[100px] bg-yellow-50 z-30 border-l border-yellow-200" style={{width: '100px'}}></td>
                  <td className="px-5 sticky right-0 bg-yellow-50 z-30 border-l border-yellow-200" style={{width: '100px'}}></td>
                </tr>
              )}
              {filteredData.slice(0, 50).map(item => (
                <tr key={item.id} className={`h-14 transition-colors group ${item.isSystem ? 'bg-slate-50/30' : 'hover:bg-blue-50/10'}`}>
                  <td className="px-5 text-center sticky left-0 bg-white z-10">{!item.isSystem && <div className={`w-4 h-4 border rounded mx-auto cursor-pointer transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-600 border-blue-600' : 'bg-white'}`} onClick={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i=>i!==item.id) : [...prev, item.id])}>{selectedIds.includes(item.id) && <Check className="text-white mx-auto" size={10}/>}</div>}</td>
                  <td className="px-4 text-xs font-mono whitespace-nowrap">{item.date}</td>
                  <td className="px-4 text-xs font-black uppercase text-slate-800 whitespace-nowrap">{item.projectName}</td>
                  <td className="px-4 text-xs font-bold text-slate-500 whitespace-nowrap">{item.gameName}</td>
                  <td className="px-4 whitespace-nowrap"><span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${item.media === 'ASA' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>{item.media}</span></td>
                  
                  {/* New Columns Data */}
                  <td className="px-4 text-xs font-mono font-bold text-slate-600">{item.region}</td>
                  <td className="px-4 text-xs text-slate-400">{item.campaign || '-'}</td>
                  <td className="px-4 text-xs text-slate-400">{item.adGroup || '-'}</td>
                  <td className="px-4 text-xs text-slate-400">{item.ad || '-'}</td>

                  {/* Sticky Data Columns */}
                  <td className={`px-5 text-xs font-black text-blue-600 text-right sticky right-[200px] z-10 border-l border-slate-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] transition-colors ${item.isSystem ? 'bg-slate-50/30' : 'bg-white group-hover:bg-blue-50/10'}`} style={{width: '120px'}}>${item.cost}</td>
                  <td className={`px-5 text-[10px] font-bold text-slate-400 italic sticky right-[100px] z-10 border-l border-slate-50 transition-colors ${item.isSystem ? 'bg-slate-50/30' : 'bg-white group-hover:bg-blue-50/10'}`} style={{width: '100px'}}>{item.operator}</td>
                  <td className={`px-5 text-center sticky right-0 z-10 border-l border-slate-50 transition-colors ${item.isSystem ? 'bg-slate-50/30' : 'bg-white group-hover:bg-blue-50/10'}`} style={{width: '100px'}}>
                    <button disabled={item.isSystem} onClick={() => openEditModal(item)} className={`p-2 rounded-lg transition-colors ${item.isSystem ? 'text-slate-200 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'}`}><Edit3 size={15}/></button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan={12} className="text-center py-20 text-slate-300">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Create Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide flex items-center gap-2"><Plus size={18} className="text-blue-600"/> 批量录入花费</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
               <table className="w-full text-left border-collapse min-w-[1400px]">
                 <thead>
                   <tr className="text-[10px] font-black uppercase text-slate-400 border-b">
                     <th className="px-3 py-2 w-12">#</th>
                     <th className="px-3 py-2 w-28">日期</th>
                     <th className="px-3 py-2 w-28">项目</th>
                     <th className="px-3 py-2 w-36">游戏名称</th>
                     <th className="px-3 py-2 w-32">媒体</th>
                     <th className="px-3 py-2 w-24">地区</th>
                     {/* New Headers */}
                     <th className="px-3 py-2 w-32">广告系列</th>
                     <th className="px-3 py-2 w-32">广告组</th>
                     <th className="px-3 py-2 w-32">广告</th>
                     
                     <th className="px-3 py-2 w-24">金额 (USD)</th>
                     <th className="px-3 py-2 w-16"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {newCostRows.map((row, idx) => {
                     const rowProject = row.projectName || '';
                     const rowGames = rowProject ? [`${rowProject}-Android`, `${rowProject}-iOS`, `${rowProject}-Huawei`] : [];
                     
                     return (
                       <tr key={idx} className="group hover:bg-blue-50/10">
                         <td className="px-3 py-3 text-xs font-mono text-slate-400 text-center">{idx+1}</td>
                         <td className="px-3 py-3"><input type="date" value={row.date} onChange={e => handleRowChange(idx, 'date', e.target.value)} className="w-full h-9 px-2 border rounded text-xs font-bold" /></td>
                         <td className="px-3 py-3">
                           <select value={row.projectName || ''} onChange={e => handleRowChange(idx, 'projectName', e.target.value)} className="w-full h-9 px-2 border rounded text-xs font-bold">
                             <option value="">选择项目</option>{PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                         </td>
                         <td className="px-3 py-3">
                           <select value={row.gameName || ''} onChange={e => handleRowChange(idx, 'gameName', e.target.value)} className="w-full h-9 px-2 border rounded text-xs font-bold" disabled={!row.projectName}>
                             <option value="">选择游戏</option>{rowGames.map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                         </td>
                         <td className="px-3 py-3">
                           <select value={row.media || ''} onChange={e => handleRowChange(idx, 'media', e.target.value)} className="w-full h-9 px-2 border rounded text-xs font-bold">
                             <option value="">选择媒体</option>
                             {importableMediaOptions.map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                         </td>
                         <td className="px-3 py-3">
                            <select value={row.region || ''} onChange={e => handleRowChange(idx, 'region', e.target.value)} className="w-full h-9 px-2 border rounded text-xs font-bold">
                              <option value="">Global/All</option>{allRegionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                         </td>
                         
                         {/* New Inputs for Campaign, Ad Group, Ad */}
                         <td className="px-3 py-3">
                           <input type="text" value={row.campaign || ''} onChange={e => handleRowChange(idx, 'campaign', e.target.value)} placeholder="Campaign" className="w-full h-9 px-2 border rounded text-xs font-bold" />
                         </td>
                         <td className="px-3 py-3">
                           <input type="text" value={row.adGroup || ''} onChange={e => handleRowChange(idx, 'adGroup', e.target.value)} placeholder="Ad Group" className="w-full h-9 px-2 border rounded text-xs font-bold" />
                         </td>
                         <td className="px-3 py-3">
                           <input type="text" value={row.ad || ''} onChange={e => handleRowChange(idx, 'ad', e.target.value)} placeholder="Ad Name/ID" className="w-full h-9 px-2 border rounded text-xs font-bold" />
                         </td>

                         <td className="px-3 py-3"><input type="number" step="0.01" value={row.cost || ''} onChange={e => handleRowChange(idx, 'cost', e.target.value)} placeholder="0.00" className="w-full h-9 px-2 border rounded text-xs font-bold" /></td>
                         <td className="px-3 py-3 text-center"><button onClick={() => handleRemoveRow(idx)} className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50"><X size={14}/></button></td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
               <div className="mt-4">
                 <button onClick={handleAddRow} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                   <Plus size={16}/> 添加一行 (Add Row)
                 </button>
               </div>
            </div>

            <div className="px-8 py-5 bg-white border-t flex justify-between items-center z-10">
               <div className="text-xs text-slate-400 font-bold">共 {newCostRows.length} 条记录待提交</div>
               <div className="flex gap-3">
                 <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
                 <button onClick={handleSubmitCreate} className="px-8 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                   <Save size={14} /> 提交录入
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-2"><Edit3 size={18} className="text-blue-600" /><h3 className="font-black text-slate-800 uppercase text-sm">编辑花费记录</h3></div>
               <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={20}/></button>
             </div>
             
             <div className="p-8 space-y-5 overflow-y-auto">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">日期</label>
                  <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">项目</label>
                     <select value={editingItem.projectName} onChange={e => setEditingItem({...editingItem, projectName: e.target.value, gameName: ''})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold bg-white">
                        {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">游戏名称</label>
                     <select value={editingItem.gameName} onChange={e => setEditingItem({...editingItem, gameName: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold bg-white" disabled={!editingItem.projectName}>
                        <option value="">选择游戏</option>
                        {(editingItem.projectName ? [`${editingItem.projectName}-Android`, `${editingItem.projectName}-iOS`, `${editingItem.projectName}-Huawei`] : []).map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">媒体</label>
                     <select value={editingItem.media} onChange={e => setEditingItem({...editingItem, media: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold bg-white">
                        {[...SYSTEM_CHANNELS, 'ASA', ...importableMediaOptions].filter((v,i,a) => a.indexOf(v)===i).map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">国家/地区</label>
                     <select value={editingItem.region} onChange={e => setEditingItem({...editingItem, region: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold bg-white">
                        {allRegionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>
               </div>
               
               {/* New Editing Fields for Campaign, AdGroup, Ad */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">广告系列 (Campaign)</label>
                  <input 
                    type="text" 
                    value={editingItem.campaign || ''} 
                    onChange={e => setEditingItem({...editingItem, campaign: e.target.value})} 
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                    placeholder="Campaign Name" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">广告组 (Ad Group)</label>
                     <input 
                       type="text" 
                       value={editingItem.adGroup || ''} 
                       onChange={e => setEditingItem({...editingItem, adGroup: e.target.value})} 
                       className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                       placeholder="Ad Group Name" 
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">广告 (Ad)</label>
                     <input 
                       type="text" 
                       value={editingItem.ad || ''} 
                       onChange={e => setEditingItem({...editingItem, ad: e.target.value})} 
                       className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                       placeholder="Ad Name / ID" 
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">金额 (USD)</label>
                  <input type="number" step="0.01" value={editingItem.cost} onChange={e => setEditingItem({...editingItem, cost: e.target.value})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold text-blue-600" />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">操作者 (不可修改)</label>
                  <div className="w-full h-10 px-3 border border-slate-100 bg-slate-50 rounded-lg text-sm font-bold text-slate-400 flex items-center select-none cursor-not-allowed">
                    {editingItem.operator} <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-slate-200 rounded text-slate-500">Read Only</span>
                  </div>
               </div>
             </div>

             <div className="px-8 py-5 bg-slate-50 border-t flex justify-between items-center">
               <button onClick={handleDeleteEdit} className="text-xs font-black text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={14} /> 删除记录
               </button>
               <div className="flex gap-3">
                 <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
                 <button onClick={handleSaveEdit} className="px-8 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                   <Save size={14} /> 保存更改
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostManagement;