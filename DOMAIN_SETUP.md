# How to Switch to Your Own Domain (Azure VM)

Since your VM is already running on Azure at `https://thehealthycanteen.japaneast.cloudapp.azure.com/`, here is the step-by-step guide to switch to your own custom domain (e.g., `www.yourfoodstartup.com`).

## Prerequisites

1.  **Buy a Domain Name** (from GoDaddy, Namecheap, Google Domains, etc.)
2.  **Access to your Azure VM Terminal** (SSH)
3.  **Google Cloud Console Access** (if using Google Login)

---

## Step 1: Point Your Domain to Azure IP

1.  Find your **Azure VM Public IP Address**:
    *   Go to Azure Portal -> Virtual Machines -> Your VM -> Overview.
    *   Copy the **Public IP address**.

2.  Login to your Domain Registrar (e.g., GoDaddy):
    *   Go to **DNS Management** for your domain.
    *   Add/Edit the following **A Records**:

| Type | Name | Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | **@** (root) | `YOUR_AZURE_PUBLIC_IP` | 3600 (1 hr) |
| **A** | **www** | `YOUR_AZURE_PUBLIC_IP` | 3600 (1 hr) |

*(Wait 10-15 mins for DNS to propagate. You can verify by visiting your new domain in a browser - it might show an SSL error or the Nginx default page initially.)*

---

## Step 2: Update Server Configuration (Nginx)

Login to your server via SSH:
```bash
ssh azureuser@your-vm-ip
```

Edit your Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/healthy-canteen
```

Find the `server_name` line and change it to your new domain:

```nginx
# OLD LINE: server_name thehealthycanteen.japaneast.cloudapp.azure.com;
# NEW LINE:
server_name yourfoodstartup.com www.yourfoodstartup.com;
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Test the configuration to ensure no syntax errors:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## Step 3: Secure with SSL (HTTPS)

You need a new SSL certificate for the new domain. Run Certbot:

```bash
sudo certbot --nginx -d yourfoodstartup.com -d www.yourfoodstartup.com
```

*   If asked to **expand** or **replace** the existing certificate, choose **Expand** (or Replace if you don't need the old Azure domain anymore).
*   Certbot will automatically update your Nginx config to use the new certificate.

---

## Step 4: Update Backend Configuration

Your backend needs to know the new frontend URL for CORS (security) and redirects.

Edit the backend `.env` file:
```bash
nano /var/www/the-healthy-canteen/backend/.env
```

Find `FRONTEND_URL` and update it:

```ini
# OLD: FRONTEND_URL=https://thehealthycanteen.japaneast.cloudapp.azure.com
# NEW:
FRONTEND_URL=https://yourfoodstartup.com,https://www.yourfoodstartup.com
```

Save and exit.

Restart the backend application (PM2):
```bash
pm2 restart hct-backend
```

---

## Step 5: Update Google Login (Important!)

If you use **Google Login**, it will stop working if you don't update the Google Cloud Console.

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project -> **APIs & Services** -> **Credentials**.
3.  Find your **OAuth 2.0 Client ID**.
4.  Update **Authorized JavaScript origins**:
    *   Add: `https://yourfoodstartup.com`
    *   Add: `https://www.yourfoodstartup.com`
5.  Update **Authorized redirect URIs** (if used):
    *   Add: `https://yourfoodstartup.com`
    *   Add: `https://www.yourfoodstartup.com`

---

## Summary Checklist

- [ ] A Records point to Azure IP in GoDaddy/Namecheap.
- [ ] Nginx `server_name` updated.
- [ ] `certbot` run for new domain.
- [ ] Backend `.env` `FRONTEND_URL` updated.
- [ ] PM2 restarted.
- [ ] Google Cloud Console updated.

**You are done!** Your app is now live at your new custom domain.
