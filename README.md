# 发展党员时间规范管理系统

基于 Next.js (App Router) + Tailwind CSS + TypeScript 的发展党员时间规范管理系统。

## 技术栈

- **框架**: Next.js 15+ (App Router)
- **样式**: Tailwind CSS v4
- **语言**: TypeScript
- **UI 组件**: shadcn/ui
- **状态管理**: Zustand
- **日期处理**: dayjs

## 项目结构

```
party-dev-time-system/
├── app/                    # Next.js App Router 页面目录
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   ├── dashboard/          #  dashboard 页面
│   └── person/             # 人员详情/填报页面
├── components/             # React 组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── layout/             # 布局组件
│   └── timeline/           # 时间轴组件
├── lib/                    # 工具库
│   ├── utils.ts            # 通用工具函数
│   └── rules/              # 时间规则引擎
├── store/                  # Zustand 状态管理
│   ├── person-store.ts     # 人员状态管理
│   └── time-store.ts       # 时间字段状态管理
├── types/                  # TypeScript 类型定义
│   ├── person.ts           # 人员相关类型
│   ├── rules.ts            # 规则相关类型
│   └── materials.ts        # 27 个材料配置
├── utils/                  # 工具函数
│   └── date-utils.ts       # 日期处理工具
├── public/                 # 静态资源
├── components.json         # shadcn/ui 配置
├── tailwind.config.ts      # Tailwind 配置
└── tsconfig.json           # TypeScript 配置
```

## 目录说明

### `app/`
Next.js App Router 页面目录，采用文件系统路由。
- `app/page.tsx` - 首页（人员列表）
- `app/person/[id]/` - 人员详情/填报页面

### `components/`
React 组件目录：
- `components/ui/` - shadcn/ui 基础组件（Button, Input, Dialog, DatePicker, Calendar, Accordion 等）
- `components/layout/` - 布局组件（Header, Sidebar 等）
- `components/timeline/` - 时间轴概览组件

### `lib/`
核心工具库：
- `lib/utils.ts` - 通用工具函数（cn 类名合并等）
- `lib/rules/validator.ts` - 时间规则验证引擎

### `store/`
Zustand 状态管理：
- `person-store.ts` - 管理人员列表、当前选中人员
- `time-store.ts` - 管理时间字段、校验状态、历史记录（按人员 ID 隔离）

### `types/`
TypeScript 类型定义：
- `person.ts` - Person, PersonStatus 等
- `rules.ts` - RuleType, TimeRule 等
- `materials.ts` - STAGES(5 阶段), MATERIALS(27 材料), TIME_RULES, FIELD_LABELS

### `utils/`
业务工具函数：
- `date-utils.ts` - 基于 dayjs 的日期处理（工作日计算等）

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 添加 shadcn/ui 组件
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add accordion
```

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 功能模块

### 阶段一：基础功能（P0）✅
- [x] US-01: 新建/选择发展对象
- [x] US-02: 查看材料时间填报页面
- [x] US-03: 填写单个时间字段
- [x] US-04: 实时校验时间逻辑冲突
- [x] US-05: 智能推荐下一个时间范围
- [x] US-06: 保存填报进度（localStorage 持久化）

### 阶段二：高级功能（P1）✅
- [x] US-07: 查看已填时间概览（时间轴）
- [ ] US-08: Excel 导入数据

## 已实现功能详情

### 1. 人员管理
- 创建发展对象
- 人员列表展示
- 切换不同人员（数据隔离）

### 2. 材料填报
- 5 个阶段 accordion 折叠展开
- 27 个材料完整覆盖
- 进度条显示完成度

### 3. 时间规则校验
- 依赖锁定：前置条件未满足时禁用日期选择器
- 实时校验：填写后立即验证时间逻辑
- 冲突显示：红色标记冲突字段并显示错误信息
- 智能推荐：蓝色提示推荐时间范围

### 4. 时间轴概览
- 按时间顺序展示所有已填字段
- 阶段颜色编码（5 种颜色）
- 冲突字段标记与错误提示
- 统计卡片（总数/正常/冲突）

### 5. 本地存储
- 人员数据 localStorage 持久化
- 时间字段按人员 ID 隔离存储
- 修改历史记录

## 规则引擎

系统支持以下时间规则类型：

| 类型 | 说明 | 示例 | 配置参数 |
|------|------|------|----------|
| `fixed_offset` | 固定偏移 | 收到申请书 1 个月内 | `offset: 30, unit: 'days', direction: 'after'` |
| `range` | 时间区间 | 谈话后，公示 5 工作日 | `minDays: 0, maxDays: 5, workdays: true` |
| `after` | 晚于某时间 | 座谈会满一年后 | `minDays: 365` |
| `before` | 早于某时间 | 预备期满前半个月 | `maxDays: 15` |
| `quarterly` | 季度性 | 每季度 1 篇思想汇报 | `minDays: 0, maxDays: 90` |
| `sequential` | 顺序递进 | 依次递进即可 | `{}` |

### 错误提示示例

- **fixed_offset**: 时间不得早于入党申请时间，并且在入党申请时间后一个月内
- **range**: 时间需晚于入党申请人谈话时间
- **after**: 时间必须晚于参考时间至少 X 天
- **before**: 时间必须早于参考时间

## 5 个发展阶段

| 阶段 | 名称 | 材料数量 | 材料列表 |
|------|------|----------|----------|
| 1 | 入党申请阶段 | 4 | 入党申请书、入党申请人谈话表、入党申请人情况公示、团推优 |
| 2 | 积极分子阶段 | 6 | 入党积极分子公示单、入党积极分子备案登记表、党校结业证明、入党积极分子考察登记表、思想汇报 (4 篇)、群众座谈会纪录表 |
| 3 | 发展对象阶段 | 8 | 发展对象名单公示、发展对象确定备案表、个人自传、直系亲属政审表、综合政审表、网络党校学时证明、预审情况登记表、预备党员公示单 |
| 4 | 预备党员阶段 | 6 | 入党志愿书、票决材料、接收预备党员备案表、预备党员考察表、预备党员思想汇报 (4 篇)、预备党员网络培训证明 |
| 5 | 转正阶段 | 3 | 预备党员转正公示单、转正申请书、党员基本情况登记表 |

## 数据存储

- 使用浏览器 localStorage 进行本地持久化存储
- 存储键：
  - `party_dev_persons` - 人员列表数据
  - `party_dev_time_fields` - 时间字段数据（按人员 ID 隔离）
- 每个发展对象的数据完全隔离
- 支持修改历史记录和恢复

## 待开发功能

- **US-08**: Excel 导入数据
- **历史记录 UI**: 查看和恢复修改历史
- **智能推荐增强**: 更详细的时间范围推荐提示

## 隐私说明

- 所有数据仅存储在用户浏览器本地
- 不会上传到任何服务器
- 无需账号登录即可使用

## License

MIT
