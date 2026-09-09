# Mock 接入说明

2026-09-09：在等待后端接口期间，使用 Vite 开发服务器中间件提供本地 HTTP Mock。页面通过 `src/api` 的正常请求访问 `/portal/v1`，不直接读取模拟数据；浏览器 Network 中能查看真实请求、状态码和响应。

## 开关与下午联调

`npm run dev` 默认启用 Mock，无需安装新依赖。Mock 开启时 API 基址必须为 `/portal/v1`，不会将任何未定义接口透传到真实后端。

将根目录 `.env.example` 复制为 `.env.local`，设置以下内容并重启开发服务器：

```dotenv
VITE_ENABLE_MOCK=false
VITE_API_BASE_URL=/portal/v1
DEV_API_TARGET=http://127.0.0.1:实际后端端口
VITE_TIKTOK_AUTH_HOSTS=后端确认的授权域名
```

上面的地址和域名是占位说明，需替换实际值。域名配置只填写 hostname，多项用英文逗号分隔，外部 OAuth 地址必须为 HTTPS。切回 Mock 时将 `VITE_ENABLE_MOCK=true` 并重启。关闭 Mock 后不进行失败兜底。

只有 Vite `serve` 命令的 `development` 模式可启用 Mock；`npm run build` 即使环境变量设置为 true 仍然关闭 Mock。服务端模拟数据不进入 `dist`，登录页演示账号提示也只在开发模式动态加载。

## 账号与隔离

统一模拟密码 `Demo123!`：`demo_a`（外部公司 A）、`demo_b`（外部公司 B）、`demo_internal`（本公司）、`demo_viewer`（公司 A 查询/导出成员）。

- 公司从登录会话确定，不信任请求传入的公司身份；本公司账号也只能看到本公司的数据。
- 每家公司有 3 个账户、每账户 2 个模拟广告计划，ID 为 19 位字符串，金额为十进制字符串，币种 USD，时区 Asia/Shanghai。
- 跨公司账户、授权尝试、快照和下载记录不可访问；授权管理校验独立写权限。
- Cookie 是本机专用的 HttpOnly、SameSite=Strict Cookie，8 小时失效。生产会话、CSRF 和 OAuth 验证仍由真实后端落实。
- 数据只存在开发服务器内存中；重启会重置登录、授权状态和导出记录。多个浏览器可同时登录不同模拟公司。

## 已覆盖接口

以下接口均以 `/portal/v1` 为前缀，JSON 成功响应为 `{ code: 200, message: 'ok', data }`，错误同时使用对应 HTTP 状态码；下载和授权回调为文件响应/重定向。

| 方法 | 路径 | 模拟行为 |
| --- | --- | --- |
| POST | `/auth/login`、`/auth/logout` | 密码验证、建立/销毁会话 |
| GET | `/me` | 用户、公司类型、权限 |
| GET | `/tiktok/authorizations` | 当前公司的授权列表 |
| GET | `/tiktok/authorization-users` | 当前公司的用户名选项，返回 `{ id, username, status }[]`，查询成员也可使用 |
| POST | `/tiktok/authorizations/start` | 创建 10 分钟有效的授权尝试 |
| GET | `/tiktok/authorization-attempts/:id` | 尝试状态，校验归属 |
| GET | `/tiktok/oauth/callback` | 本地模拟回调，一次性 state，返回授权中心 |
| POST | `/tiktok/authorizations/:id/disconnect` | 断开授权，历史数据保留 |
| GET | `/tiktok/accounts`、`/tiktok/accounts/:id` | 账户列表、详情 |
| GET | `/tiktok/reports/daily/accounts`、`/tiktok/reports/daily/campaigns` | 指定日期、维度的报表 |
| GET | `/tiktok/reports/realtime/accounts`、`/tiktok/reports/realtime/campaigns` | 最新完整快照或指定快照 |
| GET | `/tiktok/sync-status` | 更新时间、10 分钟同步间隔、下次同步时间 |
| POST / GET | `/exports` | 创建导出任务、查询当前公司任务 |
| GET | `/exports/:id/download` | 下载创建任务时固定的数据，验证公司归属 |

基础页面已经消费列表、报表、授权操作和导出接口；账户详情和授权尝试查询已提供 API 方法，完整详情页与授权结果页后续继续开发。

## 查询口径与异常场景

- 支持 `page`、`page_size`（1–100）、`keyword`、`advertiser_id`；日报日期改为 `start_date`、`end_date`，格式 YYYY-MM-DD，包含首尾两日，按 Asia/Shanghai 解释。默认最近 7 天，可选今天、昨天、最近 7/30 天、本月或自定义起止日期；单次最多 31 天，不允许未来日期。API 未提供起止参数时默认当天，只提供其中一个参数返回 400。
- 日期框使用中文 Element Plus 范围日历。日报返回范围内每日明细（记录 ID 包含日期），汇总覆盖全部匹配日期；翻页、用户名筛选和导出保持同一查询条件。模拟导出覆盖全部记录，包括超过单页 100 条的范围。实时数据仍查询最近完整快照，不将历史日报与实时快照混合。
- 新增授权用户名筛选：每家公司预置 `ads_owner`（2 个账户）和 `ads_growth`（1 个账户），它们是 TT 授权用户名，与登录后台的 `demo_a` 等账号区分。授权中心、账户和报表均展示用户名；账户、日报及共用的实时报表筛选传 `authorization_id`，汇总、分页和 CSV 导出沿用此条件，并在 CSV 中附带用户名列。选择“全部授权用户”清除条件。
- 不同公司故意使用同名模拟授权用户，记录 ID 各自独立，用于验证重名不会造成跨公司查询。未知或其他公司的 `authorization_id` 返回 404。断开授权的用户仍保留在筛选选项中，供历史查询使用。
- 实时查询是当天累计值；快照 ID 每 10 分钟切换。分页继续携带原 `snapshot_id`，不将多个批次相加。汇总基于同一过滤条件的完整结果。
- 导出使用当前已查询的条件和快照，导出全量过滤结果，不只导出当前页。Mock 数据固定，不代表投放趋势预测。
- 输入不存在的账户名称可以验证空列表；错误密码验证登录失败；只读账号验证授权权限；未知/跨公司 ID 返回 404；未登录/会话过期返回 401。
- 已登录请求可增加 `mock_status=403`、`429` 或 `500` 模拟失败。例如 `/portal/v1/tiktok/accounts?mock_status=500`；正常请求默认延迟约 150ms，可配合浏览器网络节流检查加载态。
- 未定义接口返回 JSON 404，不返回页面 HTML，也不转发真实后端。

## 与真实业务的差异

模拟授权不访问 TikTok，不获取真实 token；暂未模拟完整的取消授权、账户归属待确认和异步采集状态机。模拟导出立即完成并生成 UTF-8 CSV，正式 Excel 导出、异步任务轮询和大批量数据仍待后端契约确认。首版模拟币种和时区固定，真实多币种汇总必须由接口分组，不能直接混合求和。

这里的接口字段是当前前端联调基线，下午应与后端逐项确认成功码、字段、权限、分页、时区和快照口径；如有差异，优先修改 `src/api` 和类型定义。
