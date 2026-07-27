# 🏦 Mock HR CRM Test Environment

This folder provides a complete mock HR CRM server for testing **Autoniv Voice Agent** integrations locally.

---

## 📁 Files Included

* **`server.js`**: Express server that receives webhook calls from Autoniv, verifies the **HMAC SHA-256 Signature** (`X-Autoniv-Signature`), and serves a live web dashboard at `http://localhost:4000`.
* **`trigger-call.js`**: Standalone script to trigger an outbound candidate call via the Autoniv API.

---

## 🚀 How to Run

### 1. Start the Mock HR CRM Server
Open terminal in this directory (`e:/Autonivv/Autoniv/crm-test`) and run:

```bash
node server.js
```

Then open your browser to **`http://localhost:4000`**.

---

### 2. Trigger a Test Call

#### **Option A: From the Browser UI**
Go to `http://localhost:4000` and click the **"🚀 Send Screening Call Request to Autoniv"** button.

#### **Option B: From Terminal**
In a separate terminal window, run:

```bash
node trigger-call.js
```

#### **Option C: Using cURL / PowerShell / Postman**
Send a POST request to your Autoniv backend with `webhookUrl` set to your mock CRM:

```bash
curl -X POST http://localhost:5173/api/widget/call \
  -H "X-API-Key: ak_8adf33bf37b805ed344317164f4e0cc969e16396ebcac4df" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "6a648ccef2c53f9fd777e409",
    "phone": "+917489010144",
    "name": "Ankit Sharma",
    "context": { "jobRole": "Senior React Developer", "experience": "4 years" },
    "webhookUrl": "http://localhost:4000/api/webhooks/autoniv"
  }'
```

---

## 🛡️ Webhook Security Verification
When Autoniv sends candidate transcripts and screening evaluation data to `http://localhost:4000/api/webhooks/autoniv`, `server.js` verifies the `X-Autoniv-Signature: t=timestamp,v1=hash` header using HMAC SHA-256 and displays `✅ VERIFIED` on the dashboard.
