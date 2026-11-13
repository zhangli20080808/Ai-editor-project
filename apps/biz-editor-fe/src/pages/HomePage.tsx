import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  ArrowRight,
  Blocks,
  Check,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  Eye,
  Heart,
  LayoutTemplate,
  Lightbulb,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  User,
  X,
} from 'lucide-react'

import { useCurrentUserQuery } from '../api/auth'
import { getAuthToken } from '../api/authStorage'
import { getRequestErrorMessage } from '../api/error'
import {
  usePublicTemplateMutation,
  usePublicCasesQuery,
  usePublicTemplatesQuery,
} from '../api/works'
import type { Work } from '../api/types'
import heroImage from '../assets/hero.png'
import { UseTemplateConfirmModal } from '../components/UseTemplateConfirmModal'
import SpotlightCard from '../components/react-bits/SpotlightCard/SpotlightCard'
import { useFavoriteTemplates } from '../hooks/useFavoriteTemplates'

const { Paragraph, Text, Title } = Typography

const defaultTemplateTags = [
  '营销活动',
  '节日促销',
  '品牌宣传',
  '招聘报名',
  '新品发布',
  '报名收集',
  '商品种草',
]
const hotSearches = ['海报', '公众号封面', '小红书', 'PPT', '名片']
const templateSortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '热门推荐', value: 'hot' },
  { label: '使用最多', value: 'copied' },
] satisfies Array<{ label: string; value: 'latest' | 'hot' | 'copied' }>
const adminFeBaseUrl =
  import.meta.env.VITE_ADMIN_FE_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7004'
const h5BaseUrl =
  import.meta.env.VITE_H5_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7002'
const Aurora = lazy(() => import('../components/react-bits/Aurora/Aurora'))
const BlurText = lazy(() => import('../components/react-bits/BlurText/BlurText'))
const heroAuroraColors: [string, string, string] = ['#ff7a45', '#ffc069', '#3f6fff']
const demoGuideStorageKey = 'ai-editor.demo-guide-dismissed'
const aiScenes = [
  { label: '品牌宣传', value: 'brand' },
  { label: '商品种草', value: 'product' },
  { label: '活动报名', value: 'signup' },
] as const

function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [templateSort, setTemplateSort] =
    useState<(typeof templateSortOptions)[number]['value']>('latest')
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [confirmTemplate, setConfirmTemplate] = useState<Work | null>(null)
  const [demoVideoOpen, setDemoVideoOpen] = useState(false)
  const [demoGuideOpen, setDemoGuideOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(demoGuideStorageKey) !== 'true'
  })
  const templateCarouselRef = useRef<HTMLDivElement>(null)
  const demoVideoRef = useRef<HTMLVideoElement>(null)
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data
  const templatesQuery = usePublicTemplatesQuery({
    page: 1,
    pageSize: 24,
    keyword,
    sort: templateSort,
    templateTag: activeTag,
  })
  const publicCasesQuery = usePublicCasesQuery({ page: 1, pageSize: 6 })
  const useTemplateMutation = usePublicTemplateMutation()
  const favoriteTemplates = useFavoriteTemplates()
  const templates = templatesQuery.data?.items ?? []
  const publicCases = publicCasesQuery.data?.items ?? []
  const hasAuthToken = Boolean(getAuthToken())
  const userDisplayName = currentUser?.nickName || currentUser?.username
  const tags = defaultTemplateTags

  const scrollTemplateCarousel = (direction: 'left' | 'right') => {
    const carousel = templateCarouselRef.current
    if (!carousel) return

    carousel.scrollBy({
      left: direction === 'left' ? -carousel.clientWidth : carousel.clientWidth,
      behavior: 'smooth',
    })
  }

  const handleRequestUseTemplate = (template: Work) => {
    if (!getAuthToken()) {
      navigate(`/login?redirect=${encodeURIComponent('/')}`)
      return
    }

    setConfirmTemplate(template)
  }

  const handleConfirmUseTemplate = async (template: Work) => {
    setActiveTemplateId(template.uuid)
    try {
      const work = await useTemplateMutation.mutateAsync(template.uuid)
      message.success('已使用模板创建新作品')
      navigate(`/editor/${work.uuid}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    } finally {
      setActiveTemplateId(null)
      setConfirmTemplate(null)
    }
  }

  const handleHotSearch = (value: string) => {
    setSearchInput(value)
    setKeyword(value)
  }

  const handleFavoriteTemplate = (templateId: string) => {
    if (!getAuthToken()) {
      navigate(`/login?redirect=${encodeURIComponent('/')}`)
      return
    }
    favoriteTemplates.toggleFavorite(templateId)
  }

  const handleStart = () => {
    navigate(hasAuthToken ? '/works' : '/login')
  }

  const handleStartAi = (scene: (typeof aiScenes)[number]['value'] = 'brand') => {
    const target = `/editor?ai=${scene}`
    navigate(hasAuthToken ? target : `/login?redirect=${encodeURIComponent(target)}`)
  }

  const handleCloseDemoGuide = () => {
    window.localStorage.setItem(demoGuideStorageKey, 'true')
    setDemoGuideOpen(false)
  }

  const handleOpenDemoGuide = () => {
    setDemoGuideOpen(true)
  }

  const handleBrowseTemplates = () => {
    document.querySelector('.market-template-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleCloseDemoVideo = () => {
    const video = demoVideoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
    setDemoVideoOpen(false)
  }

  const handleOpenAdmin = () => {
    const token = getAuthToken()
    const targetUrl = new URL(`${adminFeBaseUrl}/login`)
    if (token) {
      targetUrl.searchParams.set('token', token)
      targetUrl.searchParams.set('redirect', '/admin/works')
    }
    window.location.href = targetUrl.toString()
  }

  return (
    <main className="workspace-page market-page">
      <section className="market-hero">
        <img className="market-hero-image" src={heroImage} alt="" />
        <div className="market-hero-overlay" />
        <div className="market-hero-aurora" aria-hidden="true">
          <Suspense fallback={null}>
            <Aurora
              amplitude={0.85}
              blend={0.62}
              colorStops={heroAuroraColors}
              speed={0.35}
            />
          </Suspense>
          <span className="market-hero-grain" />
        </div>
        <nav className="market-home-nav" aria-label="首页导航">
          <button className="market-brand-link" type="button" onClick={() => navigate('/')}>
            <span className="market-hero-logo">新</span>
            <strong>新潮设计</strong>
          </button>
          <div className="market-home-actions">
            <button
              aria-label="搜索"
              className="market-home-icon-button"
              type="button"
              onClick={() => {
                document.querySelector<HTMLInputElement>('.market-search-input')?.focus()
              }}
            >
              <Search size={18} />
            </button>
            {userDisplayName ? (
              <button
                className="market-user-pill"
                type="button"
                onClick={() => navigate('/works')}
              >
                <User size={15} />
                <span>{userDisplayName}</span>
              </button>
            ) : (
              <Button className="market-login-button" onClick={() => navigate('/login')}>
                登录
              </Button>
            )}
            <Button
              className="market-login-button"
              icon={<ShieldCheck size={15} />}
              onClick={handleOpenAdmin}
            >
              管理后台
            </Button>
            <Button type="primary" className="market-start-button" onClick={handleStart}>
              {hasAuthToken ? '进入工作台' : '立即体验'}
            </Button>
          </div>
        </nav>

        <div className="market-hero-content">
          <Suspense fallback={<h1 className="ant-typography market-reveal-title">一句话，生成你的营销页面</h1>}>
            <BlurText
              animateBy="words"
              className="ant-typography market-reveal-title"
              delay={130}
              direction="bottom"
              stepDuration={0.38}
              text="一句话，生成你的营销页面"
            />
          </Suspense>
          <Paragraph className="market-hero-subtitle">
            描述活动需求，AI Agent 完成策划、组件搭建与页面草稿
          </Paragraph>
          <div className="market-ai-actions">
            <Button
              className="market-ai-primary"
              icon={<Sparkles size={18} />}
              size="large"
              type="primary"
              onClick={() => handleStartAi()}
            >
              用 AI 创建页面 <ArrowRight size={16} />
            </Button>
            <Button
              className="market-ai-secondary market-demo-video-button"
              icon={<Play fill="currentColor" size={16} />}
              size="large"
              onClick={() => setDemoVideoOpen(true)}
            >
              观看 2 分钟演示
            </Button>
          </div>
          <button className="market-template-browse-link" type="button" onClick={handleBrowseTemplates}>
            或者先浏览精品模板 <ArrowRight size={14} />
          </button>
          <div className="market-ai-scenes" aria-label="AI 快捷场景">
            <span>快速开始</span>
            {aiScenes.map((scene) => (
              <button key={scene.value} type="button" onClick={() => handleStartAi(scene.value)}>
                <Sparkles size={13} /> {scene.label}
              </button>
            ))}
          </div>
          <div className="market-ai-flow" aria-label="AI 创作流程">
            <span>描述需求</span><i /><span>可编辑草稿</span><i /><span>保存发布</span>
          </div>
          <div className="market-search-shell" role="search">
            <Search className="market-search-leading-icon" size={20} />
            <input
              className="market-search-input"
              placeholder="搜索模板、风格、关键词..."
              value={searchInput}
              onChange={(event) => {
                const nextKeyword = event.target.value
                setSearchInput(nextKeyword)
                setKeyword(nextKeyword.trim())
              }}
            />
          </div>
          <div className="market-hot-searches">
            <span>热门搜索：</span>
            {hotSearches.map((item) => (
              <button key={item} type="button" onClick={() => handleHotSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="market-page-inner">
        <section className="market-capability-strip" aria-label="平台能力">
          <div className="market-capability-item">
            <span>
              <ShieldCheck size={26} />
            </span>
            <div>
              <Text strong>专业级品质设计</Text>
              <Paragraph type="secondary">高质量版式与组件规范，让页面从第一屏开始可信。</Paragraph>
            </div>
          </div>
          <div className="market-capability-item">
            <span>
              <Blocks size={26} />
            </span>
            <div>
              <Text strong>海量素材一键调用</Text>
              <Paragraph type="secondary">模板、封面、图片和按钮资产统一复用，快速完成搭建。</Paragraph>
            </div>
          </div>
          <div className="market-capability-item">
            <span>
              <Lightbulb size={26} />
            </span>
            <div>
              <Text strong>精致模板持续更新</Text>
              <Paragraph type="secondary">公开模板、热门标签和运营数据共同驱动内容迭代。</Paragraph>
            </div>
          </div>
        </section>

        <section className="market-template-section">
          <div className="market-section-heading">
            <div>
              <Text className="market-section-kicker">Popular Columns</Text>
              <Title level={3}>热门栏目</Title>
              <Paragraph type="secondary">
                选择一个成熟模板开始，把时间留给内容表达和投放策略。
              </Paragraph>
            </div>
            <Button type="link" onClick={() => setActiveTag('')}>
              查看全部 <ArrowRight size={15} />
            </Button>
          </div>

          <div className="market-template-toolbar">
            <div className="market-tag-filter">
              <Button type={activeTag ? 'default' : 'primary'} onClick={() => setActiveTag('')}>
                全部
              </Button>
              {tags.map((tag) => (
                <Button
                  key={tag}
                  type={activeTag === tag ? 'primary' : 'default'}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
            <Select
              className="market-template-sort"
              options={templateSortOptions}
              value={templateSort}
              onChange={setTemplateSort}
            />
          </div>

          {templatesQuery.isError ? (
            <Alert
              className="page-error-alert"
              message="公开模板加载失败"
              description={getRequestErrorMessage(templatesQuery.error)}
              type="error"
              showIcon
              action={<Button onClick={() => void templatesQuery.refetch()}>重试</Button>}
            />
          ) : null}

          <Spin spinning={templatesQuery.isLoading}>
            {templates.length > 0 ? (
              <div className="template-market-carousel">
                <Button
                  aria-label="查看上一组模板"
                  className="template-carousel-arrow template-carousel-arrow-left"
                  icon={<ChevronLeft size={20} />}
                  onClick={() => scrollTemplateCarousel('left')}
                  shape="circle"
                />
                <div className="template-market-track" ref={templateCarouselRef}>
                {templates.map((template) => (
                  <div className="template-market-slide" key={template.uuid}>
                    <PublicTemplateCard
                      active={activeTemplateId === template.uuid}
                      favorite={favoriteTemplates.isFavorite(template.uuid)}
                      template={template}
                      onFavorite={() => handleFavoriteTemplate(template.uuid)}
                      onOpen={() => navigate(`/templates/${template.uuid}`)}
                      onUse={handleRequestUseTemplate}
                    />
                  </div>
                ))}
                </div>
                <Button
                  aria-label="查看下一组模板"
                  className="template-carousel-arrow template-carousel-arrow-right"
                  icon={<ChevronRight size={20} />}
                  onClick={() => scrollTemplateCarousel('right')}
                  shape="circle"
                />
              </div>
            ) : (
              <Card className="workspace-panel empty-workspace-panel">
                <Empty
                  description="暂无公开模板，发布模板并设置公开后会展示在这里"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            )}
          </Spin>
        </section>

        <section className="market-case-section">
          <div className="market-section-heading">
            <div>
              <Text className="market-section-kicker">Selected Cases</Text>
              <Title level={3}>优秀案例</Title>
              <Paragraph type="secondary">
                看见真实作品如何表达品牌、产品与活动，只供灵感预览。
              </Paragraph>
            </div>
          </div>
          <Spin spinning={publicCasesQuery.isLoading}>
            {publicCases.length > 0 ? (
              <Row gutter={[18, 18]} className="market-case-grid">
                {publicCases.map((work) => (
                  <Col xs={24} sm={12} lg={8} key={work.uuid}>
                    <PublicCaseCard work={work} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无公开案例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Spin>
        </section>
      </div>

      <footer className="market-footer">
        <div className="market-footer-inner">
          <div>
            <strong>新潮设计</strong>
            <p>面向运营团队的 H5 模板搭建、发布与渠道统计平台。</p>
          </div>
          <div>
            <strong>关于我们</strong>
            <a>品牌故事</a>
            <a>团队介绍</a>
            <a>加入我们</a>
          </div>
          <div>
            <strong>产品</strong>
            <a>模板中心</a>
            <a>AI 生成</a>
            <a>渠道统计</a>
          </div>
          <div>
            <strong>帮助</strong>
            <a>使用文档</a>
            <a>常见问题</a>
            <a>联系我们</a>
          </div>
        </div>
        <div className="market-footer-bottom">
          Copyright 2026 新潮设计. All rights reserved. 京ICP备00000000号
        </div>
      </footer>
      <UseTemplateConfirmModal
        loading={useTemplateMutation.isPending}
        open={Boolean(confirmTemplate)}
        template={confirmTemplate}
        onCancel={() => setConfirmTemplate(null)}
        onConfirm={(template) => void handleConfirmUseTemplate(template)}
      />
      <Modal
        centered
        className="ai-demo-video-modal"
        destroyOnHidden
        footer={null}
        open={demoVideoOpen}
        title="AI Editor · 2 分钟产品演示"
        width={1120}
        onCancel={handleCloseDemoVideo}
      >
        <div className="ai-demo-video-frame">
          <video
            ref={demoVideoRef}
            autoPlay
            controls
            playsInline
            poster="/ai-editor-demo-poster.jpg"
            preload="metadata"
            src="/ai-editor-product-tour.mp4"
          >
            当前浏览器不支持视频播放。
          </video>
        </div>
        <div className="ai-demo-video-caption">
          <span>一句需求</span><i />
          <span>AI 草稿</span><i />
          <span>文案精修</span><i />
          <span>页面体检</span><i />
          <span>发布 H5</span>
        </div>
      </Modal>
      <DemoGuide
        open={demoGuideOpen}
        onBrowseTemplates={handleBrowseTemplates}
        onClose={handleCloseDemoGuide}
        onOpen={handleOpenDemoGuide}
        onStart={handleStart}
      />
    </main>
  )
}

interface PublicTemplateCardProps {
  active: boolean
  favorite: boolean
  template: Work
  onFavorite: () => void
  onOpen: () => void
  onUse: (template: Work) => void
}

function PublicTemplateCard({
  active,
  favorite,
  onFavorite,
  onOpen,
  onUse,
  template,
}: PublicTemplateCardProps) {
  return (
    <SpotlightCard className="product-template-spotlight" spotlightColor="rgba(47, 107, 255, 0.3)">
      <Card className="product-template-card" onClick={onOpen}>
      <div className="product-template-cover">
        {template.coverImg ? (
          <img src={template.coverImg} alt={template.title} />
        ) : (
          <div className="product-template-cover-placeholder">
            <LayoutTemplate size={34} />
            <span>H5</span>
          </div>
        )}
        <Tag className="product-template-badge">模板</Tag>
        <Button
          aria-label={favorite ? `取消收藏 ${template.title}` : `收藏 ${template.title}`}
          className={`product-template-favorite${favorite ? ' is-favorite' : ''}`}
          icon={<Heart fill={favorite ? 'currentColor' : 'none'} size={15} />}
          shape="circle"
          onClick={(event) => {
            event.stopPropagation()
            onFavorite()
          }}
        />
      </div>
      <div className="product-template-body">
        <Title level={5} ellipsis>
          {template.title || '未命名模板'}
        </Title>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
          {template.desc || '暂无模板描述'}
        </Paragraph>
        <Space className="product-template-author" size={6}>
          <User size={14} />
          <Text type="secondary">{template.author}</Text>
        </Space>
        <Space size={[6, 6]} wrap className="product-template-tags">
          {(template.templateTags?.length ? template.templateTags : ['未分类']).map(
            (tag) => (
              <Tag key={tag} icon={<Tags size={12} />}>
                {tag}
              </Tag>
            ),
          )}
        </Space>
        <div className="product-template-stats">
          <Tooltip title="浏览数量一期使用 PV 数据承接">
            <span>
              <Eye size={14} /> {template.viewCount ?? 0}
            </span>
          </Tooltip>
          <span>
            <Heart size={14} /> {template.favoriteCount ?? 0}
          </span>
          <span>
            <CopyPlus size={14} /> {template.copiedCount}
          </span>
        </div>
        <Button
          className="product-template-preview-button"
          block
          icon={<Eye size={15} />}
          onClick={(event) => {
            event.stopPropagation()
            onOpen()
          }}
        >
          预览详情
        </Button>
        <Button
          block
          loading={active}
          type="primary"
          onClick={(event) => {
            event.stopPropagation()
            void onUse(template)
          }}
        >
          使用模板
        </Button>
      </div>
      </Card>
    </SpotlightCard>
  )
}

function PublicCaseCard({ work }: { work: Work }) {
  const publicUrl = `${h5BaseUrl}/p/${work.uuid}`

  return (
    <Card className="market-case-card">
      <div className="market-case-cover">
        {work.coverImg ? <img src={work.coverImg} alt={work.title} /> : <LayoutTemplate size={34} />}
        <div className="market-case-cover-overlay" />
        <div className="market-case-cover-copy">
          <Text>精选案例</Text>
          <strong>{work.title}</strong>
        </div>
      </div>
      <div className="market-case-body">
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{work.desc || '暂无案例描述'}</Paragraph>
        <div className="market-case-meta">
          <span><User size={14} /> {work.author}</span>
          <span><Eye size={14} /> {work.viewCount ?? 0}</span>
        </div>
        <Button block icon={<Eye size={15} />} onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}>
          查看案例
        </Button>
      </div>
    </Card>
  )
}



interface DemoGuideProps {
  open: boolean
  onBrowseTemplates: () => void
  onClose: () => void
  onOpen: () => void
  onStart: () => void
}

function DemoGuide({ open, onBrowseTemplates, onClose, onOpen, onStart }: DemoGuideProps) {
  if (!open) {
    return (
      <Button
        aria-label="打开首次体验引导"
        className="demo-guide-trigger"
        icon={<Sparkles size={19} />}
        onClick={onOpen}
        shape="circle"
        type="primary"
      />
    )
  }

  return (
    <aside className="demo-guide" aria-label="首次体验引导">
      <button aria-label="关闭首次体验引导" className="demo-guide-close" onClick={onClose} type="button">
        <X size={16} />
      </button>
      <div className="demo-guide-mark"><Sparkles size={18} /></div>
      <div>
        <strong>3 分钟看懂平台</strong>
        <p>从一份模板开始，完成编辑、发布和查看数据。</p>
      </div>
      <ol className="demo-guide-steps">
        <li><span>1</span><div><strong>选一个模板</strong><button onClick={onBrowseTemplates} type="button">浏览热门栏目</button></div></li>
        <li><span>2</span><div><strong>编辑你的内容</strong><em>替换文字、图片和按钮</em></div></li>
        <li><span>3</span><div><strong>发布并查看效果</strong><em>生成 H5 与访问数据</em></div></li>
      </ol>
      <Button block icon={<Check size={16} />} onClick={onStart} type="primary">
        开始体验
      </Button>
    </aside>
  )
}
export default HomePage
