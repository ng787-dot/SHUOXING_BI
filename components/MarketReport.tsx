import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronRight, Save, FileDown, Layers, BarChart3, Settings2, Plus, X, Calendar, Clock, Calculator, AlertCircle } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { COUNTRY_FULL_DATA, PROJECTS, INITIAL_MEDIA_DATA, INITIAL_APP_DATA } from '../constants';
import { CustomTier, Media } from '../types';

// --- Constants & Options ---
const TIME_DIMENSIONS = [
  { value: 'daily', label: '日报 (Day)' },
  { value: 'weekly', label: '周报 (Week)' },
  { value: 'monthly', label: '月报 (Month)' },
  { value: 'yearly', label: '年报 (Year)' }
];

const STANDARD_TIERS = ['T1', 'T2', 'T3', 'T4'];

// Reordered: Added '项目' (Project) to dimensions
const SPLIT_DIMENSIONS = ['项目', '游戏', '归属', '媒体', 'Tier', '国家', '广告系列', '广告组', '广告'];
const AD_LEVEL_DIMENSIONS = ['广告系列', '广告组', '广告'];

// 1. Updated Cohort Metrics Options (User selection pool)
const COHORT_METRICS = [
  '留存人数', '留存率', '付费留存人数', '付费留存率',
  '付费金额', 'LTV', 'ARPPU', 'ROI',
  '累计付费人数', '累计付费次数', '累计付费率',
  '总储值金额', '总ROI'
];

// 2. Fixed Sorting Order for Columns (Requirement 1)
const COHORT_METRIC_SORT_ORDER = [
  '留存人数',
  '留存率',
  '付费留存人数',
  '付费留存率',
  '付费金额',
  'LTV',
  'ARPPU',
  'ROI',
  '总储值金额',
  '总ROI',
  '累计付费人数',
  '累计付费次数',
  '累计付费率'
];

// 3. Ad Frontend Data Options (Requirement 2)
const AD_FRONTEND_METRICS = ['展示量', '点击量', 'CPM', 'CTR', 'CVR', 'IR'];

// Specific Mock Countries covering T1, T2, T3
const MOCK_COUNTRIES_LIST = [
  { code: 'US', tier: 'T1' }, { code: 'JP', tier: 'T1' }, { code: 'KR', tier: 'T1' }, { code: 'GB', tier: 'T1' }, { code: 'DE', tier: 'T1' }, { code: 'FR', tier: 'T1' }, { code: 'CA', tier: 'T1' }, { code: 'AU', tier: 'T1' },
  { code: 'ES', tier: 'T2' }, { code: 'IT', tier: 'T2' }, { code: 'RU', tier: 'T2' }, { code: 'BR', tier: 'T2' }, { code: 'TR', tier: 'T2' }, { code: 'SG', tier: 'T2' },
  { code: 'IN', tier: 'T3' }, { code: 'ID', tier: 'T3' }, { code: 'PH', tier: 'T3' }, { code: 'VN', tier: 'T3' }, { code: 'TH', tier: 'T3' }, { code: 'MY', tier: 'T3' }, { code: 'EG', tier: 'T3' }
];

const GENERATE_DAYS = () => {
  const days = [];
  for (let i = 1; i <= 90; i++) days.push(String(i));
  // Add 180 for the ROI requirement
  days.push('180');
  for (let i = 90; i <= 720; i += 30) {
    if (!days.includes(String(i))) days.push(String(i));
  }
  return days.sort((a,b) => parseInt(a) - parseInt(b));
};
const METRIC_DAYS_OPTIONS = GENERATE_DAYS();
const YEAR_OPTIONS = Array.from({length: 5}, (_, i) => String(2024 + i)); // 2024-2028

const SAVED_REPORTS_MOCK = [
  { id: 1, name: 'DawnGod US ROI Report' },
  { id: 2, name: 'Global LTV Analysis' },
  { id: 3, name: 'Weekly Retention Check' }
];

// --- Helper Functions ---

const isMatch = (value: string, search: string, type: 'exact' | 'fuzzy') => {
  if (!search.trim()) return true;
  const orGroups = search.split(',').map(s => s.trim()).filter(Boolean);
  if (orGroups.length === 0) return true;

  const valObj = String(value || '');

  return orGroups.some(orGroup => {
    const andTerms = orGroup.split('&').map(s => s.trim()).filter(Boolean);
    return andTerms.every(term => {
      if (type === 'exact') {
        return valObj === term;
      } else {
        return valObj.includes(term);
      }
    });
  });
};

// Get Week Range: 2026-W10 -> 2026/03/02~2026/03/08
const getWeekRangeLabel = (weekStr: string) => {
  if (!weekStr.includes('-W')) return weekStr;
  const [yearStr, w] = weekStr.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(w);
  
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  
  const start = new Date(ISOweekStart);
  const end = new Date(ISOweekStart);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  return `${fmt(start)}~${fmt(end)}`;
};

// Generate Date Array based on range and type
const generateDateSteps = (start: string, end: string, type: string) => {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);

  if (type === 'daily') {
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (type === 'weekly') {
    // Basic string comparison for weeks usually works if format is YYYY-WXX
    let currStr = start;
    while (currStr <= end) {
      dates.push(currStr);
      // Increment week logic (Simplified for mock)
      const [y, w] = currStr.split('-W').map(Number);
      let nextW = w + 1;
      let nextY = y;
      if (nextW > 52) { nextW = 1; nextY++; }
      currStr = `${nextY}-W${String(nextW).padStart(2, '0')}`;
      if (dates.length > 52) break; // Safety break
    }
  } else if (type === 'monthly') {
    let currStr = start; // 2026-02
    while (currStr <= end) {
      dates.push(currStr);
      const [y, m] = currStr.split('-').map(Number);
      let nextM = m + 1;
      let nextY = y;
      if (nextM > 12) { nextM = 1; nextY++; }
      currStr = `${nextY}-${String(nextM).padStart(2, '0')}`;
      if (dates.length > 24) break;
    }
  } else {
    // Yearly
    let currY = parseInt(start);
    const endY = parseInt(end);
    while (currY <= endY) {
      dates.push(String(currY));
      currY++;
    }
  }
  return dates;
};

// --- Mock Data Generator ---
// Modified to accept 'availableMedia' to correctly identify Organic types
const generateReportData = (filters: any) => {
  const rows: any[] = [];
  const dateSteps = generateDateSteps(filters.dateRange.start, filters.dateRange.end, filters.timeDim);
  const { availableMedia, adMetrics } = filters;

  let idCounter = 1;

  dateSteps.forEach(dateStep => {
    // Determine display date
    let displayDate = dateStep;
    if (filters.timeDim === 'weekly') displayDate = getWeekRangeLabel(dateStep);

    // Determine base iterations based on split dimensions
    const hasCmp = filters.splitDimensions.includes('广告系列');
    const hasGrp = filters.splitDimensions.includes('广告组');
    const hasAd = filters.splitDimensions.includes('广告');

    let cmpCount = 1;
    if (hasCmp || hasGrp || hasAd) {
       cmpCount = hasCmp ? 2 : 1; // 2 campaigns per date if campaign is selected
    } else {
       cmpCount = filters.splitDimensions.length === 0 ? 1 : Math.floor(Math.random() * 3) + 2;
    }

    for (let c = 0; c < cmpCount; c++) {
      const cmpName = `Cmp_${['Launch','Retarget','Brand'][c % 3]}_${Math.floor(Math.random() * 100)}`;
      let grpIterations = hasGrp ? Math.floor(Math.random() * 3) + 2 : 1; // 2 to 4
      
      for (let g = 0; g < grpIterations; g++) {
        const grpName = `${cmpName}_Grp_${['T1_High','Android_Bid','Video_Feed','Lookalike'][g % 4]}`;
        let adIterations = hasAd ? Math.floor(Math.random() * 3) + 3 : 1; // 3 to 5
        
        for (let a = 0; a < adIterations; a++) {
          const adName = `${grpName}_Ad_${['Video1','Img2','Playable','UGC','Banner'][a % 5]}_${Math.floor(Math.random()*1000)}`;
          
          const i = c * 100 + g * 10 + a; // Keep a pseudo index for deterministic mock picking

          const row: any = { id: idCounter++ };
          row['日期'] = displayDate;
          
          // Determine Project
          const selectedProjects = filters.projects && filters.projects.length > 0 ? filters.projects : ['All'];
          const currentProject = selectedProjects[i % selectedProjects.length];
          
          row['project_raw'] = currentProject; // Helper for summary

          // Randomly select a Country/Tier Combo
          const randomCountry = MOCK_COUNTRIES_LIST[Math.floor(Math.random() * MOCK_COUNTRIES_LIST.length)];

          // Determine Media
          let currentMedia = 'Facebook';
          // Find an 'Organic' type media for fallback/mixing
          const organicMediaName = availableMedia.find((m: Media) => m.type === '自然量')?.name || 'Organic';

          if (filters.splitDimensions.includes('媒体')) {
            if (filters.media.length > 0) {
               currentMedia = filters.media[i % filters.media.length];
            } else {
               // Mix of paid and organic if no media selected
               currentMedia = (i === 0) ? 'Facebook' : organicMediaName;
            }
          } else {
             // Default if not split by media
             if (filters.splitDimensions.includes('归属')) {
                currentMedia = (i % 2 === 0) ? 'Facebook' : organicMediaName; 
             }
          }

          // Identify Type based on configuration
          const mediaObj = availableMedia.find((m: Media) => m.name === currentMedia);
          const isOrganic = mediaObj ? mediaObj.type === '自然量' : currentMedia === 'Organic';
          const attributionType = mediaObj ? mediaObj.type : (isOrganic ? '自然量' : '广告');

          // Force Organic if Attribution split dictates it (mock data consistency)
          if (filters.splitDimensions.includes('归属') && row['归属'] === '自然量') {
             currentMedia = organicMediaName;
          }
          
          // Dimensions
          if (filters.splitDimensions.length === 0) {
            // No Split Default Columns
            row['项目'] = selectedProjects.length > 1 ? 'Multiple' : selectedProjects[0];
          } else {
            // Split Logic
            if (filters.splitDimensions.includes('项目')) row['项目'] = currentProject;
            if (filters.splitDimensions.includes('游戏')) row['游戏'] = filters.games.length === 1 ? filters.games[0] : `${currentProject}-${['Android', 'iOS'][i % 2]}`;
            
            // Attribution is now the Media Type
            if (filters.splitDimensions.includes('归属')) row['归属'] = attributionType;
            
            if (filters.splitDimensions.includes('媒体')) row['媒体'] = currentMedia;
            if (filters.splitDimensions.includes('Tier')) row['Tier'] = filters.tiers.length > 0 ? filters.tiers[i % filters.tiers.length] : randomCountry.tier;
            if (filters.splitDimensions.includes('国家')) row['国家'] = filters.countries.length > 0 ? filters.countries[i % filters.countries.length] : randomCountry.code;
            
            // Ad Drilldown Mock
            if (hasCmp) row['广告系列'] = cmpName;
            if (hasGrp) row['广告组'] = grpName;
            if (hasAd) row['广告'] = adName;
          }

      // --- Metrics Generation (Base Values) ---
      // Cost: Organic = 0. Paid = Random.
      const cost = isOrganic ? 0 : (Math.random() * 2000 + 100);
      
      // Installs:
      // If Organic: Random number.
      // If Paid: Cost / CPA (CPA ranges $0.5 - $3.0 typically)
      const cpa = 0.5 + Math.random() * 2.5; 
      const installs = isOrganic ? Math.floor(Math.random() * 300 + 50) : Math.floor(cost / cpa);
      
      // Registrations: Rate 90-95%
      const regRate = 0.90 + Math.random() * 0.05; 
      const registrations = Math.floor(installs * regRate);

      // Ad Frontend Data Simulation
      // Logic Update: Reverse calculate based on Installs
      // Target CVR: 20% - 30%
      // Target CTR: 0.5% - 1.5%
      if (adMetrics && adMetrics.length > 0) {
        let impressions = 0;
        let clicks = 0;
        let cpm = 0;
        let ctr = 0;
        let cvr = 0;
        let ir = 0;

        if (!isOrganic && installs > 0) {
           // 1. Determine realistic rates within requested ranges
           const targetCVR = 0.20 + Math.random() * 0.10; // 0.20 - 0.30
           const targetCTR = 0.005 + Math.random() * 0.01; // 0.005 - 0.015

           // 2. Reverse calculate Clicks from Installs
           // Installs = Clicks * CVR  => Clicks = Installs / CVR
           clicks = Math.floor(installs / targetCVR);
           // Safety: Clicks must be >= installs
           if (clicks < installs) clicks = installs;

           // 3. Reverse calculate Impressions from Clicks
           // Clicks = Impressions * CTR => Impressions = Clicks / CTR
           impressions = Math.floor(clicks / targetCTR);
           // Safety: Impressions must be >= clicks
           if (impressions < clicks) impressions = clicks;

           // 4. Calculate Derived Metrics (based on final integers)
           if (impressions > 0) {
              cpm = (cost / impressions) * 1000;
              ctr = clicks / impressions;
              ir = installs / impressions;
           }
           if (clicks > 0) {
              cvr = installs / clicks;
           }
        }

        if (adMetrics.includes('展示量')) row['展示量'] = impressions;
        if (adMetrics.includes('点击量')) row['点击量'] = clicks;
        if (adMetrics.includes('CPM')) row['CPM'] = isOrganic ? '-' : cpm.toFixed(2);
        if (adMetrics.includes('CTR')) row['CTR'] = isOrganic ? '-' : (ctr * 100).toFixed(2) + '%';
        if (adMetrics.includes('CVR')) row['CVR'] = isOrganic ? '-' : (cvr * 100).toFixed(2) + '%';
        if (adMetrics.includes('IR')) row['IR'] = isOrganic ? '-' : (ir * 100).toFixed(4) + '%';

        // Store raw for summary
        row['_impressions'] = impressions;
        row['_clicks'] = clicks;
      }


      // Store raw values for aggregation
      row['_cost'] = cost;
      row['_installs'] = installs;
      row['_registrations'] = registrations;

      // Display Values
      row['花销'] = isOrganic ? '0.00' : cost.toFixed(2);
      row['安装'] = installs;
      row['注册'] = registrations;
      row['注册率'] = ((registrations / (installs || 1)) * 100).toFixed(2) + '%';
      row['CPA'] = isOrganic ? '0.00' : (cost / (installs || 1)).toFixed(2);

      // Cohort Metrics
      filters.cohortMetrics.forEach((metric: string) => {
        filters.metricDays.forEach((day: string) => {
          const d = parseInt(day);
          
          // Realistic ROI Curve Logic
          // Targets: D7=45%, D30=85%, D180=175%
          // Using a simple piecewise linear interpolation with noise for mock
          let targetROI = 0;
          if (d <= 1) targetROI = 0.05 + Math.random() * 0.05; // D1 ~5-10%
          else if (d <= 7) targetROI = 0.15 + (0.45 - 0.15) * ((d - 1) / 6); 
          else if (d <= 30) targetROI = 0.45 + (0.85 - 0.45) * ((d - 7) / 23);
          else if (d <= 180) targetROI = 0.85 + (1.75 - 0.85) * ((d - 30) / 150);
          else targetROI = 1.75 + (d-180)*0.002; // Slow growth after D180

          // Add some randomness (+/- 10%)
          const finalROI = targetROI * (0.9 + Math.random() * 0.2);

          // Calculate Revenue & LTV
          // For Paid: Revenue = Cost * ROI
          // For Organic: Cost is 0, so we simulate Revenue based on an estimated LTV derived from the ROI curve of a typical paid user (e.g. assuming $1.5 CPA basis)
          const estimatedBaseCPA = 1.5;
          const revenue = isOrganic 
            ? installs * estimatedBaseCPA * finalROI 
            : cost * finalROI;
            
          row[`_val_revenue_D${day}`] = revenue;

          // Metric Population
          if (metric.includes('留存') && !metric.includes('付费')) {
             // Retention Count (Logarithmic decay)
             // Start ~45-50% D1, dropping to ~5-10% D180
             const retentionRateBase = 0.5 / (1 + Math.log10(d) * 0.8);
             const retentionCount = Math.floor(installs * retentionRateBase);
             
             row[`_val_留存人数_D${day}`] = retentionCount;
             
             if (metric.includes('率')) row[`${metric} D${day}`] = ((retentionCount / (installs || 1)) * 100).toFixed(2) + '%';
             else row[`${metric} D${day}`] = retentionCount;

          } else if (metric.includes('ROI')) {
             // ROI
             if (isOrganic) {
                 row[`${metric} D${day}`] = '-'; // Organic has no ROI
             } else {
                 row[`${metric} D${day}`] = (finalROI * 100).toFixed(2) + '%';
             }
          } else if (metric.includes('LTV')) {
             // LTV = Revenue / Installs
             row[`${metric} D${day}`] = (revenue / (installs || 1)).toFixed(2);
          } else if (metric.includes('付费金额') || metric.includes('总储值')) {
             row[`${metric} D${day}`] = revenue.toFixed(2);
          } else if (metric.includes('ARPPU')) {
             // ARPPU = Revenue / Paying Users
             // Simulate Paying Users ~ 5-10% of installs
             const payingUsers = Math.max(1, Math.floor(installs * (0.05 + Math.random() * 0.05)));
             row[`${metric} D${day}`] = (revenue / payingUsers).toFixed(2);
          } else {
             // Others
             row[`${metric} D${day}`] = (Math.random() * 100).toFixed(2);
          }
        });
      });

      rows.push(row);
        }
      }
    }
  });

  return rows;
};

// Calculate Summary Row from Data
const calculateSummary = (data: any[], filters: any) => {
  if (data.length === 0) return null;

  const sum = (key: string) => data.reduce((acc, curr) => acc + (curr[key] || 0), 0);
  
  const totalCost = sum('_cost');
  const totalInstalls = sum('_installs');
  const totalRegs = sum('_registrations');
  const totalImpressions = sum('_impressions');
  const totalClicks = sum('_clicks');

  const summary: any = {
    id: 'summary',
    '日期': '汇总',
    '项目': '-',
    '花销': totalCost.toFixed(2),
    '安装': totalInstalls,
    '注册': totalRegs,
    '注册率': totalInstalls ? ((totalRegs / totalInstalls) * 100).toFixed(2) + '%' : '0.00%',
    'CPA': totalInstalls ? (totalCost / totalInstalls).toFixed(2) : '0.00',
    isSummary: true
  };

  // Ad Frontend Summary
  const { adMetrics } = filters;
  if (adMetrics) {
    if (adMetrics.includes('展示量')) summary['展示量'] = totalImpressions;
    if (adMetrics.includes('点击量')) summary['点击量'] = totalClicks;
    if (adMetrics.includes('CPM')) summary['CPM'] = totalImpressions ? ((totalCost / totalImpressions) * 1000).toFixed(2) : '0.00';
    if (adMetrics.includes('CTR')) summary['CTR'] = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%';
    if (adMetrics.includes('CVR')) summary['CVR'] = totalClicks ? ((totalInstalls / totalClicks) * 100).toFixed(2) + '%' : '0.00%';
    if (adMetrics.includes('IR')) summary['IR'] = totalImpressions ? ((totalInstalls / totalImpressions) * 100).toFixed(4) + '%' : '0.00%';
  }

  // Fill empty split dimensions
  filters.splitDimensions.forEach((d: string) => summary[d] = '-');

  // Calculate Cohort Summaries
  filters.cohortMetrics.forEach((metric: string) => {
    filters.metricDays.forEach((day: string) => {
      const key = `${metric} D${day}`;
      
      if (metric.includes('留存率')) {
        // Weighted Retention Rate
        // Find raw retention counts from data rows using hidden keys
        const retentionCount = data.reduce((acc, curr) => {
            const val = curr[`_val_留存人数_D${day}`] || 0;
            return acc + val;
        }, 0);
        summary[key] = totalInstalls ? ((retentionCount / totalInstalls) * 100).toFixed(2) + '%' : '0.00%';

      } else if (metric.includes('留存人数')) {
        const retentionCount = data.reduce((acc, curr) => acc + (curr[`_val_留存人数_D${day}`] || 0), 0);
        summary[key] = retentionCount;

      } else if (metric.includes('ROI')) {
        const totalRevenue = data.reduce((acc, curr) => acc + (curr[`_val_revenue_D${day}`] || 0), 0);
        summary[key] = totalCost ? ((totalRevenue / totalCost) * 100).toFixed(2) + '%' : '0.00%';
        
      } else if (metric.includes('LTV')) {
        const totalRevenue = data.reduce((acc, curr) => acc + (curr[`_val_revenue_D${day}`] || 0), 0);
        summary[key] = totalInstalls ? (totalRevenue / totalInstalls).toFixed(2) : '0.00';
        
      } else if (metric.includes('付费金额') || metric.includes('总储值')) {
         const totalRevenue = data.reduce((acc, curr) => acc + (curr[`_val_revenue_D${day}`] || 0), 0);
         summary[key] = totalRevenue.toFixed(2);
      }
    });
  });

  return summary;
};


const IntegratedReport = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reportName, setReportName] = useState('');
  // Converted saved reports to state to allow adding new ones
  const [savedReports, setSavedReports] = useState(SAVED_REPORTS_MOCK);
  const [savedReportId, setSavedReportId] = useState<string>('');
  
  // Filter States
  const [timeDim, setTimeDim] = useState('daily');
  // Default Ranges
  const [dateRange, setDateRange] = useState({ start: '2026-02-01', end: '2026-02-07' });
  
  const [projects, setProjects] = useState<string[]>(['DawnGod']);
  const [games, setGames] = useState<string[]>([]);
  
  const [attribution, setAttribution] = useState<string>('all'); 
  const [media, setMedia] = useState<string[]>([]);
  
  // Tier & Country State
  const [tiers, setTiers] = useState<string[]>([]);
  const [customTiers, setCustomTiers] = useState<CustomTier[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  
  // Available Media State
  const [availableMedia, setAvailableMedia] = useState<Media[]>(INITIAL_MEDIA_DATA);

  const [splitDimensions, setSplitDimensions] = useState<string[]>([]); 
  
  const [cohortMetrics, setCohortMetrics] = useState<string[]>(['ROI', 'LTV', '留存率']);
  const [metricDays, setMetricDays] = useState<string[]>(['1', '7', '30', '180']);

  // New State for Ad Frontend Data
  const [adMetrics, setAdMetrics] = useState<string[]>([]);

  const [reportData, setReportData] = useState<any[]>([]);
  const [appliedQueryFilters, setAppliedQueryFilters] = useState<any>(null);
  const [generatedColumns, setGeneratedColumns] = useState<string[]>([]);

  // Analytics Features State
  const [adSearchType, setAdSearchType] = useState<'exact' | 'fuzzy'>('fuzzy');
  const [cmpSearch, setCmpSearch] = useState('');
  const [grpSearch, setGrpSearch] = useState('');
  const [adSearch, setAdSearch] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
      setExpandedRows(prev => ({...prev, [key]: !prev[key]}));
  };

  // Initialize saved reports and custom tiers from localStorage
  useEffect(() => {
    // Saved Reports
    const saved = localStorage.getItem('market_reports');
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved reports", e);
      }
    }
    
    // Custom Tiers
    const storedTiers = localStorage.getItem('custom_tiers');
    if (storedTiers) {
      try {
        setCustomTiers(JSON.parse(storedTiers));
      } catch (e) {
        console.error("Failed to parse custom tiers", e);
      }
    }

    // Load available media
    const storedMedia = localStorage.getItem('media_data');
    if (storedMedia) {
      try {
        setAvailableMedia(JSON.parse(storedMedia));
      } catch (e) {
        console.error("Failed to parse media data", e);
      }
    }
  }, []);

  // Check if Ad Level Dimensions are allowed
  const isAdLevelDisabled = media.length !== 1;

  // Auto-remove restricted dimensions if media condition fails
  useEffect(() => {
    if (isAdLevelDisabled) {
      setSplitDimensions(prev => prev.filter(d => !AD_LEVEL_DIMENSIONS.includes(d)));
    }
  }, [isAdLevelDisabled]);

  // --- Authorized Media Check (Logic for Ad Frontend Data) ---
  const authorizedMediaNames = useMemo(() => {
    // Get unique media names that are fully authorized (from App Data)
    // NOTE: In a real app, this would match IDs. Here we match strings.
    // We assume INITIAL_APP_DATA contains the list of authorized connections.
    // We normalize to handle slight differences if any (e.g. "Google Ads" vs "GoogleAds")
    return new Set(INITIAL_APP_DATA.map(app => app.media.replace(/\s+/g, '').toLowerCase()));
  }, []);

  const isAdMetricsEnabled = useMemo(() => {
    // If no media is selected (meaning All), we assume mix of authorized and unauthorized -> Disable
    if (media.length === 0) return false;
    
    // Check if EVERY selected media is in the authorized list
    return media.every(m => {
        const normalized = m.replace(/\s+/g, '').toLowerCase();
        // Special case: TiktokAds vs TikTok. Add manual mapping if needed or rely on updated data.
        // For this mock, we'll try direct match or known aliases
        if (normalized === 'tiktokads' && authorizedMediaNames.has('tiktok')) return true; 
        return authorizedMediaNames.has(normalized);
    });
  }, [media, authorizedMediaNames]);

  // Effect to clear Ad Metrics if authorization becomes invalid
  useEffect(() => {
    if (!isAdMetricsEnabled && adMetrics.length > 0) {
        setAdMetrics([]);
        alert("请选择可拉取前端数据的媒体 (所选媒体未完全授权，无法查看展示/点击等前端数据)");
    }
  }, [isAdMetricsEnabled, adMetrics]);


  // --- Drill-down Logic ---
  const gameOptions = useMemo(() => {
    if (projects.length === 0) return [];
    return projects.flatMap(p => [`${p}-Android`, `${p}-iOS`, `${p}-Huawei`, `${p}-PC`]);
  }, [projects]);

  // Derive unique attribution types from available media
  const attributionOptions = useMemo(() => {
    const types = new Set(availableMedia.map(m => m.type));
    return ['all', ...Array.from(types)];
  }, [availableMedia]);

  const mediaOptions = useMemo(() => {
    // Filter available media based on selected Attribution (which corresponds to Media Type)
    let filtered = availableMedia;
    
    if (attribution !== 'all') {
      filtered = availableMedia.filter(m => m.type === attribution);
    }

    return filtered.map(m => m.name);
  }, [attribution, availableMedia]);

  // Combined Tier Options (Standard Tiers + Custom Tiers from LocalStorage)
  const tierOptions = useMemo(() => {
    return ['T1', 'T2', 'T3', 'T4', ...customTiers.map(t => t.name)];
  }, [customTiers]);

  // Disable Logic for Tiers
  const disabledTierOptions = useMemo(() => {
    // Check if any Custom Tier is selected
    const selectedCustom = tiers.find(t => !STANDARD_TIERS.includes(t));
    
    // Check if any Standard Tier is selected
    const hasStandard = tiers.some(t => STANDARD_TIERS.includes(t));

    if (selectedCustom) {
      // If a custom tier is selected, disable EVERYTHING except the currently selected one.
      // This enforces single-select for custom tiers AND mutual exclusivity with others.
      return tierOptions.filter(t => t !== selectedCustom);
    }

    if (hasStandard) {
      // If standard tiers are selected, disable ALL custom tiers.
      // Allow multi-select for other standard tiers.
      return tierOptions.filter(t => !STANDARD_TIERS.includes(t));
    }

    return [];
  }, [tiers, tierOptions]);

  // Country Options based on selected Tiers (including Custom Tiers)
  const countryOptions = useMemo(() => {
    if (tiers.length === 0) return COUNTRY_FULL_DATA.map(c => c.iso2);
    
    // Separate Standard vs Custom selections
    const standardTiers = tiers.filter(t => ['T1','T2','T3','T4'].includes(t));
    const customTierNames = tiers.filter(t => !['T1','T2','T3','T4'].includes(t));

    // Get countries from Standard Tiers
    const standardCountries = COUNTRY_FULL_DATA
      .filter(c => standardTiers.includes(c.tier))
      .map(c => c.iso2);

    // Get countries from Custom Tiers
    const customTierCountries = customTiers
      .filter(ct => customTierNames.includes(ct.name))
      .flatMap(ct => ct.countries);

    // Combine and unique
    const combined = Array.from(new Set([...standardCountries, ...customTierCountries]));
    return combined.sort();
  }, [tiers, customTiers]);

  const getSortedMetricDays = () => {
    return [...metricDays].sort((a, b) => parseInt(a) - parseInt(b));
  };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (opt: string) => {
    setter(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  const handleQuery = () => {
    const sortedDays = getSortedMetricDays();

    // Sort splitDimensions according to the order defined in SPLIT_DIMENSIONS
    const sortedSplitDimensions = [...splitDimensions].sort((a, b) => {
      return SPLIT_DIMENSIONS.indexOf(a) - SPLIT_DIMENSIONS.indexOf(b);
    });

    // 1. Generate Columns Header
    // Fixed columns: Date, Project, Cost, Installs, Reg, RegRate, CPA
    let baseDims = [];
    if (sortedSplitDimensions.length === 0) {
      baseDims = ['日期', '项目', '花销', '安装', '注册', '注册率', 'CPA'];
    } else {
      baseDims = ['日期', ...sortedSplitDimensions, '花销', '安装', '注册', '注册率', 'CPA'];
    }

    // Add Ad Frontend Metrics columns (Impressions, CTR, etc.) if selected
    // They usually appear before cohort metrics
    const selectedAdMetrics = AD_FRONTEND_METRICS.filter(m => adMetrics.includes(m));
    baseDims = [...baseDims, ...selectedAdMetrics];

    const metrics: string[] = [];
    
    // Sort selected cohort metrics based on the FIXED ORDER (Requirement 1)
    const sortedCohortMetrics = COHORT_METRIC_SORT_ORDER.filter(m => cohortMetrics.includes(m));

    sortedCohortMetrics.forEach(m => {
      sortedDays.forEach(d => {
        metrics.push(`${m} D${d}`);
      });
    });
    setGeneratedColumns([...baseDims, ...metrics]);

    // 2. Generate Data
    // Pass availableMedia to generator to handle dynamic types
    const data = generateReportData({
      timeDim, dateRange, projects, games, splitDimensions: sortedSplitDimensions, cohortMetrics: sortedCohortMetrics, 
      metricDays: sortedDays, media, tiers, countries, availableMedia, adMetrics
    });
    
    // 3. Generate Summary
    const summary = calculateSummary(data, { splitDimensions: sortedSplitDimensions, cohortMetrics: sortedCohortMetrics, metricDays: sortedDays, adMetrics });

    setReportData(data);
    setAppliedQueryFilters({ splitDimensions: sortedSplitDimensions, cohortMetrics: sortedCohortMetrics, metricDays: sortedDays, adMetrics });
  };

  const filteredFlatData = useMemo(() => {
     return reportData.filter(row => {
        let pass = true;
        if (cmpSearch.trim() && generatedColumns.includes('广告系列') && row['广告系列']) pass = pass && isMatch(row['广告系列'], cmpSearch, adSearchType);
        if (grpSearch.trim() && generatedColumns.includes('广告组') && row['广告组']) pass = pass && isMatch(row['广告组'], grpSearch, adSearchType);
        if (adSearch.trim() && generatedColumns.includes('广告') && row['广告']) pass = pass && isMatch(row['广告'], adSearch, adSearchType);
        return pass;
     });
  }, [reportData, cmpSearch, grpSearch, adSearch, adSearchType, generatedColumns]);

  const summaryRow = useMemo(() => {
      if (filteredFlatData.length === 0 || !appliedQueryFilters) return null;
      return calculateSummary(filteredFlatData, appliedQueryFilters);
  }, [filteredFlatData, appliedQueryFilters]);

  // Derived Drill-down & Sorted Data
  const displayData = useMemo(() => {
     if (filteredFlatData.length === 0 || !appliedQueryFilters) return [];

     const hasCmp = generatedColumns.includes('广告系列');
     const hasGrp = generatedColumns.includes('广告组');
     const hasAd = generatedColumns.includes('广告');
     const isDrillDown = hasCmp && hasGrp;

     const _sort = (arr: any[]) => {
         if (!sortConfig) return arr;
         return [...arr].sort((a,b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA === '-' || valA === undefined) valA = '';
            if (valB === '-' || valB === undefined) valB = '';
            
            if (typeof valA === 'string' && valA.endsWith('%')) valA = parseFloat(valA) || 0;
            if (typeof valB === 'string' && valB.endsWith('%')) valB = parseFloat(valB) || 0;
            if (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '') {
                valA = Number(valA);
                valB = Number(valB);
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
         });
     };

     if (!isDrillDown) {
         return _sort(filteredFlatData);
     }

     const baseGroupKeys = ['日期', '项目', ...appliedQueryFilters.splitDimensions.filter((d: string) => !AD_LEVEL_DIMENSIONS.includes(d))];
     
     const groupByKey = (data: any[], keys: string[]) => {
         const groups: Record<string, any[]> = {};
         data.forEach(row => {
             const key = keys.map(k => row[k]).join('|___|');
             if (!groups[key]) groups[key] = [];
             groups[key].push(row);
         });
         return groups;
     };

     const aggregateRowsStandalone = (data: any[], template: any) => {
          const sum = (k: string) => data.reduce((acc, curr) => acc + (Number(curr[k]) || 0), 0);
          const totalCost = sum('_cost');
          const totalInstalls = sum('_installs');
          const totalRegs = sum('_registrations');
          const totalImpressions = sum('_impressions');
          const totalClicks = sum('_clicks');
 
          const row = { ...template, _cost: totalCost, _installs: totalInstalls, _registrations: totalRegs, _impressions: totalImpressions, _clicks: totalClicks };
          row['花销'] = totalCost.toFixed(2);
          row['安装'] = totalInstalls;
          row['注册'] = totalRegs;
          row['注册率'] = totalInstalls ? ((totalRegs / totalInstalls) * 100).toFixed(2) + '%' : '0.00%';
          row['CPA'] = totalInstalls ? (totalCost / totalInstalls).toFixed(2) : '0.00';
 
          if (appliedQueryFilters.adMetrics) {
              if (appliedQueryFilters.adMetrics.includes('展示量')) row['展示量'] = totalImpressions;
              if (appliedQueryFilters.adMetrics.includes('点击量')) row['点击量'] = totalClicks;
              if (appliedQueryFilters.adMetrics.includes('CPM')) row['CPM'] = totalImpressions ? ((totalCost / totalImpressions) * 1000).toFixed(2) : '0.00';
              if (appliedQueryFilters.adMetrics.includes('CTR')) row['CTR'] = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%';
              if (appliedQueryFilters.adMetrics.includes('CVR')) row['CVR'] = totalClicks ? ((totalInstalls / totalClicks) * 100).toFixed(2) + '%' : '0.00%';
              if (appliedQueryFilters.adMetrics.includes('IR')) row['IR'] = totalImpressions ? ((totalInstalls / totalImpressions) * 100).toFixed(4) + '%' : '0.00%';
          }
 
          appliedQueryFilters.cohortMetrics.forEach((metric: string) => {
              appliedQueryFilters.metricDays.forEach((day: string) => {
                  const key = `${metric} D${day}`;
                  const d_ret = sum(`_val_留存人数_D${day}`);
                  const d_rev = sum(`_val_revenue_D${day}`);
                  row[`_val_留存人数_D${day}`] = d_ret;
                  row[`_val_revenue_D${day}`] = d_rev;
 
                  if (metric.includes('留存率')) {
                      row[key] = totalInstalls ? ((d_ret / totalInstalls) * 100).toFixed(2) + '%' : '0.00%';
                  } else if (metric.includes('留存人数')) {
                      row[key] = d_ret;
                  } else if (metric.includes('ROI')) {
                      row[key] = totalCost ? ((d_rev / totalCost) * 100).toFixed(2) + '%' : '0.00%';
                  } else if (metric.includes('LTV')) {
                      row[key] = totalInstalls ? (d_rev / totalInstalls).toFixed(2) : '0.00';
                  } else if (metric.includes('付费金额') || metric.includes('总储值')) {
                      row[key] = d_rev.toFixed(2);
                  } else {
                      row[key] = '-';
                  }
              });
          });
          return row;
     };

     const finalRows: any[] = [];
     const cmpGroupKeysArray = [...baseGroupKeys, '广告系列'];
     const cmpGroups = groupByKey(filteredFlatData, cmpGroupKeysArray);
     
     const cmpAggregates = Object.keys(cmpGroups).map(k => {
         const data = cmpGroups[k];
         const template = { ...data[0], '广告组': '-', '广告': '-', isDrillDownRow: true, level: 0, drillKey: k };
         return aggregateRowsStandalone(data, template);
     });

     const sortedCmpAggregates = _sort(cmpAggregates);

     sortedCmpAggregates.forEach(cmpRow => {
         finalRows.push(cmpRow);
         const k = cmpRow.drillKey;
         if (expandedRows[k]) {
             const cmpData = cmpGroups[k];
             const grpGroupKeysArray = [...cmpGroupKeysArray, '广告组'];
             const grpGroups = groupByKey(cmpData, grpGroupKeysArray);

             const grpAggregates = Object.keys(grpGroups).map(gk => {
                 const data = grpGroups[gk];
                 const template = { ...data[0], '广告': '-', isDrillDownRow: true, level: 1, drillKey: gk };
                 return aggregateRowsStandalone(data, template);
             });

             const sortedGrpAggregates = _sort(grpAggregates);

             sortedGrpAggregates.forEach(grpRow => {
                 finalRows.push(grpRow);
                 const gk = grpRow.drillKey;
                 if (hasAd && expandedRows[gk]) {
                     const adData = grpGroups[gk].map(row => ({ ...row, isDrillDownRow: true, level: 2 }));
                     const sortedAdData = _sort(adData);
                     sortedAdData.forEach(adRow => finalRows.push(adRow));
                 }
             });
         }
     });

     return finalRows;
  }, [filteredFlatData, expandedRows, sortConfig, appliedQueryFilters, generatedColumns]);

  // Save Report Function
  const handleSaveReport = () => {
    if (!reportName.trim()) {
      alert("请输入报表名称 (Please enter report name)");
      return;
    }
    const newReport = { id: Date.now(), name: reportName };
    const updatedReports = [...savedReports, newReport];
    setSavedReports(updatedReports);
    setSavedReportId(String(newReport.id));
    setReportName('');
    localStorage.setItem('market_reports', JSON.stringify(updatedReports));
    alert("报表保存成功 (Report Saved Successfully)");
  };

  // Fixed Export Functionality
  const handleExport = () => {
    if (filteredFlatData.length === 0) {
      alert("暂无数据可导出 (No data to export)");
      return;
    }

    const exportColumns = generatedColumns.length > 0 ? generatedColumns : Object.keys(filteredFlatData[0]).filter(k => !k.startsWith('_'));
    
    // 1. Headers
    const csvHeaders = exportColumns.join(',');

    // 2. Summary Row
    let summaryRowStr = '';
    if (summaryRow) {
      summaryRowStr = exportColumns.map((col, idx) => {
         if (idx === 0) return '汇总 Total';
         let val = summaryRow[col] !== undefined ? String(summaryRow[col]) : '-';
         if (val.includes('"') || val.includes(',')) val = `"${val.replace(/"/g, '""')}"`;
         return val;
      }).join(',') + '\n';
    }

    // 3. Data Rows
    const rowsStr = filteredFlatData.map(row => {
      return exportColumns.map(col => {
        let val = row[col] !== undefined ? String(row[col]) : '-';
        if (val.includes('"') || val.includes(',')) val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',');
    }).join('\n');

    const csvContent = `\uFEFF${csvHeaders}\n${summaryRowStr}${rowsStr}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MarketReport_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial load
  useEffect(() => {
    handleQuery();
  }, [availableMedia]); // Re-run query when media loads to correct initial "Organic" parsing if needed

  const renderDateInputs = () => {
    const inputClass = "h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none flex-1 min-w-0";
    
    switch (timeDim) {
      case 'weekly':
        return (
          <>
            <input type="week" className={inputClass} value={dateRange.start} onChange={e=>setDateRange({...dateRange, start:e.target.value})} />
            <span className="self-center text-slate-400 font-bold">至</span>
            <input type="week" className={inputClass} value={dateRange.end} onChange={e=>setDateRange({...dateRange, end:e.target.value})} />
          </>
        );
      case 'monthly':
        return (
          <>
            <input type="month" className={inputClass} value={dateRange.start} onChange={e=>setDateRange({...dateRange, start:e.target.value})} />
            <span className="self-center text-slate-400 font-bold">至</span>
            <input type="month" className={inputClass} value={dateRange.end} onChange={e=>setDateRange({...dateRange, end:e.target.value})} />
          </>
        );
      case 'yearly':
        return (
          <>
            <select className={inputClass} value={dateRange.start} onChange={e=>setDateRange({...dateRange, start:e.target.value})}>
               {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="self-center text-slate-400 font-bold">至</span>
            <select className={inputClass} value={dateRange.end} onChange={e=>setDateRange({...dateRange, end:e.target.value})}>
               {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        );
      case 'daily':
      default:
        return (
          <>
            <input type="date" className={inputClass} value={dateRange.start} onChange={e=>setDateRange({...dateRange, start:e.target.value})} />
            <span className="self-center text-slate-400 font-bold">至</span>
            <input type="date" className={inputClass} value={dateRange.end} onChange={e=>setDateRange({...dateRange, end:e.target.value})} />
          </>
        );
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      {/* --- Filter Panel --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible transition-all duration-300">
        {/* Header / Saved Reports Bar */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 rounded-t-xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
               <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Layers size={18} /></span>
               <h2 className="font-black text-slate-800 text-lg tracking-tight">综合报表</h2>
            </div>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <div className="flex items-center gap-2">
               <label className="text-xs font-bold text-slate-500 uppercase">已存报表:</label>
               <select 
                 className="h-9 bg-white border border-slate-200 rounded-lg text-sm font-bold px-3 min-w-[200px] outline-none hover:border-blue-400 focus:border-blue-500 transition-colors cursor-pointer"
                 value={savedReportId}
                 onChange={(e) => setSavedReportId(e.target.value)}
               >
                 <option value="">-- 快速加载配置 --</option>
                 {savedReports.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
               </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 h-9">
               <input 
                 type="text" 
                 placeholder="输入报表名称保存" 
                 className="text-xs outline-none w-32 font-bold bg-transparent" 
                 value={reportName} 
                 onChange={e=>setReportName(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSaveReport()}
               />
               <button onClick={handleSaveReport} className="text-blue-600 hover:text-blue-700 p-1 active:scale-90 transition-transform"><Save size={16}/></button>
             </div>
             <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
               {isExpanded ? <><ChevronUp size={14}/> 收起筛选</> : <><ChevronDown size={14}/> 展开筛选</>}
             </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className={`px-6 py-6 space-y-6 ${isExpanded ? 'block' : 'hidden'}`}>
          {/* Row 1: Time & Date */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">时间维度</label>
              <div className="relative">
                <select 
                  className="w-full h-10 px-3 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors" 
                  value={timeDim} 
                  onChange={e=>{
                    setTimeDim(e.target.value);
                    // Reset date range to logical defaults when switching
                    if(e.target.value === 'weekly') setDateRange({start: '2026-W06', end: '2026-W09'});
                    if(e.target.value === 'daily') setDateRange({start: '2026-02-01', end: '2026-02-07'});
                    if(e.target.value === 'monthly') setDateRange({start: '2026-01', end: '2026-06'});
                    if(e.target.value === 'yearly') setDateRange({start: '2024', end: '2026'});
                  }}
                >
                  {TIME_DIMENSIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">日期范围 ({timeDim})</label>
              <div className="flex gap-2">
                {renderDateInputs()}
              </div>
            </div>
          </div>

          <hr className="border-dashed border-slate-200"/>

          {/* Row 2: Project & Media */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="col-span-1">
                <MultiSelectDropdown 
                label="项目" 
                options={PROJECTS} 
                selected={projects} 
                onToggle={handleToggle(setProjects)} 
                placeholder="全部项目" 
                />
            </div>
            
            <div className="col-span-1">
                <MultiSelectDropdown label="游戏 (钻取)" options={gameOptions} selected={games} onToggle={handleToggle(setGames)} placeholder={projects.length > 0 ? "全部游戏" : "请先选项目"} />
            </div>
            
            <div className="col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">归属 (Type)</label>
                <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none cursor-pointer" value={attribution} onChange={e=>setAttribution(e.target.value)}>
                <option value="all">全部 (All)</option>
                {/* Dynamic Attribution Types */}
                {attributionOptions.filter(t => t !== 'all').map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
                </select>
            </div>

            <div className="col-span-1">
                <MultiSelectDropdown label="媒体渠道" options={mediaOptions} selected={media} onToggle={handleToggle(setMedia)} placeholder="全部媒体" searchable />
            </div>

            <div className="col-span-1">
                <MultiSelectDropdown 
                label="Tier & 分组" 
                options={tierOptions} 
                selected={tiers} 
                onToggle={handleToggle(setTiers)} 
                placeholder="All" 
                disabledOptions={disabledTierOptions}
                disabledMessage="标准分组与自定义分组互斥，且自定义分组仅支持单选"
                />
            </div>

            <div className="col-span-1">
                <MultiSelectDropdown label="国家/地区" options={countryOptions} selected={countries} onToggle={handleToggle(setCountries)} placeholder="全部国家" searchable />
            </div>
          </div>

          <hr className="border-dashed border-slate-200"/>

          {/* Row 2.5: Ad Level Search (Only show if splitDimensions includes them) */}
          {splitDimensions.some(d => AD_LEVEL_DIMENSIONS.includes(d)) && (
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
               <div className="flex flex-wrap items-center gap-4 mb-3">
                   <div className="flex items-center gap-2">
                       <Search size={14} className="text-slate-400" />
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">广告层级搜索</span>
                   </div>
                   <select 
                       className="h-8 px-2 bg-white border border-slate-200 rounded text-[11px] font-bold outline-none hover:border-blue-400 transition-colors" 
                       value={adSearchType} 
                       onChange={e=>setAdSearchType(e.target.value as any)}
                   >
                       <option value="fuzzy">模糊匹配 (Fuzzy)</option>
                       <option value="exact">精准匹配 (Exact)</option>
                   </select>
                   <span className="text-[10px] text-slate-400 font-medium">使用 <code className="bg-slate-200 px-1 rounded text-slate-600">,</code> 代表或(OR)，使用 <code className="bg-slate-200 px-1 rounded text-slate-600">&amp;</code> 代表并(AND)</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {splitDimensions.includes('广告系列') && (
                       <input 
                           type="text" 
                           placeholder="输入广告系列名称..." 
                           className="h-9 px-3 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:border-blue-500 transition-colors w-full"
                           value={cmpSearch}
                           onChange={e => setCmpSearch(e.target.value)}
                       />
                   )}
                   {splitDimensions.includes('广告组') && (
                       <input 
                           type="text" 
                           placeholder="输入广告组名称..." 
                           className="h-9 px-3 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:border-blue-500 transition-colors w-full"
                           value={grpSearch}
                           onChange={e => setGrpSearch(e.target.value)}
                       />
                   )}
                   {splitDimensions.includes('广告') && (
                       <input 
                           type="text" 
                           placeholder="输入广告名称..." 
                           className="h-9 px-3 bg-white border border-slate-200 rounded text-xs font-bold outline-none focus:border-blue-500 transition-colors w-full"
                           value={adSearch}
                           onChange={e => setAdSearch(e.target.value)}
                       />
                   )}
               </div>
            </div>
          )}

          {/* Row 3: Dimensions & Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="space-y-4">
                <MultiSelectDropdown 
                  label="拆分维度 (Group By)" 
                  options={SPLIT_DIMENSIONS} 
                  selected={splitDimensions} 
                  onToggle={handleToggle(setSplitDimensions)} 
                  placeholder="选择分组维度" 
                  disabledOptions={isAdLevelDisabled ? AD_LEVEL_DIMENSIONS : []}
                  disabledMessage="请选择单一渠道后再拆分勾选"
                />
                
                {/* Ad Frontend Data Selection */}
                <div className="pt-2">
                   <MultiSelectDropdown 
                     label="广告前端数据 (Ad Data)" 
                     options={AD_FRONTEND_METRICS} 
                     selected={adMetrics} 
                     onToggle={handleToggle(setAdMetrics)} 
                     placeholder="选择前端指标"
                     disabled={!isAdMetricsEnabled}
                     disabledMessage="请先选择已授权的媒体渠道"
                   />
                   {!isAdMetricsEnabled && media.length > 0 && (
                     <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1 font-bold">
                       <AlertCircle size={10} /> 所选媒体包含未完全授权渠道，无法查看前端数据
                     </p>
                   )}
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <MultiSelectDropdown label="同期群指标" options={COHORT_METRICS} selected={cohortMetrics} onToggle={handleToggle(setCohortMetrics)} placeholder="选择指标" />
                   <MultiSelectDropdown label="指标时间 (Days)" options={METRIC_DAYS_OPTIONS} selected={metricDays} onToggle={handleToggle(setMetricDays)} placeholder="选择天数" searchable />
                </div>
                {/* Separated Preview Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 min-h-[80px]">
                       <p className="text-[10px] text-indigo-400 font-black uppercase mb-2 flex items-center gap-1"><BarChart3 size={10}/> 已选指标 (Auto Sorted)</p>
                       <div className="flex flex-wrap gap-1.5">
                           {cohortMetrics.length === 0 && <span className="text-[10px] text-indigo-300 italic">None</span>}
                           {/* Display sorted metrics in preview to reflect final table order */}
                           {COHORT_METRIC_SORT_ORDER.filter(m => cohortMetrics.includes(m)).map(m => (
                              <span key={m} className="px-1.5 py-0.5 bg-white border border-indigo-200 text-indigo-600 rounded text-[10px] font-bold shadow-sm">{m}</span>
                           ))}
                       </div>
                   </div>
                   <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 min-h-[80px]">
                       <p className="text-[10px] text-emerald-500 font-black uppercase mb-2 flex items-center gap-1"><Clock size={10}/> 时间点 (Sorted)</p>
                       <div className="flex flex-wrap gap-1.5">
                           {metricDays.length === 0 && <span className="text-[10px] text-emerald-300 italic">None</span>}
                           {/* Use getSortedMetricDays for preview */}
                           {getSortedMetricDays().map(d => (
                              <span key={d} className="px-1.5 py-0.5 bg-white border border-emerald-200 text-emerald-600 rounded text-[10px] font-bold shadow-sm">D{d}</span>
                           ))}
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={handleExport} className="h-10 px-6 font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <FileDown size={16}/> 导出 Excel
          </button>
          <button onClick={handleQuery} className="h-10 px-10 font-bold bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
            <Search size={16}/> 生成报表
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
         <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <BarChart3 size={16} className="text-slate-400"/>
             <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Report Results ({displayData.length})</span>
           </div>
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400"><Settings2 size={16}/></button>
         </div>
         
         <div className="flex-1 overflow-auto w-full relative">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200 h-10">
                 {/* Fixed Dimension Headers */}
                 {generatedColumns.map((col, idx) => {
                   const isMetric = col.includes('D') && !['ID', '日期'].includes(col);
                   return (
                     <th onClick={() => requestSort(col)} key={idx} className={`px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap border-r border-slate-100 cursor-pointer hover:bg-slate-200 select-none ${idx < 2 ? 'sticky left-0 bg-slate-100 z-10 drop-shadow-sm' : ''} ${isMetric ? 'text-blue-600 bg-blue-50/50' : ''}`}>
                       <div className="flex items-center gap-1">
                           {col}
                           {sortConfig?.key === col && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-blue-600"/> : <ChevronDown size={12} className="text-blue-600"/>)}
                       </div>
                     </th>
                   );
                 })}
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {/* Summary Row */}
               {summaryRow && (
                 <tr className="bg-yellow-50 border-b-2 border-yellow-100 font-black shadow-sm sticky top-0 z-20">
                    {generatedColumns.map((col, idx) => (
                      <td key={idx} className={`px-4 py-3 text-xs text-yellow-800 whitespace-nowrap border-r border-yellow-100 ${idx < 2 ? 'sticky left-0 bg-yellow-50 z-20' : ''}`}>
                        {idx === 0 ? '汇总 Total' : (summaryRow[col] || '-')}
                      </td>
                    ))}
                 </tr>
               )}

               {displayData.map((row, rowIdx) => {
                 const isDrillDownRow = row.isDrillDownRow;
                 const expanded = expandedRows[row.drillKey];
                 return (
                   <tr key={row.drillKey || row.id || rowIdx} className={`hover:bg-blue-50/40 transition-colors h-10 ${isDrillDownRow && row.level === 0 ? 'bg-slate-50' : ''} ${isDrillDownRow && row.level === 1 ? 'bg-slate-50/50' : ''}`}>
                     {generatedColumns.map((col, idx) => {
                       let val = row[col];
                       let content: React.ReactNode = val || '-';
                       
                       if (isDrillDownRow) {
                           if (col === '广告系列' && row.level === 0) {
                               content = (
                                 <button onClick={() => toggleExpand(row.drillKey)} className="flex items-center gap-1 hover:text-blue-600 font-black">
                                   {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14} className="rotate-0"/>} {val}
                                 </button>
                               );
                           } else if (col === '广告组' && row.level === 1 && generatedColumns.includes('广告')) {
                               content = (
                                 <button onClick={() => toggleExpand(row.drillKey)} className="flex items-center gap-1 pl-4 hover:text-blue-600 font-black">
                                   {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14} className="rotate-0"/>} {val}
                                 </button>
                               );
                           } else if (col === '广告组' && row.level === 1) {
                               content = <span className="pl-4">{val}</span>;
                           } else if (col === '广告' && row.level === 2) {
                               content = <span className="pl-8">{val}</span>;
                           } else if ((col === '广告系列' && row.level > 0) || (col === '广告组' && row.level > 1) ) {
                               content = <span className="opacity-30">{val}</span>; // Dim parent columns
                           }
                           
                           // Clear lower level columns for parents visually
                           if (col === '广告组' && row.level === 0) content = '-';
                           if (col === '广告' && row.level <= 1) content = '-';
                       }

                       return (
                         <td key={idx} className={`px-4 py-2 text-xs font-bold text-slate-700 whitespace-nowrap border-r border-slate-50 ${idx < 2 ? 'sticky left-0 bg-white z-10 drop-shadow-[1px_0_0_rgba(0,0,0,0.05)]' : ''}`}>
                           {content}
                         </td>
                       );
                     })}
                   </tr>
                 );
               })}
               {displayData.length === 0 && (
                 <tr><td colSpan={generatedColumns.length || 1} className="text-center py-20 text-slate-300 font-bold">无数据展示 (No data to display)</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default IntegratedReport;