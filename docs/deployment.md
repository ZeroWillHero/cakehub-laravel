# Deployment Guide — AWS EC2 + Docker + GitHub Actions + Supabase

This is the step-by-step walkthrough for the manual parts of deploying CakeHub. The code/config side (Dockerfile, docker-compose.yml, Caddyfile, GitHub Actions workflow) is already committed to the repo — this doc covers what only you can do: provisioning accounts, creating the EC2 instance and Supabase project, and setting GitHub secrets.

Related files:
- [`Dockerfile`](../Dockerfile) — multi-stage build (Node asset build → Composer vendor install → PHP-FPM/nginx runtime).
- [`docker-compose.yml`](../docker-compose.yml) — `caddy` (TLS/reverse proxy), `app`, `queue` services.
- [`Caddyfile`](../Caddyfile) — reverse proxy + automatic HTTPS config.
- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — CI/CD pipeline.
- [`.env.production`](../.env.production) — template of the production env vars (not committed to git; fill in real values locally before encoding).

---

## 1. Create the Supabase project (database)

1. Go to [supabase.com](https://supabase.com) and create a new project.
   - Pick a region close to your EC2 instance's region to minimize latency.
   - Save the database password you set — you'll need it below.
2. Once the project is provisioned, go to **Database → Extensions** and enable **`postgis`**. This is required — CakeHub's `addresses` and `sellers` tables use `geography(Point, 4326)` columns for "nearby seller" search, and migrations will fail without it.
3. Go to **Project Settings → Database** and copy the **connection info** (not the pooled/pgbouncer string — CakeHub connects directly):
   - Host (e.g. `db.<project-ref>.supabase.co`)
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: the one you set in step 1

These map directly to `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in your `.env`.

## 2. Create the EC2 instance

1. Launch an EC2 instance (Ubuntu 24.04 LTS recommended). A `t3.small` or larger is reasonable for a Laravel app; size up if traffic grows.
2. Security group: allow inbound **22** (SSH, ideally restricted to your IP), **80** and **443** (HTTP/HTTPS, from anywhere).
3. Point your domain's DNS **A record** at the instance's public IP. Caddy needs this to be resolvable before it can issue a Let's Encrypt certificate.
4. SSH into the instance and install Docker + the Compose plugin:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   sudo apt-get install -y docker-compose-plugin
   ```
   Log out and back in for the group change to apply.
5. Create the deploy directory the GitHub Actions workflow expects:
   ```bash
   mkdir -p ~/cake-hub
   ```

## 3. Point the Docker image at your GitHub repo

[`docker-compose.yml`](../docker-compose.yml) currently references `ghcr.io/OWNER/cake-hub:latest` as a placeholder. Replace `OWNER` with your actual GitHub username/org (matches `${{ github.repository }}` in the workflow, e.g. `ghcr.io/ZeroWillHero/cake-hub:latest`) in both places in the file, then commit the change.

## 4. Set your real domain in the Caddyfile

Edit [`Caddyfile`](../Caddyfile) and replace `your-domain.com` with your actual domain, then commit.

## 5. Make the GHCR package pullable from EC2

By default a GHCR package created via Actions may be private. Either:
- Make the package public (Package settings on github.com → Change visibility → Public), **or**
- Keep it private and rely on the `docker login` step already in the deploy workflow (it uses `GITHUB_TOKEN`, which only has read access during that job — for pulling from EC2 separately, you'd need a GitHub **Personal Access Token** with `read:packages` scope instead, since the deploy script logs in with `secrets.GITHUB_TOKEN` in the SSH session).

Simplest for a single-instance setup: make the package public.

## 6. Fill in the real `.env` file locally

Copy [`.env.production`](../.env.production) to a local scratch file (do **not** commit it with real secrets) and fill in the placeholders:

| Variable | Value |
|---|---|
| `APP_KEY` | Generate with `php artisan key:generate --show` locally, paste the `base64:...` output |
| `APP_URL` | `https://your-domain.com` |
| `SANCTUM_STATEFUL_DOMAINS` | `your-domain.com` |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | From Supabase (step 1) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Your production Google OAuth credentials — **add `https://your-domain.com/auth/google/callback` as an authorized redirect URI in the Google Cloud Console** for the OAuth client, or auth will fail |
| `CLOUDINARY_*` | Your Cloudinary credentials |
| `ADMIN_EMAILS` | Comma-separated list of admin Google account emails |

Leave `SESSION_DRIVER`, `QUEUE_CONNECTION`, `CACHE_STORE` as `database` (already set) — no Redis, per project decision.

## 7. Base64-encode the `.env` file and add it as a GitHub secret

```bash
base64 -i .env.production.filled -o env.b64   # macOS: base64 -i file -o out
cat env.b64 | pbcopy                          # or just open env.b64 and copy its contents
```

In your GitHub repo → **Settings → Secrets and variables → Actions**, add these secrets:

| Secret name | Value |
|---|---|
| `ENV_FILE_B64` | The base64 output from above (the whole file, one blob) |
| `EC2_HOST` | Your EC2 instance's public IP or domain |
| `EC2_USER` | SSH user (`ubuntu` for Ubuntu AMIs) |
| `EC2_SSH_KEY` | The **private** key (PEM contents) matching the key pair used to launch the instance |

`GITHUB_TOKEN` is provided automatically by Actions — you don't need to create it.

Delete your local plaintext `.env.production.filled` and `env.b64` scratch files once the secret is saved — don't leave real secrets sitting in plaintext files.

## 8. First deploy

Push to `main` (or merge this branch into `main` once you're ready). The workflow will:
1. Build the Docker image and push it to GHCR.
2. Copy `docker-compose.yml` and `Caddyfile` to `~/cake-hub` on EC2 via SCP.
3. SSH in, decode `.env` from the secret, `docker compose pull && up -d`, then run `php artisan migrate --force` inside the `app` container.

Watch the run under the repo's **Actions** tab. First boot: Caddy will attempt to obtain a Let's Encrypt certificate for your domain — this requires DNS to already be pointing at the instance (step 2.3) and ports 80/443 to be reachable.

## 9. Verify

- `curl -I https://your-domain.com` — expect a `200`/`30x`, not a connection error or cert warning.
- `ssh` into EC2 and run `docker compose logs -f` in `~/cake-hub` to check `app`, `queue`, and `caddy` are all healthy.
- Log in via Google OAuth on the live site to confirm the production OAuth redirect URI works.
- Place a test order or check a seller listing to confirm the Supabase/PostGIS connection and "nearby seller" search work end-to-end.

## Notes / things to keep in mind

- **Migrations run automatically on every deploy** (`--force` flag, no confirmation prompt). Since there's no staging environment, review any destructive migration carefully before merging to `main`.
- **No database backups are configured by this plan.** Supabase has its own backup settings (Database → Backups) — check your plan's retention and consider enabling point-in-time recovery if the data matters.
- **Caddy's certs persist** in the `caddy_data` Docker volume — don't `docker compose down -v` (which removes volumes) or you'll need to re-issue certificates (rate-limited by Let's Encrypt).
- If you outgrow a single EC2 instance later (multiple instances, load balancing, etc.), this compose-based setup will need to change — treat that as a future architecture decision, not something to build speculatively now.


## Upload size limits

PHP upload limits live in `docker/php.ini`, which is copied into the image. The current values are `upload_max_filesize=20M` and `post_max_size=25M`, matching the largest FormRequest rule (images, `max:20480`). nginx's `client_max_body_size` in `docker/nginx.conf` must stay at or above `post_max_size`. If you raise an upload rule, raise all three, plus `IMAGE_RULE` in `resources/js/lib/files.ts`. Otherwise uploads fail with 413 before Laravel validation runs.

For local development with Laravel Herd, set Herd → Settings → PHP → "Max file upload size" to at least 25 MB. Herd's default is 2 MB.
