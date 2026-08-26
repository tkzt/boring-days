# Boring Days

Nuxt 4 + PostgreSQL 日历应用。日程可以标记为待开始、正在做、已完成、超期或决定不做，并在月历中以黄色、蓝色、绿色、红色和灰色显示。

## 使用 Docker Compose 运行

```bash
export NUXT_AUTH_SECRET="a-long-random-secret-at-least-32-characters"
export NUXT_USER_PASSWORD="a-strong-admin-password"
docker compose up --build
```

打开 `http://localhost:3000`。PostgreSQL 数据保存在具名卷 `postgres_data` 中；首次请求日程 API 时会自动创建表。
未登录时无法读取或修改日程。应用启动时会创建或更新用户名为 `admin` 的账号，其密码来自 `NUXT_USER_PASSWORD`；修改此环境变量并重启应用即可轮换密码。生产环境必须设置高强度的 `NUXT_AUTH_SECRET`，用于签名登录会话 Cookie。

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
