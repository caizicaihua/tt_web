// Sidebar entries are fixed in the frontend; no menu API is required.
export const portalMenus = [
  {
    path: '/portal/authorizations',
    title: '授权中心',
    icon: 'Connection',
    permission: 'authorizations:read',
    description: '连接 TikTok，开始同步广告账户与投放数据。',
  },
  {
    path: '/portal/accounts',
    title: '广告账户',
    icon: 'Wallet',
    permission: 'accounts:read',
    description: '统一查看广告账户信息、状态与同步进度。',
  },
  {
    path: '/portal/daily',
    title: '日账单',
    icon: 'Calendar',
    permission: 'reports:read',
    description: '按日期范围与授权用户查看广告日账单及系列明细。',
  },
] as const

export const portalPages = [
  ...portalMenus,
  {
    path: '/portal/realtime',
    title: '实时数据',
    icon: 'DataLine',
    permission: 'reports:read',
    description: '掌握每 10 分钟更新的广告投放数据。',
  },
  {
    path: '/portal/downloads',
    title: '下载记录',
    icon: 'Download',
    permission: 'exports:read',
    description: '查看报表导出进度，下载已生成的文件。',
  },
] as const

export const DEFAULT_PORTAL_PATH = '/portal/authorizations'

export function firstAvailablePage(permissions: string[]) {
  return portalMenus.find((page) => permissions.includes(page.permission))?.path || '/403'
}
