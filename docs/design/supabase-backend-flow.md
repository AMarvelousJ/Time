# Supabase 后端接入设计与开发流程

## 1. 目标与阶段

本阶段目标是在不新增登录页面的前提下，完成云端数据落库与权限模型落地，并将现有前端从 `localStorage` 切换到 Supabase。

- 阶段 M1（本次）：数据库、RLS、服务端 API、前端数据访问层改造
- 阶段 M2：Supabase Auth 登录与“同学自助注册 + 管理员审核”闭环
- 阶段 M3：管理后台（系统管理员 / 普通管理员）与审计页面

## 2. 角色与隔离规则

固定三角色：

- `system_admin`：可管理所在学院全部党支部同学
- `branch_admin`：可管理所属党支部全部同学
- `student`：仅可管理本人时间线

隔离边界：

- 以党支部为最小业务隔离单元
- 系统管理员权限边界为学院
- 普通管理员一人仅负责一个党支部

## 3. 数据模型

核心表：

- `colleges`：学院
- `party_branches`：党支部（归属学院）
- `profiles`：用户资料（后续与 `auth.users` 对齐）
- `role_assignments`：角色分配
- `students`：同学档案（归属支部）
- `timeline_snapshots`：时间线快照（JSONB，按 `student_id` 唯一）
- `timeline_change_logs`：变更日志（审计）
- `registration_requests`：注册申请（待审核）

关键约束：

- `branch_admin` 在 `role_assignments` 中 `college_id` 必须为空；`party_branch_id` 可在创建账号时为空，分配党支部书记或审批通过时再写入
- `system_admin` 在 `role_assignments` 中必须带 `college_id`
- `students.profile_id` 唯一（同学账户与同学档案一对一）
- `timeline_snapshots.student_id` 唯一

## 4. 权限策略设计（RLS）

RLS 作为最终安全基线，M1 同时提供“服务端 API 强校验”以支持暂未接登录页面的开发状态。

RLS原则：

- `student`：仅访问自己 `students.id` 对应的数据
- `branch_admin`：访问本支部下所有同学
- `system_admin`：访问本学院下所有支部同学

说明：

- M1 的前端调用 Next.js API，由 API 使用 service-role 与“actor”上下文执行同等权限判断。
- M2 接入登录后，切换为用户态会话 + RLS 主导访问控制。

## 5. 前后端流程（M1）

### 5.1 同学端填报

1. 前端读取人员列表（实际为 `students`）
2. 进入同学详情页后拉取 `timeline_snapshots.snapshot`
3. 修改字段时：
   - 前端先做现有规则校验
   - 调用 API 写入快照字段
   - API 同时写 `timeline_change_logs`

### 5.2 管理端查看（M1 为接口能力，UI 后续补）

1. 管理员按角色可获取本支部/本学院同学列表
2. 可读写对应同学时间线，写入必留审计日志

### 5.3 注册审核（结构先落库）

1. 同学提交 `registration_requests`
2. 管理员审核通过后写入 `profiles + role_assignments + students`

## 6. API 与类型改造

新增 API 能力：

- `GET/POST /api/persons`
- `PATCH/DELETE /api/persons/[id]`
- `GET /api/timeline/[studentId]`
- `PUT /api/timeline/[studentId]/field`

新增前端数据访问层：

- `lib/services/person-service.ts`
- `lib/services/timeline-service.ts`

Store 改造原则：

- 保持原 `usePersonStore` / `useTimeStore` 对组件接口不变
- 移除 localStorage 读写，改为调用服务层

## 7. 测试与验收

验收标准：

- 首页同学列表读写来自 Supabase
- 同学详情时间线读写来自 Supabase
- 每次字段修改可在 `timeline_change_logs` 查到日志
- 角色校验生效（学生不可越权，普通管理员不可跨支部，系统管理员不可跨学院）
- 本地存储路径被禁用

建议测试：

- API 级权限单元测试（角色与边界）
- 手工联调：创建同学、修改字段、删除同学、回看日志

## 8. 环境变量

服务器端（必填）：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

客户端（可选，用于 API 传递临时 actor）：

- `NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID`

说明：M1 通过 `NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID` 指定当前操作用户，M2 接入认证后废弃该机制。
