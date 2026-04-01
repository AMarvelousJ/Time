# 党员时间线梳理系统 (Party Member Timeline System) - 项目架构

本文档旨在帮助开发者快速理解本项目的整体架构、技术栈以及核心模块分布，以便进行二次开发和修改。

## 1. 技术栈概览

本项目是一个基于现代前端化标准构建的 Web 单页应用（SPA）。

- **框架**: [Next.js](https://nextjs.org/) (App Router 模式)
- **语言**: TypeScript
- **UI 组件库**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (无头组件库)
- **图标**: Lucide React
- **状态管理**: Zustand (用于跨组件数据流和本地持久化)
- **日期处理**: `dayjs` 和 `date-fns` (主要用于推算工作日和时间校验)

## 2. 核心目录结构

```text
party-dev-time-system/
├── app/                  # Next.js App Router 页面路由
│   ├── page.tsx          # 首页入口
│   ├── layout.tsx        # 全局根布局
│   └── person/           # 人员维度视图路由
├── components/           # React 组件
│   ├── ui/               # shadcn/ui 基础组件 (如 Button, Card, Timeline 等)
│   └── ...               # 业务级复用组件
├── lib/                  # 核心业务逻辑和工具函数
│   ├── rules/            # 时间节点双向验证逻辑 (核心)
│   └── hooks/            # 封装的 React 自定义 Hooks
├── store/                # Zustand 状态管理
│   ├── time-store.ts     # 核心：管理时间节点的状态、本地存储(localStorage)、以及联动校验
│   ├── person-store.ts   # 管理当前录入的人员列表状态
│   └── index.ts          # 统一导出
├── types/                # TypeScript 类型定义
│   ├── materials.ts      # 存放所有的节点定义 (TIME_RULES) 和规则依赖配置
│   ├── person.ts         # 人员数据结构类型
│   └── rules.ts          # 校验规则类型 (TimeRule, RuleType等)
└── utils/                # 通用工具函数 (如日期辅助函数、格式化等)
```

## 3. 核心机制解析

如果你想要修改项目，以下三个地方是你在开发中最常接触的：

### 3.1 规则配置 (`types/materials.ts`)
整个系统是**规则引擎驱动**的。所有的填报节点、前置后置依赖、时间间隔规则（如“5个工作日”、“1年”）都定义在这个文件中。
如果你需要**新增一个时间节点**或者**修改某个时间的合规限制**，首先在这里修改 `TIME_RULES` 的配置。

### 3.2 状态管理与级联计算 (`store/time-store.ts`)
项目状态使用了 Zustand。每次用户在表单里修改一个时间，`time-store.ts` 都会被触发执行以下流程：
1. 取出当前节点的新值。
2. 查找该节点的前置参考值(referenceValue)。
3. 调用 `lib/rules` 里面的逻辑进行校验。
4. 运行 `runCustomValidation` 处理复杂的跨节点业务校验（例如：支委会时间不能早于党组织意见时间）。
5. \*\*级联校验\*\*：一旦一个节点改变，系统会递归找出所有依赖该节点的所有“后置节点”，把后置节点重新校验并更新状态 (`status: 'conflict' | 'filled'`)。

如果你要**修改复杂的联动逻辑**或**修复某个极其特殊的日期间隔要求**，需要重点查看这里的 `setTimeField` 和 `runCustomValidation`。

### 3.3 基础校验器 (`lib/rules/index.ts`)
这里封装了纯数据计算函数 `validateTimeRule`。它会根据你在 materials 里配置的规则类型（如 `after`, `range`, `sync`）来对比两个日期的合法性，处理包括工作日跳过等底层计算。

## 4. 二次开发指南

1. **修改 UI 和视觉**：前往 `app/page.tsx` 和 `components/ui/`，通过 Tailwind class 或者修改 Next.js 组件来调整。
2. **调整单一节点的验证规则（例如：修改某天到某天的间隔为半年）**：到 `types/materials.ts` 里找到对应的常量 Key，修改 `config`。
3. **增加新字段录入**：
   - 步骤一：在 `types/materials.ts` 中的 `TIME_RULES` 补充该字段规则。
   - 步骤二：前往前端组件（如 `app/page.tsx` 里的表单渲染代码）增加对应的 `<Input>` 或 `DatePicker` 绑定。
4. **增加复杂的网状排斥规则**：到 `store/time-store.ts` 的 `runCustomValidation` 函数里单独增加一个 `if` 判断进行处理。

## 5. 本地运行与部署

- 安装依赖: `npm install`
- 本地开发服务器: `npm run dev`
- 生产构建: `npm run build && npm run start`
