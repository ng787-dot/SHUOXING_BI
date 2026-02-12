export interface Country {
  id: number;
  name: string;
  iso2: string;
  tier: string;
  code: string;
  currency: string;
}

export interface CustomTier {
  id: string;
  name: string;
  countries: string[]; // List of ISO2 codes
  createdAt: string;
}

export interface CostRecord {
  id: number;
  date: string;
  projectName: string;
  gameName: string;
  media: string;
  region: string;
  cost: string;
  currency: string;
  operator: string;
  isSystem: boolean;
}

export interface Media {
  id: number;
  name: string;
  mappingField: string;
  import: boolean;
  cpi: boolean;
  type: string;
}

export interface AppData {
  id: number;
  name: string;
  media: string;
  account: string;
  appId: string;
  appSecret: string;
  creator: string;
  createTime: string;
  status: string;
  updater: string;
  updateTime: string;
}

export interface Advertiser {
  id: number;
  name: string;
  account: string;
  media: string;
  status: string;
  updateTime: string;
}

export interface CPIData {
  id: number;
  project: string;
  game: string;
  media: string;
  region: string;
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  operator: string;
}

export interface MenuItem {
  id: string;
  icon: any;
  label: string;
  subItems?: {
    id: string;
    label: string;
    icon: any;
  }[];
}