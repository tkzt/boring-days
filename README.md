# Boring Days

Nuxt 4 + PostgreSQL 日历应用。日程可以标记为待开始、正在做、已完成、超期或决定不做，并在月历中以黄色、蓝色、绿色、红色和灰色显示。

## 使用 Docker Compose 运行

```bash
docker compose up --build
```

打开 `http://localhost:3000`。PostgreSQL 数据保存在具名卷 `postgres_data` 中；首次请求日程 API 时会自动创建表。

## 本地开发

```bash
pnpm install
docker compose up -d db
pnpm dev
```

本地开发时可复制 `.env.example` 为 `.env`，或使用默认连接串。Nuxt 在运行时读取 `NUXT_DATABASE_URL`。生产构建：

```bash
pnpm build
```
