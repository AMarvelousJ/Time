# 发展党员时间规范管理系统

基于 Next.js App Router、TypeScript、Tailwind CSS 和 Supabase 的发展党员材料时间线管理系统。

系统面向学院党委/党支部发展党员流程，支持学生注册、管理员审批、支部管理、学生档案填报、材料时间规则校验、进度统计和云端持久化。

## 技术栈

- **框架**: Next.js 16 App Router
- **语言**: TypeScript
- **前端**: React 19、Tailwind CSS v4、shadcn/ui、lucide-react
- **状态管理**: Zustand
- **后端与数据库**: Supabase Auth、Postgres、RLS、Realtime
- **日期处理**: dayjs、date-fns

## 当前核心能力

- 系统管理员初始化与登录
- 学生账号注册与审批
- 支部管理员账号注册与审批
- 系统管理员创建党支部、分配支部管理员
- 系统管理员查看学院总览、支部列表、待审批申请
- 支部管理员查看本支部学生与待审批申请
- 学生查看自己的发展党员档案
- 发展党员 5 个阶段、27 类材料时间字段填报
- 时间规则实时校验、冲突提示、依赖字段联动
- 时间线快照持久化与修改日志记录
- 待审批申请 Realtime 刷新
- 审批/驳回后列表即时本地移除，并后台同步最新数据

## 角色与业务流程

### 系统管理员

1. 首次部署后访问系统。
2. 如果还没有系统管理员，进入 `/setup/system-admin` 完成初始化。
3. 登录后进入 `/dashboard/system`。
4. 可新增党支部、审批学生/支部管理员注册申请、查看支部详情和学生档案进度。

### 支部管理员

1. 从 `/register/branch-admin` 注册。
2. 等待系统管理员审批。
3. 审批通过后登录进入 `/dashboard/branch`。
4. 可查看本支部学生，审批本支部学生注册申请，进入学生档案详情。

### 学生

1. 从 `/register/student` 注册。
2. 等待系统管理员或对应支部管理员审批。
3. 审批通过后登录进入 `/dashboard/student`。
4. 可查看自己的发展党员档案，并进入材料时间填报页面。

## 项目结构

```text
party-dev-time-system/
├── app/                         # Next.js 页面与 API Route
│   ├── api/                     # 登录、注册、审批、仪表盘、人员、时间线接口
│   ├── dashboard/               # system / branch / student 三类仪表盘
│   ├── login/                   # 登录页
│   ├── pending/                 # 待审批提示页
│   ├── person/[id]/             # 学生档案与时间线填报页
│   ├── register/                # 学生与支部管理员注册页
│   └── setup/system-admin/      # 首个系统管理员初始化页
├── components/                  # React 组件
│   └── ui/                      # shadcn/ui 基础组件与时间线概览组件
├── lib/
│   ├── auth/                    # 浏览器 actor session 与 Supabase session 辅助逻辑
│   ├── domain/                  # 时间线领域计算、视图模型、自定义校验
│   ├── rules/                   # 通用时间规则校验器
│   ├── server/                  # 服务端 actor 鉴权、仓储、系统初始化、进度计算
│   ├── services/                # 前端 API 调用封装
│   └── supabase/                # Supabase browser/server client
├── store/                       # Zustand 本地状态
│   ├── person-store.ts
│   └── time-store.ts
├── supabase/
│   ├── migrations/              # 数据库结构、RLS、注册流程、Realtime 迁移
│   ├── seeds/                   # 开发样例数据
│   └── fresh_install.sql        # 全量初始化 SQL
├── types/                       # 业务类型、材料配置、规则类型
├── docs/
│   ├── architecture/            # 架构说明
│   └── testing/                 # 手工回归与规则用例
├── scripts/                     # 数据清理、材料生成脚本
└── utils/                       # 日期与通用工具
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填写 Supabase 配置：

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

可选本地调试变量：

```bash
NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID=
```

该变量仅用于本地开发兜底，必须指向 `auth.users` / `profiles` 中已存在的用户 ID。正常登录流程不依赖它。

### 3. 初始化数据库

推荐在 Supabase SQL Editor 执行：

```sql
-- supabase/fresh_install.sql
```

也可以按时间顺序执行 `supabase/migrations/` 下的 SQL 文件。

当前迁移包含：

- 核心业务表、RLS 与角色边界
- 注册申请与审批流程
- 未分配支部管理员注册兼容
- `registration_requests` 的 Supabase Realtime 发布配置

### 4. 可选：导入开发样例数据

```sql
-- supabase/seeds/20260416_bootstrap_sample_data.sql
```

样例数据用于本地联调三类角色和基础业务数据。

### 5. 启动开发服务

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## Supabase Realtime 注意事项

待审批申请的实时刷新依赖 Supabase Realtime。

生产环境部署时必须确保已执行：

```text
supabase/migrations/20260525_enable_registration_requests_realtime.sql
```

该迁移会将 `public.registration_requests` 加入 `supabase_realtime` publication。

如果线上管理员已经在旧版本中登录过，部署后建议退出并重新登录一次，让浏览器端 Supabase client 获取当前 Auth session。否则 Realtime 订阅可能无法按 RLS 正确接收变更。

## 常用命令

```bash
# 启动开发服务
npm run dev

# 代码检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit

# 生产构建
npm run build

# 启动生产服务
npm start

# 清理开发/mock 业务数据
npm run data:clear-mock
```

`npm run data:clear-mock` 会清理 `colleges`、`party_branches`、`profiles`、`role_assignments`、`students`、`timeline`、`registration_requests` 等业务数据。使用前请确认当前连接的是开发数据库。

## 时间线与规则引擎

材料与字段配置集中在：

```text
types/materials.ts
```

通用规则校验位于：

```text
lib/rules/
```

领域层时间线计算位于：

```text
lib/domain/timeline-engine.ts
lib/domain/custom-timeline-validators.ts
lib/domain/timeline-view-model.ts
```

系统当前覆盖 5 个发展阶段：

| 阶段 | 名称 | 主要内容 |
| --- | --- | --- |
| 1 | 入党申请阶段 | 入党申请书、谈话、公示、团推优 |
| 2 | 积极分子阶段 | 积极分子公示、备案、党校、考察、思想汇报、群众座谈 |
| 3 | 发展对象阶段 | 发展对象公示、备案、自传、政审、预审、预备党员公示 |
| 4 | 预备党员阶段 | 志愿书、票决、备案、考察、思想汇报、网络培训 |
| 5 | 转正阶段 | 转正公示、转正申请、党员基本情况登记 |

支持的规则类型包括：

| 类型 | 说明 |
| --- | --- |
| `fixed_offset` | 固定偏移规则 |
| `range` | 时间区间规则 |
| `after` | 不早于参考时间 |
| `before` | 不晚于参考时间 |
| `quarterly` | 季度性材料规则 |
| `sequential` | 顺序递进规则 |

## 服务端分层

API Route 保持请求入口职责，核心数据访问已下沉到 `lib/server/`：

- `actor-auth.ts`: 当前登录用户与角色权限判断
- `request-context.ts`: 请求上下文
- `student-repository.ts`: 学生与人员数据访问
- `timeline-repository.ts`: 时间线快照与修改日志
- `timeline-progress.ts`: 档案进度统计
- `system-admin.ts`: 系统管理员初始化与判断

前端页面通过 `lib/services/` 调用 API，避免在页面中散落 fetch 细节。

## 验证方式

重构、规则、审批或权限相关改动后，至少执行：

```bash
npm run lint
npx tsc --noEmit
npm run build
```

手工回归清单见：

```text
docs/testing/manual-regression.md
```

规则用例说明见：

```text
docs/testing/rule-cases.md
```

重点回归路径：

- 首次系统管理员初始化
- 三类角色登录与路由跳转
- 学生/支部管理员注册与审批
- 待审批申请实时刷新
- 审批/驳回后申请卡片立即消失
- 学生档案时间字段填报、冲突提示、刷新后持久化
- `timeline_change_logs` 修改日志写入

## 部署提醒

- 服务端必须配置 `SUPABASE_SERVICE_ROLE_KEY`
- 浏览器端必须配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 生产数据库必须执行最新迁移，尤其是 Realtime 相关迁移
- RLS 依赖 Supabase Auth 用户与 `profiles` / `role_assignments` 的一致性
- 线上排查审批列表延迟时，优先确认 Realtime publication、用户重新登录、浏览器控制台订阅状态

## License

MIT
