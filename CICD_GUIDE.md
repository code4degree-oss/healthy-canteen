# CI/CD Guide (GitHub Actions)

This guide explains how to set up **Continuous Integration (CI)** and **Continuous Deployment (CD)** for The Healthy Canteen.

## 1. What is CI/CD?

In simple terms:
- **CI (Continuous Integration)**: Automatically testing your code every time you push to GitHub to ensure nothing is broken.
- **CD (Continuous Deployment)**: Automatically updating your live server when you push changes to the `main` branch.

With this setup, you **never** have to SSH into your server to manually pull code or restart servers again. You just `git push`, and the system handles the rest.

---

## 2. The Workflow

We will use **GitHub Actions**. Here is what will happen automatically when you push code:

1.  **Trigger**: You push code to the `main` branch.
2.  **Connect**: GitHub Actions logs into your VPS via SSH.
3.  **Pull**: It runs `git pull` on your server to get the latest changes.
4.  **Install**: It runs `npm install` to update dependencies.
5.  **Build**: It builds the Frontend and Backend.
6.  **Restart**: It uses PM2 to restart the backend server with zero downtime.
7.  **Done**: Your live site is updated!

---

## 3. Setup Steps

### Step A: Generate SSH Keys (On Components)
You need to allow GitHub to access your server.

**On your Local Machine:**
Generate a new SSH key pair specially for GitHub Actions:
```bash
ssh-keygen -t ed25519 -C "github-actions"
```
*(Save it as `github_deploy_key` so it doesn't overwrite your personal key)*

**On your Server:**
Open the `authorized_keys` file:
```bash
nano ~/.ssh/authorized_keys
```
Paste the **Public Key** (`github_deploy_key.pub`) contents on a new line. Save and exit.

### Step B: Configure GitHub Secrets
Go to your **GitHub Repository** -> **Settings** -> **Secrets and variables** -> **Actions** -> **New Repository Secret**.

Add the following secrets:

| Secret Name | Value |
| :--- | :--- |
| `HOST` | Your Server IP Address (e.g., `123.45.67.89`) |
| `USERNAME` | Your server username (usually `root`) |
| `SSH_KEY` | The **Private Key** (`github_deploy_key`) content you generated in Step A. |

---

## 4. The Workflow File

Create a file in your project at `.github/workflows/deploy.yml` and paste this content:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            # 1. Navigate to project folder
            cd /var/www/the-healthy-canteen

            # 2. Pull latest code
            git pull origin main

            # 3. Backend: Install & Build
            cd backend
            npm install
            npm run build
            cd ..

            # 4. Frontend: Install & Build
            npm install
            npm run build

            # 5. Restart Backend
            pm2 restart hct-backend

            # 6. Cleanup (Optional)
            echo "Deployment Complete!"
```

---

## 5. Verify

1.  Commit and push the `.github/workflows/deploy.yml` file to your repository.
2.  Go to the **Actions** tab in your GitHub repository.
3.  You should see a workflow running. If it turns green ✅, your deployment was successful!
