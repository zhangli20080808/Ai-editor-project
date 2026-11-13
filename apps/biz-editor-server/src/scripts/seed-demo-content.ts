import { randomUUID } from 'node:crypto'

import mongoose, { type Document } from 'mongoose'

const demoUser = {
  username: '13800138000',
  nickName: '新潮设计',
  phoneNumber: '13800138000',
  type: 'cellphone',
  role: 'admin',
  status: 'active',
}

const scenes = [
  ['春日慢集｜城市市集邀约', '把春天装进一只帆布袋，和喜欢的人在草地上见面。', ['营销活动', '节日促销'], '#f5e7d1', '#e45e42', 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85'],
  ['留白之家｜春夏软装新章', '为日常留出呼吸感，从一张舒服的沙发开始。', ['品牌宣传', '新品发布'], '#dce3d8', '#335b4a', 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85'],
  ['夜光里程｜城市夜跑计划', '用 5 公里的微风，点亮一座城市的夜晚。', ['营销活动', '报名收集'], '#101a38', '#d8ff4e', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85'],
  ['花间练习｜周末花艺课', '把一束花插进生活，也把自己慢慢安放。', ['报名收集', '招聘报名'], '#f5e2df', '#b65066', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85'],
  ['去海边吧｜初夏轻旅行', '给生活按下暂停，去一座有风的岛上醒来。', ['商品种草', '新品发布'], '#cfe9ed', '#176b83', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85'],
  ['晨光俱乐部｜会员月度福利', '每天第一杯，留给认真生活的你。', ['商品种草', '营销活动'], '#efe1cf', '#a2522d', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85'],
] as const

type Scene = (typeof scenes)[number]

type WorksCollection = {
  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>, options: { upsert: boolean }) => Promise<unknown>
  findOne: (filter: Record<string, unknown>) => Promise<(Document & { uuid: string }) | null>
  find: (filter: Record<string, unknown>) => { toArray: () => Promise<Document[]> }
  deleteMany: (filter: Record<string, unknown>) => Promise<unknown>
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor')
  const database = mongoose.connection.db
  if (!database) throw new Error('MongoDB 连接不可用')

  const users = database.collection('users')
  const works = database.collection('works')
  const now = new Date()
  await users.updateOne(
    { phoneNumber: demoUser.phoneNumber },
    { $set: { ...demoUser, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  const user = await users.findOne({ phoneNumber: demoUser.phoneNumber })
  if (!user?._id) throw new Error('演示账号创建失败')

  for (const scene of scenes) await seedScene(works, user._id, scene, now)

  console.log(`演示内容初始化完成：${scenes.length} 份作品和 ${scenes.length} 份公开模板`)
  await mongoose.disconnect()
}

async function seedScene(works: WorksCollection, user: mongoose.Types.ObjectId, scene: Scene, now: Date) {
  const [title, desc, templateTags, backgroundColor, accentColor, coverImg] = scene
  const content = createContent(title, desc, backgroundColor, accentColor, coverImg)
  const base = {
    title,
    desc,
    content,
    publishedContent: content,
    author: demoUser.nickName,
    coverImg,
    status: 2,
    isHot: true,
    copiedCount: 0,
    viewCount: 0,
    favoriteCount: 0,
    isPublic: true,
    user,
    latestPublishAt: now,
    updatedAt: now,
  }

  const source = await upsertWork(works, { title, isTemplate: false }, {
    ...base,
    uuid: randomUUID(),
    isTemplate: false,
    sourceWorkUuid: '',
    sourceTemplateUuid: '',
    templateTags: [],
  }, now)
  await upsertWork(works, { title, isTemplate: true }, {
    ...base,
    uuid: randomUUID(),
    isTemplate: true,
    sourceWorkUuid: source.uuid,
    sourceTemplateUuid: '',
    templateTags,
  }, now)
}

async function upsertWork(works: WorksCollection, filter: Record<string, unknown>, payload: Record<string, unknown>, now: Date) {
  await works.updateOne(filter, {
    $set: payload,
    $setOnInsert: {
      channels: [{ id: randomUUID(), name: '默认', createdAt: now }],
      createdAt: now,
    },
  }, { upsert: true })
  const matches = await works.find(filter).toArray()
  const [work, ...duplicates] = matches
  if (!work) throw new Error('演示作品写入失败')
  if (duplicates.length) {
    // Historical demo data may contain matching records from an earlier import.
    await works.deleteMany({ _id: { $in: duplicates.map((item) => item._id) } })
  }
  return work as Document & { uuid: string }
}

function createContent(title: string, desc: string, backgroundColor: string, accentColor: string, coverImg: string) {
  return {
    props: { backgroundColor, backgroundImage: '', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', height: 940 },
    components: [
      image('hero', '主视觉', 0, 0, 375, 410, coverImg),
      text('kicker', '英文引导', 28, 42, 300, 24, 'DESIGNED FOR GOOD DAYS', '#ffffff', 11, '700'),
      text('headline', '主标题', 28, 86, 318, 112, title.replace('｜', '\n'), '#ffffff', 34, '700'),
      text('intro', '介绍文案', 28, 452, 319, 80, desc, '#213047', 16, '400'),
      text('benefits', '权益内容', 32, 588, 311, 90, '精选内容\n可直接二次编辑\n一键发布为 H5', '#213047', 17, '700'),
      {
        id: 'cta', name: 'l-button', layerName: '行动按钮',
        props: { label: '行动按钮', left: 28, top: 798, width: 319, height: 54, text: '立即开始体验', color: backgroundColor, backgroundColor: accentColor, fontSize: 17, borderRadius: 999 },
        events: { click: [{ type: 'track', eventName: 'demo_template_cta' }, { type: 'link', url: 'https://example.com' }] },
      },
    ],
  }
}

function text(id: string, label: string, left: number, top: number, width: number, height: number, value: string, color: string, fontSize: number, fontWeight: string) {
  return { id, name: 'l-text', layerName: label, props: { label, left, top, width, height, text: value, color, fontSize, fontWeight, fontFamily: fontSize >= 30 ? 'Georgia' : 'system-ui', lineHeight: 1.3, textAlign: 'left' } }
}

function image(id: string, label: string, left: number, top: number, width: number, height: number, src: string) {
  return { id, name: 'l-image', layerName: label, props: { label, left, top, width, height, src, alt: label, objectFit: 'cover', borderRadius: 0 } }
}

void main().catch((error: unknown) => {
  console.error(error)
  void mongoose.disconnect()
  process.exitCode = 1
})
