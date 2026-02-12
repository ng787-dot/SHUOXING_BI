import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, RotateCcw, Download, Upload, Edit3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Save, Trash2, AlertCircle, Layers, Tag, Check } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { COUNTRY_FULL_DATA } from '../constants';
import { Country, CustomTier } from '../types';

const CountryManagement = () => {
  // Master data state to support updates/deletes
  const [masterData, setMasterData] = useState<Country[]>(COUNTRY_FULL_DATA);
  const [filteredData, setFilteredData] = useState<Country[]>(COUNTRY_FULL_DATA);
  
  // Custom Tiers State
  const [customTiers, setCustomTiers] = useState<CustomTier[]>([]);

  // Search State
  const [searchParams, setSearchParams] = useState({ names: '', codes: '', iso2s: '', tiers: [] as string[] });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Country | null>(null);
  // Track Custom Tier selections in Edit Modal
  const [editingCustomTiers, setEditingCustomTiers] = useState<string[]>([]);
  const [originalIso2, setOriginalIso2] = useState('');

  // Custom Tier Modal State
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [newTierName, setNewTierName] = useState('');
  const [newTierCountries, setNewTierCountries] = useState('');

  // Load Custom Tiers on Mount
  useEffect(() => {
    const stored = localStorage.getItem('custom_tiers');
    if (stored) {
      try {
        setCustomTiers(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load custom tiers", e);
      }
    }
  }, []);

  // Helper to split comma-separated strings
  const parseSearchInput = (input: string) => {
    return input.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
  };

  const handleQuery = () => {
    let result = [...masterData];

    const nameKeywords = parseSearchInput(searchParams.names);
    if (nameKeywords.length > 0) {
      result = result.filter(i => nameKeywords.some(k => i.name.toLowerCase().includes(k.toLowerCase())));
    }

    const codeKeywords = parseSearchInput(searchParams.codes);
    if (codeKeywords.length > 0) {
      result = result.filter(i => codeKeywords.some(k => i.code.toLowerCase().includes(k.toLowerCase())));
    }

    const iso2Keywords = parseSearchInput(searchParams.iso2s);
    if (iso2Keywords.length > 0) {
      result = result.filter(i => iso2Keywords.some(k => i.iso2.toLowerCase().includes(k.toLowerCase())));
    }

    if (searchParams.tiers.length > 0) {
      // Split selection into Standard Tiers and Custom Tiers
      const selectedStandard = searchParams.tiers.filter(t => ['T1', 'T2', 'T3', 'T4'].includes(t));
      const selectedCustom = searchParams.tiers.filter(t => !['T1', 'T2', 'T3', 'T4'].includes(t));
      
      // Find ISO2 codes for selected custom tiers
      const customTierIso2s = new Set<string>();
      customTiers.forEach(ct => {
        if (selectedCustom.includes(ct.name)) {
          ct.countries.forEach(iso => customTierIso2s.add(iso));
        }
      });

      result = result.filter(i => {
        const isStandardMatch = selectedStandard.includes(i.tier);
        const isCustomMatch = customTierIso2s.has(i.iso2);
        return isStandardMatch || isCustomMatch;
      });
    }

    setFilteredData(result); 
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchParams({names:'', codes:'', iso2s:'', tiers:[]});
    setFilteredData(masterData);
    setCurrentPage(1);
  };

  // Upload Handling
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
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
      alert("上传的格式不对，录入失败。");
      return;
    }

    // Mock success
    alert(`文件 "${file.name}" 上传成功，数据已进入处理队列。`);
  };

  const handleDownload = () => {
    const csvContent = "\ufeff国家,地区码,二字码,tier\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', '国家导入模板.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Edit Modal Handling
  const openEditModal = (item: Country) => {
    setEditingItem({ ...item }); // Clone to avoid direct mutation
    setOriginalIso2(item.iso2); // Store original ISO2 for reference
    
    // Determine which custom tiers this country belongs to
    const assignedTiers = customTiers
      .filter(ct => ct.countries.includes(item.iso2))
      .map(ct => ct.name);
    setEditingCustomTiers(assignedTiers);
    
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    // 1. Update Master Data
    const updatedMaster = masterData.map(item => item.id === editingItem.id ? editingItem : item);
    setMasterData(updatedMaster);
    
    // Update Filtered Data (keep current filter context if possible, or just update row)
    const updatedFiltered = filteredData.map(item => item.id === editingItem.id ? editingItem : item);
    setFilteredData(updatedFiltered);

    // 2. Update Custom Tiers Assignments
    // Logic: Iterate all custom tiers. 
    // If a tier is in `editingCustomTiers`: Ensure `editingItem.iso2` is present in that tier.
    // If a tier is NOT in `editingCustomTiers`: Ensure `editingItem.iso2` (and `originalIso2`) is REMOVED.
    const updatedCustomTiers = customTiers.map(tier => {
       let newCountries = [...tier.countries];
       
       // First, blindly remove the *original* ISO2 to handle cases where ISO2 changed OR it was deselected.
       // This prevents "ghost" entries if the user renamed "US" to "USA" in the edit form.
       newCountries = newCountries.filter(c => c !== originalIso2);

       // Check if this tier is currently selected
       if (editingCustomTiers.includes(tier.name)) {
         // Add the *new* ISO2 if not already present (it shouldn't be, since we filtered orig, but check for safety)
         if (!newCountries.includes(editingItem.iso2)) {
           newCountries.push(editingItem.iso2);
         }
       }
       
       return { ...tier, countries: newCountries };
    });

    setCustomTiers(updatedCustomTiers);
    localStorage.setItem('custom_tiers', JSON.stringify(updatedCustomTiers));

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    if (window.confirm(`确定要删除 ${editingItem.name} 吗？`)) {
      const updatedMaster = masterData.filter(item => item.id !== editingItem.id);
      setMasterData(updatedMaster);
      
      const updatedFiltered = filteredData.filter(item => item.id !== editingItem.id);
      setFilteredData(updatedFiltered);

      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  // --- Custom Tier Logic ---
  const handleOpenTierModal = () => {
    setNewTierName('');
    setNewTierCountries('');
    setIsTierModalOpen(true);
  };

  const handleSaveCustomTier = () => {
    if (!newTierName.trim()) {
      alert("请输入 Tier 名称");
      return;
    }
    
    const inputCodes = newTierCountries.split(/[,，]/).map(c => c.trim().toUpperCase()).filter(c => c);
    if (inputCodes.length === 0) {
      alert("请输入至少一个国家二字码");
      return;
    }

    // Validation: Check if codes exist in masterData
    const existingIso2s = new Set(masterData.map(c => c.iso2.toUpperCase()));
    const invalidCodes = inputCodes.filter(code => !existingIso2s.has(code));

    if (invalidCodes.length > 0) {
      alert(`以下国家二字码不存在于基础分组中，无法创建:\n${invalidCodes.join(', ')}`);
      return;
    }

    // Check for duplicate tier name
    if (customTiers.some(ct => ct.name.toLowerCase() === newTierName.trim().toLowerCase())) {
        alert("Tier 名称已存在，请使用其他名称");
        return;
    }

    // Save to LocalStorage for cross-component access
    const newTier: CustomTier = {
      id: `custom_${Date.now()}`,
      name: newTierName.trim(),
      countries: inputCodes,
      createdAt: new Date().toISOString()
    };

    const updatedTiers = [...customTiers, newTier];
    setCustomTiers(updatedTiers);
    localStorage.setItem('custom_tiers', JSON.stringify(updatedTiers));

    alert(`自定义 Tier "${newTierName}" 创建成功！\n已关联 ${inputCodes.length} 个国家。`);
    setIsTierModalOpen(false);
  };

  // Dynamic Tier Options
  const tierOptions = useMemo(() => {
    return ['T1', 'T2', 'T3', 'T4', ...customTiers.map(t => t.name)];
  }, [customTiers]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper to find which custom tiers a country belongs to
  const getCustomTiersForCountry = (iso2: string) => {
    return customTiers.filter(ct => ct.countries.includes(iso2)).map(ct => ct.name);
  };

  // Helper to toggle custom tier in edit modal
  const toggleEditingCustomTier = (tierName: string) => {
    setEditingCustomTiers(prev => 
      prev.includes(tierName) 
        ? prev.filter(t => t !== tierName)
        : [...prev, tierName]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">国家/地区名 (支持多选)</label>
            <input type="text" placeholder="输入名称, 用逗号分隔" className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm" value={searchParams.names} onChange={e=>setSearchParams({...searchParams, names:e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">地区码 (支持多选)</label>
            <input type="text" placeholder="如: CHN, USA" className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm" value={searchParams.codes} onChange={e=>setSearchParams({...searchParams, codes:e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">二字码 (支持多选)</label>
            <input type="text" placeholder="如: CN, US" className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm" value={searchParams.iso2s} onChange={e=>setSearchParams({...searchParams, iso2s:e.target.value})} />
          </div>
          <MultiSelectDropdown label="Tier 分类" options={tierOptions} selected={searchParams.tiers} onToggle={opt => setSearchParams(prev => ({...prev, tiers: prev.tiers.includes(opt)?prev.tiers.filter(x=>x!==opt):[...prev.tiers, opt]}))} placeholder="选择 Tier (Standard & Custom)" />
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t mt-4">
          <button onClick={handleReset} className="h-10 px-6 font-bold text-slate-500 bg-slate-100 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"><RotateCcw size={16}/> 重置</button>
          <button onClick={handleQuery} className="h-10 px-10 font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"><Search size={16}/> 查询</button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black text-slate-500 uppercase px-3 italic">Master Data View ({filteredData.length})</span>
            <button onClick={handleOpenTierModal} className="h-8 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors">
               <Layers size={12}/> + 自定义 Tier
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="h-9 px-4 text-xs font-bold text-slate-600 bg-white border rounded-lg flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors"><Download size={14}/> 下载模板</button>
            <button onClick={handleUploadClick} className="h-9 px-4 text-xs font-bold text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md active:scale-95">
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
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase font-black border-b h-14">
                <th className="px-6 py-4">ID</th><th className="px-6 py-4">国家/地区</th><th className="px-6 py-4">地区码</th><th className="px-6 py-4">二字码</th><th className="px-6 text-center">Tier</th><th className="px-6 text-center">本地货币</th><th className="px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map(item => {
                const itemCustomTiers = getCustomTiersForCountry(item.iso2);
                return (
                  <tr key={item.id} className="hover:bg-blue-50/10 transition-colors h-14 group">
                    <td className="px-6 text-xs font-mono text-slate-400">{item.id}</td>
                    <td className="px-6 text-sm font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 text-sm font-mono text-slate-500">{item.code}</td>
                    <td className="px-6 text-sm font-mono text-slate-500">{item.iso2}</td>
                    <td className="px-6 text-center">
                       <div className="flex flex-col gap-1 items-center">
                         <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase shadow-sm w-fit ${item.tier === 'T1' ? 'bg-indigo-500 text-white' : item.tier === 'T2' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>{item.tier}</span>
                         {/* Display Custom Tier Tags if any */}
                         {itemCustomTiers.length > 0 && (
                           <div className="flex flex-wrap justify-center gap-0.5 max-w-[120px]">
                             {itemCustomTiers.map(t => (
                               <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-0.5">
                                 <Tag size={8}/> {t}
                               </span>
                             ))}
                           </div>
                         )}
                       </div>
                    </td>
                    <td className="px-6 text-xs font-bold text-slate-500 text-center uppercase tracking-tight">{item.currency}</td>
                    <td className="px-6 text-center"><button onClick={() => openEditModal(item)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all"><Edit3 size={15}/></button></td>
                  </tr>
                );
              })}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">No Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-bold">
            Showing <span className="text-slate-700">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-700">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="text-slate-700">{filteredData.length}</span> results
          </div>
          <div className="flex gap-1.5 items-center">
             <button 
               onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
               className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
             >
               <ChevronsLeft size={14} />
             </button>
             <button 
               onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}
               className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
             >
               <ChevronLeft size={14} />
             </button>
             
             <div className="px-3 text-xs font-bold text-slate-600">
               Page {currentPage} of {Math.max(1, totalPages)}
             </div>

             <button 
               onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0}
               className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
             >
               <ChevronRight size={14} />
             </button>
             <button 
               onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
               className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
             >
               <ChevronsRight size={14} />
             </button>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" />
                <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">编辑国家配置</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase">ID (不可变)</label>
                     <input type="text" disabled value={editingItem.id} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-400 cursor-not-allowed" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tier 级别</label>
                     <select 
                       value={editingItem.tier}
                       onChange={(e) => setEditingItem({...editingItem, tier: e.target.value})}
                       className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                     >
                       {['T1', 'T2', 'T3', 'T4'].map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase">国家/地区名称</label>
                   <input 
                     type="text" 
                     value={editingItem.name} 
                     onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                     className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-500 uppercase">地区三字码</label>
                     <input 
                       type="text" 
                       value={editingItem.code} 
                       onChange={(e) => setEditingItem({...editingItem, code: e.target.value})}
                       className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-500 uppercase">地区二字码</label>
                     <input 
                       type="text" 
                       value={editingItem.iso2} 
                       onChange={(e) => setEditingItem({...editingItem, iso2: e.target.value})}
                       className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase">本地货币</label>
                   <input 
                     type="text" 
                     value={editingItem.currency} 
                     onChange={(e) => setEditingItem({...editingItem, currency: e.target.value})}
                     className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                   />
                 </div>

                 {/* NEW: Custom Tier Editing Section */}
                 <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
                   <label className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1.5">
                     <Layers size={10} /> 自定义分组 (Custom Tiers)
                   </label>
                   {customTiers.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {customTiers.map(tier => {
                         const isSelected = editingCustomTiers.includes(tier.name);
                         return (
                           <button
                             key={tier.id}
                             onClick={() => toggleEditingCustomTier(tier.name)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                               isSelected 
                                 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 active:scale-95' 
                                 : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                             }`}
                           >
                             {isSelected ? <Check size={10} strokeWidth={4} /> : <Tag size={10} />}
                             {tier.name}
                           </button>
                         );
                       })}
                     </div>
                   ) : (
                     <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-100 text-center">
                       暂无自定义分组，请点击主界面的 "+ 自定义 Tier" 创建
                     </div>
                   )}
                 </div>

               </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-between items-center">
              <button 
                onClick={handleDeleteItem}
                className="text-xs font-black text-red-500 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> 删除该国家
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

      {/* Custom Tier Modal */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">自定义 Tier 分组</h3>
              </div>
              <button onClick={() => setIsTierModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  自定义分组仅用于报表筛选快捷操作。输入的国家二字码必须已存在于基础数据（T1~T4）中。
                </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier 名称</label>
                   <input 
                     type="text" 
                     value={newTierName} 
                     onChange={(e) => setNewTierName(e.target.value)}
                     className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                     placeholder="例如: Special-EU-Group"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">包含国家 (二字码)</label>
                   <textarea
                     value={newTierCountries} 
                     onChange={(e) => setNewTierCountries(e.target.value)}
                     className="w-full h-32 px-3 py-3 border border-slate-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                     placeholder="例如: US, GB, DE, FR (用逗号分隔)"
                   />
                   <p className="text-[10px] text-slate-400 text-right">多个国家请用逗号分隔</p>
                 </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-end gap-3 items-center">
              <button onClick={() => setIsTierModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 text-xs hover:text-slate-700">取消</button>
              <button onClick={handleSaveCustomTier} className="px-8 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                <Save size={14} /> 确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryManagement;