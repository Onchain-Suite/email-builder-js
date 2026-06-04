# Email Builder Integration & Deployment Guide

This comprehensive guide covers the architecture, deployment, and data integration for the Email Builder. It is designed for developers integrating this tool into the **OnchainSuite** ecosystem.

---

## 🏗️ Part 1: Architecture & Integration

The recommended way to integrate the Email Builder into your SaaS application is via the **Iframe / Micro-frontend** approach. This ensures CSS isolation, performance, and independent deployment cycles.

### 1.1 The Architecture

1.  **Host App**: Your main dashboard 
2.  **Builder App**: This project hosted on a subdomain (e.g., `editor.onchainsuite.com`).
3.  **Communication**: Use `window.postMessage` to send data securely between the two.

### 1.2 Frontend Integration (React Example)

Embed the builder using an `iframe` in your main application. In production, the builder is typically embedded with `embedded=true` and receives runtime configuration via `HOST_CONFIG` (token, orgId, apiBaseUrl, campaignId).

```tsx
// components/EmailBuilderModal.tsx
import React, { useEffect, useRef } from 'react';

const BUILDER_URL = "https://editor.onchainsuite.com";

export const EmailBuilderModal = ({ initialJson, onSave, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security Check: Always verify origin
      if (event.origin !== BUILDER_URL) return;

      const { type, payload, data } = event.data;
      
      if (type === 'EMAIL_SAVED') {
        onSave({ campaignId: payload.campaignId, document: payload.document });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSave]);

  const handleLoad = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'HOST_CONFIG',
        embedded: true,
        campaignId: "cmp_123",
        orgId: "org_123",
        token: "editor_session_token",
        apiBaseUrl: "https://api.onchainsuite.com/api/v1"
      },
      BUILDER_URL
    );

    if (initialJson) {
      iframeRef.current.contentWindow.postMessage({ type: 'INIT_EMAIL_BUILDER', data: initialJson }, BUILDER_URL);
    }
  };

  return (
    <div className="modal-overlay">
      <iframe
        ref={iframeRef}
        src={`${BUILDER_URL}/?embedded=true`}
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
| `HOST_CONFIG` | Host -> Builder | `{ embedded: true, campaignId, orgId, token, apiBaseUrl }` | Sets runtime config for embedded mode (recommended). |
| `REQUEST_HOST_CONFIG` | Builder -> Host | `{}` | Builder requests the host to resend config (prevents race conditions). |
| `EDITOR_READY` | Builder -> Host | `{}` | Builder signals it is ready to receive `HOST_CONFIG`. |
| `INIT_EMAIL_BUILDER` | Host -> Builder | `{ ...document }` | Loads a saved template into the editor (optional if backend preloads by campaignId). |
| `EMAIL_SAVED` | Builder -> Host | `{ campaignId, document }` | Emitted after a successful save in embedded mode. |
| `EMAIL_AUTH_REQUIRED` | Builder -> Host | `{ campaignId }` | Emitted when the API returns 401 (host should refresh editor-session token and resend `HOST_CONFIG`). |

### 1.4 Backend Save & Preview Model
The builder is a frontend-only application, but it integrates with your backend via authenticated API calls.

**Save**
1.  Builder calls `PUT {apiBaseUrl}/campaigns/{campaignId}/email` with:
    - `Authorization: Bearer <token>` (editor-session token)
    - `x-editor-token: <token>` (optional if your backend supports it)
    - `x-org-id: <orgId>`
    - JSON body containing the builder document
2.  Backend persists the builder document (JSON) and optionally a rendered HTML snapshot.
3.  Builder emits `EMAIL_SAVED` back to the host so the UI can show success without refetching.

**Preview**
- Store and serve HTML snapshots for instant preview, or render HTML on-demand from the stored JSON document.

---

## 🚀 Part 2: Deployment Guide (Render)

This section details how to self-host the builder as a standalone static application on Render.

### 2.1 Prerequisites
*   Render Account
*   Domain pointing to your instance (e.g., `editor.onchainsuite.com`)

### 2.2 Server Setup (Ubuntu 24.04 LTS)

1.  **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS).
2.  **Install Dependencies**:

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
