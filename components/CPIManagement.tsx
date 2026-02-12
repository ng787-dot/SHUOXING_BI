import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, Check, Edit3, X, Save } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { INITIAL_CPI_DATA, PROJECTS, SYSTEM_CHANNELS, REGIONS, INITIAL_MEDIA_DATA } from '../constants';
import { CPIData, Media } from '../types';

const CPIManagement = () => {
  const [data, setData] = useState<CPIData[]>(INITIAL_CPI_DATA);
  const [filteredData, setFilteredData] = useState<CPIData[]>(INITIAL_CPI_DATA);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CPIData | null>(null);
  const [formData, setFormData] = useState<Partial<CPIData>>({
    project: '', game: '', media: '', region: '', price: 0, currency: 'USD', startDate: '', endDate: ''
  });
  
  // 1. Change filter state to support arrays for multi-select
  const [filters, setFilters] = useState({ 
    project: [] as string[], 
    game: [] as string[], 
    media: [] as string[], 
    region: [] as string[] 
  });

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

  // Filter available media for CPI Modal (must support CPI)
  const cpiMediaOptions = useMemo(() => {
    // Filter media where cpi is true, then map to names
    // Also include any System Channels that are appropriate or rely on the configuration
    return mediaList.filter(m => m.cpi).map(m => m.name);
  }, [mediaList]);

  // Combined media options for filtering (All)
  const allMediaOptions = useMemo(() => {
      const names = mediaList.map(m => m.name);
      return Array.from(new Set([...SYSTEM_CHANNELS, ...names]));
  }, [mediaList]);


  // 2. File Input Ref for Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuery = () => {
    let result = [...data];
    if (filters.project.length > 0) result = result.filter(i => filters.project.includes(i.project));
    if (filters.game.length > 0) result = result.filter(i => filters.game.includes(i.game));
    if (filters.media.length > 0) result = result.filter(i => filters.media.includes(i.media));
    if (filters.region.length > 0) result = result.filter(i => filters.region.includes(i.region));
    setFilteredData(result);
    setSelectedIds([]); // Clear selection on query
  };

  const handleReset = () => {
    setFilters({ project: [], game: [], media: [], region: [] });
    setFilteredData(data);
    setSelectedIds([]);
  };

  // 3. Upload Handlers
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert("上传的格式不对，录入失败 (仅支持 .csv, .xlsx, .xls)。");
      return;
    }

    // Mock success feedback
    alert(`文件 "${file.name}" 上传成功，数据已进入处理队列。`);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "\ufeff游戏名称,媒体,地区,单价,货币,开始日期,结束日期\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'CPI_Import_Template.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // --- Modal Logic (Create & Edit) ---
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      project: '',
      game: '',
      media: '',
      region: '',
      price: 1.0,
      currency: 'USD',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CPIData) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("确定要删除这条配置吗？")) {
      const newData = data.filter(i => i.id !== id);
      setData(newData);
      setFilteredData(filteredData.filter(i => i.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      setIsModalOpen(false); // Close modal after delete
    }
  };

  const handleSave = () => {
    if (!formData.project || !formData.game || !formData.media || !formData.region || !formData.startDate || !formData.price) {
      alert("请填写完整必填信息 (项目, 游戏, 媒体, 地区, 单价, 开始日期)");
      return;
    }

    if (editingItem) {
      // Update Mode
      const updatedList = data.map(item => item.id === editingItem.id ? { ...item, ...formData } as CPIData : item);
      setData(updatedList);
      // Update filtered view as well
      setFilteredData(filteredData.map(item => item.id === editingItem.id ? { ...item, ...formData } as CPIData : item));
    } else {
      // Create Mode
      const newItem: CPIData = {
        id: Math.max(...data.map(d => d.id), 0) + 1,
        project: formData.project!,
        game: formData.game!,
        media: formData.media!,
        region: formData.region!,
        price: Number(formData.price),
        currency: formData.currency || 'USD',
        startDate: formData.startDate!,
        endDate: formData.endDate || '-',
        operator: '邓文豪'
      };
      const newData = [newItem, ...data];
      setData(newData);
      setFilteredData([newItem, ...filteredData]);
    }
    setIsModalOpen(false);
  };

  // Filter options logic
  const filterGameOptions = useMemo(() => {
    if (filters.project.length === 0) return [];
    return filters.project.flatMap(p => [`${p}-Android`, `${p}-iOS`]);
  }, [filters.project]);

  // Modal options logic (Single select drill-down)
  const modalGameOptions = useMemo(() => {
    if (!formData.project) return [];
    return [`${formData.project}-Android`, `${formData.project}-iOS`];
  }, [formData.project]);


  // Helper to handle project toggle and cleanup games in Filter
  const handleProjectToggle = (opt: string) => {
    setFilters(prev => {
      const newProjects = prev.project.includes(opt) 
        ? prev.project.filter(x => x !== opt) 
        : [...prev.project, opt];
      
      const validGames = newProjects.flatMap(p => [`${p}-Android`, `${p}-iOS`]);
      const newGames = prev.game.filter(g => validGames.includes(g));

      return { ...prev, project: newProjects, game: newGames };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <MultiSelectDropdown 
            label="项目" 
            options={PROJECTS} 
            selected={filters.project} 
            onToggle={handleProjectToggle} 
            placeholder="全部项目" 
          />
          <MultiSelectDropdown 
            label="游戏名称" 
            options={filterGameOptions} 
            selected={filters.game} 
            onToggle={(opt) => setFilters(prev => ({...prev, game: prev.game.includes(opt) ? prev.game.filter(x => x !== opt) : [...prev.game, opt]}))} 
            placeholder={filters.project.length > 0 ? "全部游戏" : "请先选择项目"} 
          />
          <MultiSelectDropdown 
            label="媒体" 
            options={allMediaOptions} 
            selected={filters.media} 
            onToggle={(opt) => setFilters(prev => ({...prev, media: prev.media.includes(opt) ? prev.media.filter(x => x !== opt) : [...prev.media, opt]}))} 
            placeholder="全部媒体" 
            searchable
          />
          <MultiSelectDropdown 
            label="地区" 
            options={REGIONS} 
            selected={filters.region} 
            onToggle={(opt) => setFilters(prev => ({...prev, region: prev.region.includes(opt) ? prev.region.filter(x => x !== opt) : [...prev.region, opt]}))} 
            placeholder="全部地区" 
            searchable
          />
          <div className="flex gap-2 h-10">
            <button onClick={handleReset} className="flex-1 font-bold bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">重置</button>
            <button onClick={handleQuery} className="flex-[1.5] font-bold bg-blue-600 text-white rounded-lg shadow-md active:scale-95 transition-all hover:bg-blue-700">查询</button>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={handleOpenCreate} className="h-10 px-6 bg-blue-600 text-white text-sm font-black rounded-xl shadow-md active:scale-95 flex items-center gap-2 transition-all hover:bg-blue-700">
            <Plus size={18}/> 新增 CPI
          </button>
          <button 
            disabled={selectedIds.length === 0} 
            onClick={() => {setData(data.filter(i=>!selectedIds.includes(i.id))); setFilteredData(filteredData.filter(i=>!selectedIds.includes(i.id))); setSelectedIds([]);}} 
            className={`h-10 px-5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${selectedIds.length > 0 ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm hover:bg-red-100' : 'bg-slate-100 text-slate-300'}`}
          >
            <Trash2 size={16}/> 批量删除
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="h-9 px-4 text-xs font-bold text-slate-600 bg-white border rounded-lg flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50">
            <Download size={14}/> 下载模板
          </button>
          <button onClick={handleUploadClick} className="h-9 px-4 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-md flex items-center gap-2 active:scale-95 transition-all hover:bg-emerald-700">
            <Upload size={14}/> 批量上传
          </button>
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shadow-xl shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black border-b h-14">
                <th className="px-5 w-12 text-center sticky left-0 bg-slate-50 z-10 shadow-sm"><div className="w-4 h-4 border rounded mx-auto cursor-pointer" onClick={() => setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i=>i.id))}></div></th>
                <th className="px-5 w-16 text-center font-mono">序号</th><th className="px-5">项目</th><th className="px-5">游戏名称</th><th className="px-5">媒体</th><th className="px-5 text-center">地区</th><th className="px-5 text-center font-black">单价</th><th className="px-5 text-center">货币</th><th className="px-5 text-center">开始日期</th><th className="px-5 text-center">结束日期</th><th className="px-5 text-center sticky right-0 bg-slate-50/90 border-l shadow-sm">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="h-14 hover:bg-blue-50/20 group transition-colors">
                  <td className="px-5 text-center sticky left-0 bg-white shadow-sm"><div className={`w-4 h-4 border rounded mx-auto cursor-pointer transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white'}`} onClick={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i=>i!==item.id) : [...prev, item.id])}>{selectedIds.includes(item.id) && <Check size={10} className="mx-auto" />}</div></td>
                  <td className="px-5 text-xs font-mono font-bold text-slate-400 text-center tracking-widest">{idx + 1}</td>
                  <td className="px-5 text-sm font-black text-slate-800 uppercase tracking-tight">{item.project}</td><td className="px-5 text-sm font-bold text-slate-600 uppercase">{item.game}</td>
                  <td className="px-5"><span className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100 tracking-wider font-mono">{item.media}</span></td>
                  <td className="px-5 text-center font-black text-[11px] font-mono">{item.region}</td>
                  <td className="px-5 text-center text-blue-600 font-black text-sm font-mono tracking-tighter">${item.price}</td><td className="px-5 text-center text-[10px] font-black text-slate-400">{item.currency}</td>
                  <td className="px-5 text-[11px] font-bold text-slate-500 text-center tracking-tighter">{item.startDate}</td><td className="px-5 text-[11px] font-bold text-slate-400 text-center tracking-tighter">{item.endDate}</td>
                  <td className="px-5 text-center sticky right-0 bg-white border-l shadow-sm group-hover:bg-blue-50 transition-colors">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all"><Edit3 size={15}/></button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={11} className="text-center py-10 text-slate-300 font-bold">无符合条件的数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-sm">{editingItem ? '编辑 CPI 配置' : '新增 CPI 投放配置'}</h3>
              <button onClick={()=>setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">项目</label>
                  <select 
                    value={formData.project} 
                    onChange={e => setFormData({...formData, project: e.target.value, game: ''})} 
                    className="w-full h-11 px-3 border rounded-xl font-bold text-sm bg-white"
                  >
                    <option value="">请选择项目</option>
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">游戏名称</label>
                  <select 
                    value={formData.game} 
                    onChange={e => setFormData({...formData, game: e.target.value})} 
                    className="w-full h-11 px-3 border rounded-xl font-bold text-sm bg-white"
                    disabled={!formData.project}
                  >
                    <option value="">请选择游戏</option>
                    {modalGameOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">投放媒体</label>
                  <select value={formData.media} onChange={e => setFormData({...formData, media: e.target.value})} className="w-full h-11 px-3 border rounded-xl font-bold text-sm bg-white">
                    <option value="">请选择媒体</option>
                    {cpiMediaOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">投放地区</label>
                  <select value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full h-11 px-3 border rounded-xl font-bold text-sm bg-white">
                    <option value="">请选择地区</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">单价设置 (CPI)</label>
                  <input type="number" step="0.01" className="w-full h-11 px-3 border rounded-xl font-bold text-sm" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">货币类型</label>
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full h-11 px-3 border rounded-xl font-bold text-sm bg-white">
                    <option value="USD">USD</option><option value="CNY">CNY</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">开始日期</label>
                  <input type="date" className="w-full h-11 px-3 border rounded-xl text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">结束日期 (可选)</label>
                  <input type="date" className="w-full h-11 px-3 border rounded-xl text-sm" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t flex justify-between items-center">
              <div>
                {editingItem && (
                  <button onClick={() => handleDelete(editingItem.id)} className="text-xs font-black text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={14} /> 删除该配置
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-400">取消</button>
                <button onClick={handleSave} className="px-10 py-2.5 bg-slate-900 text-white font-black rounded-xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                  <Save size={14}/> {editingItem ? '保存修改' : '提交配置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CPIManagement;