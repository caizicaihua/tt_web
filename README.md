# 广告数据后台

面向企业客户的 TikTok 广告数据工作台。基于 Vue 3、TypeScript、Vite、Element Plus、Pinia 与 Axios。

## 当前完成范围

- 登录页面：企业账号/密码、密码可见切换、记住账号（不保存密码）、表单校验、失败反馈和管理员帮助。
- 项目基础：严格类型检查、统一请求、Cookie 会话、公司身份解析、受保护路由、懒加载与后台布局。
- 前端固定菜单：授权中心、广告账户、日账单；不依赖后台菜单接口。日账单支持授权用户与日期范围筛选、汇总和导出，下载记录通过导出结果链接进入。
- 开发环境 Mock：登录/退出、企业身份、授权、账户、日报、实时快照、同步状态、导出与下载。
- 登录重定向与公司身份边界测试、ESLint 和 Prettier。

当前默认运行 Mock，登录页与业务页面会明确标记模拟环境。真实业务接口与 TikTok OAuth 尚待联调；Mock 授权仅在本机完成，模拟导出为 CSV。登录页的趋势图明确标为界面示意。

## 本地运行

开发环境使用 Node.js 24.2.0（见 `.nvmrc`），依赖要求 Node.js >= 22.12.0。初始化依赖版本通过 npm 官方元信息核实，具体安装版本以 `package-lock.json` 为准。

```bash
npm ci
npm run dev
```

访问 `http://127.0.0.1:5175/login`。端口固定且启用 strictPort；如果被占用，应停止对应旧开发服务，或显式指定其他端口。

## 对接后端

将 `.env.example` 复制为 `.env.local`，设置 `VITE_ENABLE_MOCK=false`，并将 `DEV_API_TARGET` 设置为实际 Webman 服务地址，然后重启 `npm run dev`。开发服务器把 `/portal/v1` 请求代理到此后端。真实授权还需要把 `VITE_TIKTOK_AUTH_HOSTS` 配置为后端确认的 HTTPS 授权域名（英文逗号分隔，不含协议和路径）。

默认接口基址为同源 `/portal/v1`。Mock 仅在开发模式启用，优先于代理；关闭后不会在接口失败时回退到模拟数据。生产构建和静态预览均不启用 Mock。

## Mock 演示账号

统一密码为 `Demo123!`，仅用于本地模拟服务：

| 账号 | 公司 | 权限 |
| --- | --- | --- |
| `demo_a` | 星河传媒，外部企业 | 公司管理员 |
| `demo_b` | 远山科技，外部企业 | 公司管理员 |
| `demo_internal` | 本公司 | 公司管理员 |
| `demo_viewer` | 星河传媒，外部企业 | 查询、导出；不可管理授权 |

退出后换账号即可查看另一家公司，每家公司各有 3 个广告账户。模拟会话使用 HttpOnly Cookie，刷新页面保留登录；Mock 服务重启后会话、授权变更和下载任务重置。详情见 [Mock 接入说明](./docs/Mock接入说明.md)。

## 接口约定

当前脚手架基于以下待联调契约：

| 接口 | 约定 |
| --- | --- |
| `POST /portal/v1/auth/login` | 请求 `{ username, password }`；成功返回 `{ code: 200, message: "ok", data: null }` 并设置安全 HttpOnly 会话 Cookie |
| `GET /portal/v1/me` | 返回下方的用户、公司及功能权限 |
| `POST /portal/v1/auth/logout` | 销毁后端会话，返回相同成功封装 |

`/me` 示例（仅文档中的虚构结构）：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "user": { "id": "user-1", "username": "company-user", "display_name": "企业用户" },
    "company": { "id": "company-1", "name": "示例企业", "company_type": "external" },
    "permissions": ["authorizations:read", "accounts:read", "reports:read", "exports:read"]
  }
}
```

ID 必须为字符串。公司身份只接受后端返回，不从登录表单传入；浏览器不持久化会话、公司或报表。登录请求成功后还需成功读取并验证 `/me`，才进入工作台。

响应成功码暂定 200，在 `src/api/http.ts` 集中处理。正式联调时同步调整契约；后端仍须对全部查询、详情和下载强制公司范围与权限。

Axios 已配置 Cookie 凭据及 `XSRF-TOKEN` / `X-XSRF-TOKEN` 名称。同源部署时由后端建立并验证 CSRF 令牌，Cookie 的 Secure、HttpOnly、SameSite 与跨域策略由部署端落实。请勿将真实密钥、Token 或密码放进 `VITE_*` 配置。

## 检查

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

`npm run build` 包含类型检查。`npm run format` 格式化代码与配置，不批量改写需求文档。当前浏览器验证使用 Playwright CLI；完整业务完成后按前端规范新增持久化的 E2E 测试套件与 `test:e2e` 脚本。

## 部署

构建输出为 `dist/`。将静态文件放到站点资源目录，为 `/login` 和 `/portal/*` 页面配置 History 回退至 `index.html`。`/portal/v1/*` 接口与 OAuth 后端回调必须优先转发到后端，不回退为 HTML。

`npm run preview` 在 `http://127.0.0.1:4175` 检查构建产物。生产环境建议 API 与前端同源，通过反向代理接入 Webman。

## 项目约定

- [前端开发规范](./前端开发规范.md)
- [前后端开发计划](./TT客户数据平台开发计划.md)

页面位于 `src/views`，视图组件位于 `components`，流程位于 `composables`，接口调用位于 `src/api`。
