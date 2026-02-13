import { Country, CostRecord, Media, AppData, Advertiser, CPIData } from './types';

export const SYSTEM_CHANNELS = ['Facebook', 'GoogleAds', 'TiktokAds'];
export const PROJECTS = ['DawnGod', 'Fruit'];
export const REGIONS = ['US', 'AU', 'CA'];

// Helper to map ISO2 to ISO3 and Currency
const COUNTRY_META: Record<string, { code: string; currency: string }> = {
  AT: { code: 'AUT', currency: 'EUR' }, AU: { code: 'AUS', currency: 'AUD' }, CA: { code: 'CAN', currency: 'CAD' },
  CH: { code: 'CHE', currency: 'CHF' }, CN: { code: 'CHN', currency: 'CNY' }, DE: { code: 'DEU', currency: 'EUR' },
  FR: { code: 'FRA', currency: 'EUR' }, GB: { code: 'GBR', currency: 'GBP' }, HK: { code: 'HKG', currency: 'HKD' },
  JP: { code: 'JPN', currency: 'JPY' }, KR: { code: 'KOR', currency: 'KRW' }, MO: { code: 'MAC', currency: 'MOP' },
  RU: { code: 'RUS', currency: 'RUB' }, TW: { code: 'TWN', currency: 'TWD' }, US: { code: 'USA', currency: 'USD' },
  BE: { code: 'BEL', currency: 'EUR' }, CZ: { code: 'CZE', currency: 'CZK' }, DK: { code: 'DNK', currency: 'DKK' },
  ES: { code: 'ESP', currency: 'EUR' }, FI: { code: 'FIN', currency: 'EUR' }, IE: { code: 'IRL', currency: 'EUR' },
  IL: { code: 'ISR', currency: 'ILS' }, IS: { code: 'ISL', currency: 'ISK' }, IT: { code: 'ITA', currency: 'EUR' },
  MX: { code: 'MEX', currency: 'MXN' }, NL: { code: 'NLD', currency: 'EUR' }, NO: { code: 'NOR', currency: 'NOK' },
  NZ: { code: 'NZL', currency: 'NZD' }, PT: { code: 'PRT', currency: 'EUR' }, SE: { code: 'SWE', currency: 'SEK' },
  SG: { code: 'SGP', currency: 'SGD' }, SK: { code: 'SVK', currency: 'EUR' }, AE: { code: 'ARE', currency: 'AED' },
  AR: { code: 'ARG', currency: 'ARS' }, BR: { code: 'BRA', currency: 'BRL' }, ID: { code: 'IDN', currency: 'IDR' },
  IN: { code: 'IND', currency: 'INR' }, MY: { code: 'MYS', currency: 'MYR' }, PH: { code: 'PHL', currency: 'PHP' },
  PL: { code: 'POL', currency: 'PLN' }, TH: { code: 'THA', currency: 'THB' }, TR: { code: 'TUR', currency: 'TRY' },
  VN: { code: 'VNM', currency: 'VND' }, ZA: { code: 'ZAF', currency: 'ZAR' }
};

// 1. Country Data - Full list from CSV
const RAW_CSV_DATA = [
  ['奥地利','AT','T1'], ['澳大利亚','AU','T1'], ['加拿大','CA','T1'], ['瑞士','CH','T1'], ['中国','CN','T1'],
  ['德国','DE','T1'], ['法国','FR','T1'], ['英国','GB','T1'], ['香港','HK','T1'], ['日本','JP','T1'],
  ['韩国','KR','T1'], ['澳门','MO','T1'], ['俄罗斯','RU','T1'], ['台湾','TW','T1'], ['美国','US','T1'],
  ['比利时','BE','T2'], ['捷克共和国','CZ','T2'], ['丹麦','DK','T2'], ['西班牙','ES','T2'], ['芬兰','FI','T2'],
  ['爱尔兰','IE','T2'], ['以色列','IL','T2'], ['冰岛','IS','T2'], ['意大利','IT','T2'], ['墨西哥','MX','T2'],
  ['荷兰','NL','T2'], ['挪威','NO','T2'], ['新西兰','NZ','T2'], ['葡萄牙','PT','T2'], ['瑞典','SE','T2'],
  ['新加坡','SG','T2'], ['斯洛伐克','SK','T2'], ['阿拉伯联合酋长国','AE','T3'], ['阿根廷','AR','T3'], ['保加利亚','BG','T3'],
  ['巴西','BR','T3'], ['白俄罗斯','BY','T3'], ['希腊','GR','T3'], ['克罗地亚','HR','T3'], ['匈牙利','HU','T3'],
  ['印度尼西亚','ID','T3'], ['印度','IN','T3'], ['伊朗','IR','T3'], ['科威特','KW','T3'], ['缅甸','MM','T3'],
  ['马来西亚','MY','T3'], ['阿曼','OM','T3'], ['菲律宾','PH','T3'], ['波兰','PL','T3'], ['罗马尼亚','RO','T3'],
  ['沙特阿拉伯','SA','T3'], ['泰国','TH','T3'], ['土耳其','TR','T3'], ['乌克兰','UA','T3'], ['越南','VN','T3'],
  ['南非','ZA','T3'], ['安哥拉','AO','T3'], ['阿塞拜疆','AZ','T3'], ['孟加拉国','BD','T3'], ['刚果民主共和国','CD','T3'],
  ['智利','CL','T3'], ['哥伦比亚','CO','T3'], ['哥斯达黎加','CR','T3'], ['阿尔及利亚','DZ','T3'], ['厄瓜多尔','EC','T3'],
  ['埃及','EG','T3'], ['埃塞俄比亚','ET','T3'], ['加纳','GH','T3'], ['危地马拉','GT','T3'], ['肯尼亚','KE','T3'],
  ['哈萨克斯坦','KZ','T3'], ['斯里兰卡','LK','T3'], ['立陶宛','LT','T3'], ['卢森堡','LU','T3'], ['摩洛哥','MA','T3'],
  ['尼日利亚','NG','T3'], ['秘鲁','PE','T3'], ['巴基斯坦','PK','T3'], ['波多黎各','PR','T3'], ['卡塔尔','QA','T3'],
  ['塞尔维亚','RS','T3'], ['苏丹','SD','T3'], ['斯洛文尼亚','SI','T3'], ['土库曼斯坦','TM','T3'], ['突尼斯','TN','T3'],
  ['坦桑尼亚','TZ','T3'], ['乌拉圭','UY','T3'], ['乌兹别克斯坦','UZ','T3'], ['委内瑞拉','VE','T3'], ['也门','YE','T3'],
  ['安道尔','AD','T3'], ['阿富汗','AF','T3'], ['安提瓜和巴布达','AG','T3'], ['安圭拉','AI','T3'], ['阿尔巴尼亚','AL','T3'],
  ['亚美尼亚','AM','T3'], ['荷属安的列斯','AN','T3'], ['美属萨摩亚','AS','T3'], ['阿鲁巴','AW','T3'], ['波斯尼亚和黑塞哥维那','BA','T3'],
  ['巴巴多斯','BB','T3'], ['布基纳法索','BF','T3'], ['巴林','BH','T3'], ['布隆迪','BI','T3'], ['贝宁','BJ','T3'],
  ['圣巴泰勒米','BL','T3'], ['百慕大','BM','T3'], ['文莱','BN','T3'], ['玻利维亚','BO','T3'], ['巴哈马','BS','T3'],
  ['不丹','BT','T3'], ['博茨瓦纳','BW','T3'], ['伯利兹','BZ','T3'], ['科科斯群岛','CC','T3'], ['中非共和国','CF','T3'],
  ['刚果共和国','CG','T3'], ['象牙海岸','CI','T3'], ['库克群岛','CK','T3'], ['喀麦隆','CM','T3'], ['古巴','CU','T3'],
  ['佛得角','CV','T3'], ['库拉索','CW','T3'], ['圣诞岛','CX','T3'], ['塞浦路斯','CY','T3'], ['吉布提','DJ','T3'],
  ['多米尼加','DM','T3'], ['多米尼加共和国','DO','T3'], ['爱沙尼亚','EE','T3'], ['西撒哈拉','EH','T3'], ['厄立特里亚','ER','T3'],
  ['斐济','FJ','T3'], ['福克兰群岛','FK','T3'], ['密克罗尼西亚','FM','T3'], ['法罗群岛','FO','T3'], ['加蓬','GA','T3'],
  ['格林纳达','GD','T3'], ['格鲁吉亚','GE','T3'], ['根西岛','GG','T3'], ['直布罗陀','GI','T3'], ['格陵兰','GL','T3'],
  ['冈比亚','GM','T3'], ['几内亚','GN','T3'], ['赤道几内亚','GQ','T3'], ['关岛','GU','T3'], ['几内亚比绍','GW','T3'],
  ['圭亚那','GY','T3'], ['洪都拉斯','HN','T3'], ['海地','HT','T3'], ['马恩岛','IM','T3'], ['英属印度洋领地','IO','T3'],
  ['伊拉克','IQ','T3'], ['新泽西','JE','T3'], ['牙买加','JM','T3'], ['约旦','JO','T3'], ['吉尔吉斯斯坦','KG','T3'],
  ['柬埔寨','KH','T3'], ['基里巴斯','KI','T3'], ['科摩罗','KM','T3'], ['圣基茨和尼维斯','KN','T3'], ['朝鲜','KP','T3'],
  ['开曼群岛','KY','T3'], ['老挝','LA','T3'], ['黎巴嫩','LB','T3'], ['圣卢西亚','LC','T3'], ['列支敦士登','LI','T3'],
  ['利比里亚','LR','T3'], ['莱索托','LS','T3'], ['拉脱维亚','LV','T3'], ['利比亚','LY','T3'], ['摩纳哥','MC','T3'],
  ['摩尔多瓦','MD','T3'], ['黑山','ME','T3'], ['法属圣马丁','MF','T3'], ['马达加斯加','MG','T3'], ['马绍尔群岛','MH','T3'],
  ['马其顿','MK','T3'], ['马里','ML','T3'], ['蒙古','MN','T3'], ['北马里亚纳群岛','MP','T3'], ['毛里塔尼亚','MR','T3'],
  ['蒙特塞拉特','MS','T3'], ['马耳他','MT','T3'], ['毛里求斯','MU','T3'], ['马尔代夫','MV','T3'], ['马拉维','MW','T3'],
  ['莫桑比克','MZ','T3'], ['纳米比亚','NA','T3'], ['新喀里多尼亚','NC','T3'], ['尼日尔','NE','T3'], ['尼加拉瓜','NI','T3'],
  ['尼泊尔','NP','T3'], ['瑙鲁','NR','T3'], ['纽埃','NU','T3'], ['巴拿马','PA','T3'], ['法属波利尼西亚','PF','T3'],
  ['巴布亚新几内亚','PG','T3'], ['圣皮埃尔和密克隆','PM','T3'], ['皮特凯恩群岛','PN','T3'], ['巴勒斯坦','PS','T3'], ['帕劳','PW','T3'],
  ['巴拉圭','PY','T3'], ['留尼旺岛','RE','T3'], ['卢旺达','RW','T3'], ['所罗门群岛','SB','T3'], ['塞舌尔','SC','T3'],
  ['圣赫勒拿','SH','T3'], ['斯瓦尔巴德和扬·梅恩','SJ','T3'], ['塞拉利昂','SL','T3'], ['圣马力诺','SM','T3'], ['塞内加尔','SN','T3'],
  ['索马里','SO','T3'], ['苏里南','SR','T3'], ['南苏丹','SS','T3'], ['圣多美和普林西比','ST','T3'], ['萨尔瓦多','SV','T3'],
  ['荷属圣马丁','SX','T3'], ['叙利亚','SY','T3'], ['斯威士兰','SZ','T3'], ['特克斯和凯科斯群岛','TC','T3'], ['乍得','TD','T3'],
  ['多哥','TG','T3'], ['塔吉克斯坦','TJ','T3'], ['托克劳','TK','T3'], ['东帝汶','TL','T3'], ['汤加','TO','T3'],
  ['特立尼达和多巴哥','TT','T3'], ['图瓦卢','TV','T3'], ['乌干达','UG','T3'], ['梵蒂冈','VA','T3'], ['圣文森特和格林纳丁斯','VC','T3'],
  ['英属维京群岛','VG','T3'], ['美属维尔京群岛','VI','T3'], ['瓦努阿图','VU','T3'], ['瓦利斯和富图纳','WF','T3'], ['萨摩亚','WS','T3'],
  ['科索沃','XK','T3'], ['马约特','YT','T3'], ['赞比亚','ZM','T3'], ['津巴布韦','ZW','T3']
];

export const COUNTRY_FULL_DATA: Country[] = RAW_CSV_DATA.map((item, index) => {
  const [name, iso2, tier] = item;
  const meta = COUNTRY_META[iso2] || { 
    // Fallback logic for ISO3 and Currency if not in our top common list
    code: iso2.length === 2 ? `${iso2}X` : iso2, 
    currency: 'USD' // Default to USD for uncommon T3/T4 for now
  };

  return {
    id: index + 1,
    name,
    iso2,
    tier,
    code: meta.code,
    currency: meta.currency
  };
});


// 2. Cost Data Generator
const generateCostData = (): CostRecord[] => {
  return Array.from({ length: 100 }).map((_, i) => {
    const project = PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
    const media = [...SYSTEM_CHANNELS, 'ASA'][Math.floor(Math.random() * 4)];
    let platform = ['Android', 'iOS', 'Huawei'][Math.floor(Math.random() * 3)];
    if (media === 'ASA') platform = 'iOS';
    return {
      id: i + 1,
      date: `2026-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      projectName: project === 'DawnGod' ? 'Dawn God' : 'Fruit',
      gameName: `${project}-${platform}`,
      media: media,
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      campaign: '-',
      adGroup: '-',
      ad: '-',
      cost: (Math.random() * 1000).toFixed(2), 
      currency: 'USD',
      operator: media === 'ASA' ? '邓文豪' : '系统拉取',
      isSystem: media !== 'ASA'
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
};
export const INITIAL_COST_DATA = generateCostData();

// 3. Media Data
export const INITIAL_MEDIA_DATA: Media[] = [
  { id: 1, name: 'GoogleAds', mappingField: 'google_ads', import: false, cpi: false, type: '广告' },
  { id: 2, name: 'Facebook', mappingField: 'Facebook,Instagram,Unattributed', import: false, cpi: false, type: '广告' },
  { id: 3, name: 'ASA', mappingField: 'apple_search_ads', import: false, cpi: false, type: '广告' },
  { id: 4, name: 'TiktokAds', mappingField: 'tiktok', import: false, cpi: false, type: '广告' },
  { id: 5, name: 'Unity', mappingField: 'unity_ads', import: true, cpi: false, type: '广告' },
  { id: 6, name: 'IronSource', mappingField: 'iron_source', import: true, cpi: false, type: '广告' },
  { id: 7, name: 'Applovin', mappingField: 'applovin', import: true, cpi: false, type: '广告' },
  // Added requested items
  { id: 8, name: 'Organic', mappingField: 'organic', import: false, cpi: false, type: '自然量' },
  { id: 9, name: 'KOL_达达', mappingField: 'kol_dada_onelink', import: true, cpi: false, type: '营销' },
];

// 4. App Data
export const INITIAL_APP_DATA: AppData[] = [
  { 
    id: 1, name: 'DawnGod', media: 'TikTok', account: 'shuoxing@gmail.com', appId: 'XXXXXXXX', appSecret: 'XXXXXXXX', 
    creator: '邓文豪', createTime: '2026/02/11 10:00:00', status: '开启', updater: '邓文豪', updateTime: '2026/02/11 10:00:00' 
  },
  { 
    id: 2, name: 'DawnGod', media: 'Facebook', account: 'shuoxing@gmail.com', appId: 'XXXXXXXX', appSecret: 'XXXXXXXX', 
    creator: '邓文豪', createTime: '2026/02/11 10:00:00', status: '开启', updater: '邓文豪', updateTime: '2026/02/11 10:00:00' 
  },
  { 
    id: 3, name: 'DawnGod', media: 'Google Ads', account: 'shuoxing@gmail.com', appId: 'XXXXXXXX', appSecret: 'XXXXXXXX', 
    creator: '邓文豪', createTime: '2026/02/11 10:00:00', status: '开启', updater: '邓文豪', updateTime: '2026/02/11 10:00:00' 
  }
];

// 5. Advertiser Data
export const INITIAL_AD_DATA: Advertiser[] = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1, name: 'XXXXXXXXXXXXX', account: 'XXXXXXXXXXXXX', 
  media: ['Facebook', 'Google Ads', 'TikTok'][Math.floor(Math.random() * 3)], 
  status: '可用', updateTime: new Date().toLocaleString()
}));

// 6. CPI Data
export const INITIAL_CPI_DATA: CPIData[] = [
  { id: 1, project: 'DawnGod', game: 'DawnGod-Android', media: 'Noxmobi', region: 'US', price: 4, currency: 'USD', startDate: '2026/02/11', endDate: '2026/02/20', operator: '邓文豪' },
  { id: 2, project: 'DawnGod', game: 'DawnGod-Android', media: 'Noxmobi', region: 'US', price: 6, currency: 'USD', startDate: '2026/02/20', endDate: '-', operator: '邓文豪' },
  { id: 3, project: 'DawnGod', game: 'DawnGod-Android', media: 'Noxmobi', region: 'CA', price: 5, currency: 'USD', startDate: '2026/02/11', endDate: '-', operator: '邓文豪' },
];