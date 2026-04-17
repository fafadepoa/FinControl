# Deploy (Vercel + Supabase)

## 1) Pré-requisitos
- Projeto conectado ao GitHub e importado na Vercel.
- Projeto PostgreSQL criado no Supabase.
- Domínio de e-mail verificado no Resend (se envio de e-mail estiver ativo).

## 2) Variáveis de ambiente na Vercel
Configure em `Production` e `Preview` e marque-as para estarem disponíveis no **build** (na edição da variável, inclua o ambiente correto).

- `DATABASE_URL` (pooler do Supabase, porta 6543)
- `DIRECT_URL` (no Supabase: use o **Session pooler** na porta 5432 se `db.xxx.supabase.co:5432` não conectar por IPv4)
- `AUTH_SECRET` (string aleatória longa)
- `NEXTAUTH_URL` (URL final da aplicação)
- `APP_BASE_URL` (URL final da aplicação)
- `APP_NAME`
- `APP_LOGO_URL`
- `MAIL_FROM`
- `RESEND_API_KEY`

## 3) Aplicar migrations no banco de produção
As migrations foram preparadas para baseline PostgreSQL.

No seu terminal local (apontando para o banco de produção):

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

Opcional (popular dados iniciais):

```bash
npm run db:seed
```

## 4) Build/deploy
- Build command na Vercel: `npm run build`
- Start command: `npm run start`

## 5) Checklist de validação pós-deploy
- Landing pública abre sem erro.
- Cadastro admin funciona.
- Login admin em `/admin/login` funciona.
- Login colaborador em `/login` funciona.
- Recuperação de senha funciona.
- Logs da Vercel sem erro de Prisma/Auth.
