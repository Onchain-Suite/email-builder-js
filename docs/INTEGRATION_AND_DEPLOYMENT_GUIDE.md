# Email Builder Integration & Deployment Guide

This comprehensive guide covers the architecture, deployment, and data integration for the Email Builder. It is designed for developers integrating this tool into the **OnchainSuite** ecosystem.

---

## 🏗️ Part 1: Architecture & Integration

The recommended way to integrate the Email Builder into your SaaS application is via the **Iframe / Micro-frontend** approach. This ensures CSS isolation, performance, and independent deployment cycles.

### 1.1 The Architecture

1.  **Host App**: Your main dashboard (e.g., `app.onchainsuite.com`).
2.  **Builder App**: This project hosted on a subdomain (e.g., `builder.onchainsuite.com`).
3.  **Communication**: Use `window.postMessage` to send data securely between the two.

### 1.2 Frontend Integration (React Example)

Embed the builder using an `iframe` in your main application. Use the following component to handle two-way communication (loading templates and saving changes).

```tsx
// components/EmailBuilderModal.tsx
import React, { useEffect, useRef } from 'react';

const BUILDER_URL = "https://builder.onchainsuite.com"; 

export const EmailBuilderModal = ({ initialJson, onSave, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security Check: Always verify origin
      if (event.origin !== BUILDER_URL) return;

      const { type, data } = event.data;
      
      // RECEIVE DATA FROM BUILDER
      if (type === 'EMAIL_BUILDER_SAVE') {
        console.log("User clicked save!", data);
        const { json, html } = data;
        
        // Pass data back to parent component/API
        onSave({ json, html }); 
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSave]);

  // SEND DATA TO BUILDER
  const handleLoad = () => {
    if (iframeRef.current?.contentWindow && initialJson) {
      iframeRef.current.contentWindow.postMessage({
        type: 'INIT_EMAIL_BUILDER',
        data: initialJson
      }, BUILDER_URL);
    }
  };

  return (
    <div className="modal-overlay">
      <iframe
        ref={iframeRef}
        src={BUILDER_URL}
        onLoad={handleLoad}
        style={{ width: '100vw', height: '100vh', border: 'none' }}
        title="Email Builder"
      />
    </div>
  );
};
```

### 1.3 Communication Protocol

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `INIT_EMAIL_BUILDER` | Host -> Builder | `{ ...json }` | Loads a saved template into the editor. |
| `EMAIL_BUILDER_SAVE` | Builder -> Host | `{ json: object, html: string }` | Triggered when user clicks "Save". Contains both the JSON structure (for editing) and the rendered HTML (for sending). |

### 1.4 Note on Backend Endpoints
The Email Builder is a frontend-only application (static site). It **does not** have an API endpoint to save emails.
Instead, your **Host App** (OnchainSuite Backend) must provide an endpoint (e.g., `POST /api/templates`) to receive the data sent via the `EMAIL_BUILDER_SAVE` event.

1.  Builder sends `{ json, html }` to Host App via `postMessage`.
2.  Host App receives data in `EmailBuilderModal`.
3.  Host App calls your backend API to save the template to your database.

---

## 🚀 Part 2: Deployment Guide (AWS EC2)

This section details how to self-host the builder as a standalone static application on AWS.

### 2.1 Prerequisites
*   AWS Account
*   Domain pointing to your instance (e.g., `builder.onchainsuite.com`)

### 2.2 Server Setup (Ubuntu 24.04 LTS)

1.  **Launch Instance**: Use `t3.small` (recommended for build memory).
2.  **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS).
3.  **Install Dependencies**:

```bash
# Update & Install Node.js 20
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx

# Verify
node -v && npm -v && nginx -v
```

### 2.3 Clone & Build

```bash
git clone https://github.com/your-repo/email-builder-js.git
cd email-builder-js/packages/editor-sample
npm install
npm run build
```

### 2.4 Nginx Configuration

Create config at `/etc/nginx/sites-available/email-builder`:

```nginx
server {
    listen 80;
    server_name builder.onchainsuite.com; 

    root /home/ubuntu/email-builder-js/packages/editor-sample/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/email-builder /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

### 2.5 Automated Updates

Create a `deploy.sh` script in your home directory to simplify updates:

```bash
#!/bin/bash
set -e
echo "🚀 Starting Deployment..."
cd ~/email-builder-js
echo "⬇️ Pulling changes..."
git pull origin main
cd packages/editor-sample
echo "📦 Installing..."
npm install
echo "🏗️ Building..."
npm run build
echo "✅ Done!"
```
Run with `./deploy.sh`.

---

## 🧩 Part 3: Variables & Data Schema

To maintain a "Single Source of Truth," the builder fetches available variables from your backend.

### 3.1 Data Flow
1.  **Backend**: Exposes `GET /api/v1/email-builder/config`.
2.  **Frontend**: Fetches config on load.
3.  **UI**: Populates "Merge Tags" menu.

### 3.2 API Contract (JSON Schema)

Your backend should return variables in this format:

```json
{
  "groups": [
    {
      "id": "recipient",
      "label": "Recipient",
      "variables": [
        { "key": "user.first_name", "label": "First Name" },
        { "key": "user.email", "label": "Email Address" }
      ]
    },
    {
      "id": "custom_fields",
      "label": "Custom Fields",
      "variables": [
        { "key": "user.custom.plan", "label": "Subscription Plan" }
      ]
    }
  ]
}
```

### 3.3 Production Variable Reference

Standard variables recommended for OnchainSuite:

#### 👤 Recipient (User)
| Variable Key | Description | Example |
| :--- | :--- | :--- |
| `user.first_name` | First Name | "John" |
| `user.full_name` | Full Name | "John Doe" |
| `user.email` | Email | "john@example.com" |
| `user.id` | User UUID | "u_123" |

#### 🏢 Organization (Sender)
| Variable Key | Description | Example |
| :--- | :--- | :--- |
| `company.name` | Company Name | "OnchainSuite" |
| `company.support_email` | Support Email | "support@onchainsuite.com" |
| `company.website_url` | Website | "https://www.onchainsuite.com" |
| `company.login_url` | App Login | "https://app.onchainsuite.com" |

#### 📢 System
| Variable Key | Description |
| :--- | :--- |
| `system.unsubscribe_url` | Unsubscribe Link (Required) |
| `date.current_year` | Current Year (2024) |

### 3.4 Dynamic & Custom Variables

To support custom fields (e.g., "T-Shirt Size" or "Referral Source"), your backend API should dynamically query your `custom_fields` or `meta` table and append them to the `variableGroups` response.

**Backend Logic:**
1.  Fetch standard columns (`first_name`, `email`).
2.  Fetch custom attributes from DB.
3.  Map both to the `VariableDefinition` format.
4.  Return combined JSON.

### 3.5 TypeScript Interfaces

```typescript
export interface VariableDefinition {
  key: string;
  label: string;
  fallback?: string;
}

export interface VariableGroup {
  id: string;
  label: string;
  variables: VariableDefinition[];
}
```
