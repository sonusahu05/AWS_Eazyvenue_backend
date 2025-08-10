# 🔐 GitHub Secrets Setup Guide for Eazyvenue Backend Deployment

## Required GitHub Secrets

Set up these secrets in your GitHub repository: `https://github.com/sonusahu05/AWS_Eazyvenue_backend/settings/secrets/actions`

### Essential Secrets:
```
EC2_HOST=13.61.182.152
EC2_USERNAME=ubuntu
ACCESS_TOKEN=your_github_personal_access_token_here
```

### SSH Key:
```
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(paste your complete private key content here)
...
-----END RSA PRIVATE KEY-----
```

### Application Secrets:
```
JWT_ACCESS_SECRET=A78D2E0F6823BF1F437C3E2B64D7D6C5098407C8B21D92E12D62B43527E00A97
JWT_REFRESH_SECRET=y6DNKhzqRdGthMBDsYclOUcCGenNZ42GKqi7Vh17wvJDRggK8eUGD7j4H9swh2G
MONGODB_URL=mongodb://13.61.182.152:27017/admin
MONGODB_DB_NAME=admin
RAZORPAY_LIVE_KEY=rzp_live_oyCHow0OxfS8oL
RAZORPAY_LIVE_SECRET=epGc231JkMUV7jlaJ3NpKO9e
FRONTEND_DOMAIN=https://eazyvenue.in
API_DOMAIN=https://api.eazyvenue.in
REDIS_URL=redis://127.0.0.1:6379
```

## Quick Setup Commands (if you have GitHub CLI):

```bash
gh secret set EC2_HOST --body '13.61.182.152' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set EC2_USERNAME --body 'ubuntu' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set ACCESS_TOKEN --body 'your_github_token_here' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set EC2_SSH_KEY --body-file '/path/to/your/private/key.pem' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set JWT_ACCESS_SECRET --body 'A78D2E0F6823BF1F437C3E2B64D7D6C5098407C8B21D92E12D62B43527E00A97' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set JWT_REFRESH_SECRET --body 'y6DNKhzqRdGthMBDsYclOUcCGenNZ42GKqi7Vh17wvJDRggK8eUGD7j4H9swh2G' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set MONGODB_URL --body 'mongodb://13.61.182.152:27017/admin' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set MONGODB_DB_NAME --body 'admin' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set REDIS_URL --body 'redis://127.0.0.1:6379' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set FRONTEND_DOMAIN --body 'https://eazyvenue.in' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set API_DOMAIN --body 'https://api.eazyvenue.in' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set RAZORPAY_LIVE_KEY --body 'rzp_live_oyCHow0OxfS8oL' --repo sonusahu05/AWS_Eazyvenue_backend
gh secret set RAZORPAY_LIVE_SECRET --body 'epGc231JkMUV7jlaJ3NpKO9e' --repo sonusahu05/AWS_Eazyvenue_backend
```

## How to Create GitHub Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Eazyvenue Backend Deployment"
4. Select scopes: `repo` (Full control of private repositories)
5. Copy the token and use it as `ACCESS_TOKEN` secret

## Verify Setup:

```bash
gh secret list --repo sonusahu05/AWS_Eazyvenue_backend
```

Should show all required secrets.
