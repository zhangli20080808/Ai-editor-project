export interface ApiField {
  name: string
  type: string
  required?: boolean
  description: string
}

export interface ApiEndpointDoc {
  id: string
  module: string
  title: string
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  path: string
  auth: 'none' | 'bearer'
  summary: string
  request?: ApiField[]
  response: string[]
  errors: string[]
  notes: string[]
}

export const apiDocs: ApiEndpointDoc[] = [
  {
    id: 'auth-send-code',
    module: 'Auth',
    title: '发送登录验证码',
    method: 'POST',
    path: '/api/auth/send-code',
    auth: 'none',
    summary: '一期使用 mock 验证码，先跑通手机号登录闭环。',
    request: [
      {
        name: 'phoneNumber',
        type: 'string',
        required: true,
        description: '手机号。',
      },
    ],
    response: ['phoneNumber: string', 'mockCode: string', 'expiresIn: number'],
    errors: ['400 参数格式错误。'],
    notes: ['生产环境接真实短信供应商后，不再返回 mockCode。'],
  },
  {
    id: 'auth-login-by-phone',
    module: 'Auth',
    title: '手机号验证码登录',
    method: 'POST',
    path: '/api/auth/login-by-phone',
    auth: 'none',
    summary: '校验验证码，自动创建或更新手机号用户，并返回登录 token。',
    request: [
      {
        name: 'phoneNumber',
        type: 'string',
        required: true,
        description: '手机号。',
      },
      {
        name: 'code',
        type: 'string',
        required: true,
        description: '开发环境默认 123456。',
      },
    ],
    response: ['token: string', 'user: AuthUser'],
    errors: ['401 验证码错误。', '400 参数格式错误。'],
    notes: ['前端把 token 存入本地存储，请求层统一注入 Authorization。'],
  },
  {
    id: 'auth-me',
    module: 'Auth',
    title: '获取当前用户',
    method: 'GET',
    path: '/api/auth/me',
    auth: 'bearer',
    summary: '根据 Bearer token 返回当前登录用户。',
    response: ['id: string', 'username: string', 'nickName: string', 'phoneNumber: string'],
    errors: ['401 未登录或 token 无效。'],
    notes: ['B 端受保护路由依赖该接口恢复登录态。'],
  },
  {
    id: 'works-create',
    module: 'Works',
    title: '创建作品',
    method: 'POST',
    path: '/api/works',
    auth: 'bearer',
    summary: '创建作品草稿，服务端自动写入作者和默认渠道。',
    request: [
      {
        name: 'title',
        type: 'string',
        required: false,
        description: '作品标题。前端保存前要求用户填写。',
      },
      {
        name: 'desc',
        type: 'string',
        required: false,
        description: '作品描述或分享副标题。',
      },
      {
        name: 'coverImg',
        type: 'string',
        required: false,
        description: '封面图 URL。',
      },
      {
        name: 'content',
        type: 'WorkContent',
        required: false,
        description: '{ components, props: pageSetting, setting? }。',
      },
    ],
    response: ['Work'],
    errors: ['401 未登录。', '400 参数格式错误。'],
    notes: [
      '创建时 channels 自动包含“默认”渠道。',
      'author 和 user 从登录态生成，前端不传作者。',
    ],
  },
  {
    id: 'works-list',
    module: 'Works',
    title: '作品列表',
    method: 'GET',
    path: '/api/works',
    auth: 'bearer',
    summary: '查询当前用户自己的作品或模板。',
    request: [
      { name: 'page', type: 'number', description: '页码，默认 1。' },
      { name: 'pageSize', type: 'number', description: '每页数量，最大 100。' },
      { name: 'status', type: '0 | 1 | 2 | 3', description: '作品状态筛选。' },
      { name: 'isTemplate', type: 'boolean', description: '是否模板。' },
      { name: 'isPublic', type: 'boolean', description: '是否公开模板。' },
    ],
    response: ['items: Work[]', 'page: number', 'pageSize: number', 'total: number'],
    errors: ['401 未登录。'],
    notes: ['不传 status 时默认排除已删除作品。'],
  },
  {
    id: 'works-update',
    module: 'Works',
    title: '保存作品草稿',
    method: 'PATCH',
    path: '/api/works/:id',
    auth: 'bearer',
    summary: '更新作品元信息和草稿 content，不影响已发布的 publishedContent。',
    request: [
      { name: 'title', type: 'string', description: '作品标题。' },
      { name: 'desc', type: 'string', description: '作品描述。' },
      { name: 'coverImg', type: 'string', description: '封面图 URL。' },
      { name: 'content', type: 'WorkContent', description: '当前编辑器草稿内容。' },
    ],
    response: ['Work'],
    errors: ['401 未登录。', '404 作品不存在或不属于当前用户。'],
    notes: ['自动保存和手动保存都复用该接口。'],
  },
  {
    id: 'works-publish',
    module: 'Works',
    title: '发布作品',
    method: 'POST',
    path: '/api/works/:id/publish',
    auth: 'bearer',
    summary: '把当前 content 快照到 publishedContent，并将状态改为已发布。',
    response: ['Work'],
    errors: ['401 未登录。', '404 作品不存在或不属于当前用户。'],
    notes: ['重新发布不重建渠道，渠道链接必须保持稳定。'],
  },
  {
    id: 'works-template',
    module: 'Works',
    title: '发布为模板',
    method: 'POST',
    path: '/api/works/:id/template',
    auth: 'bearer',
    summary: '把作品标记为模板，并保存模板标签和公开设置。',
    request: [
      { name: 'isPublic', type: 'boolean', description: '是否公开模板。' },
      { name: 'templateTags', type: 'string[]', description: '模板标签，最多保留 10 个。' },
    ],
    response: ['Work'],
    errors: ['401 未登录。', '404 作品不存在或不属于当前用户。'],
    notes: ['模板一期不使用渠道，只有模板链接和公开设置。'],
  },
  {
    id: 'channels-create',
    module: 'Channels',
    title: '创建渠道',
    method: 'POST',
    path: '/api/works/:id/channels',
    auth: 'bearer',
    summary: '给作品新增投放渠道，服务端生成唯一 channel id。',
    request: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: '渠道名称，作品内不能重复。',
      },
    ],
    response: ['Work'],
    errors: ['400 渠道名称为空或重复。', '401 未登录。', '404 作品不存在。'],
    notes: ['渠道链接格式为 /p/:uuid?channel=:channelId。'],
  },
  {
    id: 'channels-delete',
    module: 'Channels',
    title: '删除渠道',
    method: 'DELETE',
    path: '/api/works/:id/channels/:channelId',
    auth: 'bearer',
    summary: '删除指定渠道，但至少保留一个渠道。',
    response: ['Work'],
    errors: ['400 至少保留一个渠道。', '401 未登录。', '404 渠道或作品不存在。'],
    notes: ['删除渠道不删除历史访问日志，统计页只展示当前渠道列表。'],
  },
  {
    id: 'channels-qrcode',
    module: 'Channels',
    title: '下载渠道二维码',
    method: 'GET',
    path: '/api/works/:id/channels/:channelId/qrcode',
    auth: 'bearer',
    summary: '服务端生成渠道链接二维码 PNG，并以附件形式返回。',
    response: ['Content-Type: image/png', 'Content-Disposition: attachment'],
    errors: ['401 未登录。', '404 渠道或作品不存在。'],
    notes: ['二维码尺寸为 360 x 360，链接由服务端 H5_BASE_URL 拼接。'],
  },
  {
    id: 'works-stats',
    module: 'Stats',
    title: '作品统计',
    method: 'GET',
    path: '/api/works/:id/stats',
    auth: 'bearer',
    summary: '返回作品总 PV 和分渠道 PV。',
    response: ['workUuid: string', 'totalPv: number', 'channels: { id, name, createdAt, pv }[]'],
    errors: ['401 未登录。', '404 作品不存在或不属于当前用户。'],
    notes: ['一期只做 page_view PV，不做 UV、IP 去重和设备分析。'],
  },
  {
    id: 'public-work',
    module: 'Public Works',
    title: '公开获取已发布作品',
    method: 'GET',
    path: '/api/public/works/:uuid',
    auth: 'none',
    summary: 'H5 SSR 端按 uuid 获取已发布作品，只返回 publishedContent。',
    response: ['uuid/title/desc/coverImg/channels/status/publishedContent/latestPublishAt'],
    errors: [
      '404 WORK_NOT_FOUND 作品不存在。',
      '404 WORK_UNPUBLISHED 作品尚未发布。',
      '404 WORK_DELETED 作品已删除。',
      '404 WORK_FORCE_OFFLINE 作品强制下线。',
    ],
    notes: ['H5 不读取草稿 content，避免未发布修改污染线上页面。'],
  },
  {
    id: 'public-visit',
    module: 'Public Works',
    title: 'H5 PV 上报',
    method: 'POST',
    path: '/api/public/works/:uuid/visit',
    auth: 'none',
    summary: 'H5 页面挂载后上报一次 page_view。',
    request: [
      { name: 'channel', type: 'string', description: 'URL channel 参数。' },
      { name: 'referer', type: 'string', description: '来源页面。' },
      { name: 'userAgent', type: 'string', description: '浏览器 UA。' },
    ],
    response: ['ok: true'],
    errors: ['404 作品不存在或未发布。'],
    notes: ['未知 channel 会归入默认渠道，保证统计口径完整。'],
  },
]
