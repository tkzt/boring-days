# Boring Days

Nuxt 4 + PostgreSQL 日历应用。日程可以标记为待开始、正在做、已完成、超期或决定不做，并在月历中以黄色、蓝色、绿色、红色和灰色显示。

## 使用 Docker Compose 运行

先复制 `.env.example` 为 `.env`，将 `IMAGE_TAG` 改为 GitHub Actions 构建的镜像标签（`YYMMDD`，例如 `261118`），并设置以下认证变量：

```bash
export NUXT_AUTH_SECRET="a-long-random-secret-at-least-32-characters"
export NUXT_USER_PASSWORD="a-strong-admin-password"
docker compose pull app
docker compose up -d
```

镜像仓库为私有时，需要先在部署服务器执行 `docker login crpi-ajljwp276r8ux8k4.cn-shanghai.personal.cr.aliyuncs.com`。

打开 `http://localhost:3000`。PostgreSQL 数据保存在具名卷 `postgres_data` 中；首次请求日程 API 时会自动创建表。
未登录时无法读取或修改日程。应用启动时会创建或更新用户名为 `admin` 的账号，其密码来自 `NUXT_USER_PASSWORD`；修改此环境变量并重启应用即可轮换密码。生产环境必须设置高强度的 `NUXT_AUTH_SECRET`，用于签名登录会话 Cookie。

## GitHub Actions 自动构建

- 推送到 `main` 时，自动构建 Docker 镜像并上传到阿里云容器镜像仓库 `boring-plans/boring-days`。
- 向 `main` 提交 Pull Request 时，仅构建验证，不登录或推送镜像。
- 镜像标签采用构建当天的 UTC 日期 `YYMMDD`，与相邻项目一致；同一天再次推送会覆盖该日期标签。
- 工作流使用 `production` environment。请在 GitHub 仓库、组织或该 environment 中配置 Actions secrets：`ACR_USERNAME` 和 `ACR_PASSWORD`，账号需有目标镜像仓库的推送权限。

构建成功后，在服务器的 `.env` 中更新 `IMAGE_TAG`，再执行以下命令拉取镜像并更新应用：

```bash
docker compose pull app
docker compose up -d app
```

此流程只自动构建和上传镜像，不会自动更新服务器上的容器。

## 本地开发

```bash
pnpm install
docker compose up -d db
pnpm dev
```

本地开发时可创建 `.env`，或使用默认连接串。Nuxt 在运行时读取 `NUXT_DATABASE_URL`、`NUXT_AUTH_SECRET` 和 `NUXT_USER_PASSWORD`。例如：

```bash
NUXT_AUTH_SECRET="a-long-random-secret-at-least-32-characters"
NUXT_USER_PASSWORD="a-strong-admin-password"
```

生产构建：

```bash
pnpm build
```
