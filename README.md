# CryptoNotify: Cryptocurrency Tracking & Alert Platform

## Project Overview

CryptoNotify is a comprehensive cryptocurrency tracking and notification platform built with Next.js, MongoDB, CoinGecko API, and Kestra for automated notifications.

## Features

- Real-time cryptocurrency price tracking
- Personalized price threshold alerts
- User authentication
- Detailed crypto insights
- Email notifications for price changes

## Screenshots

- Landing Page
  <img width="1470" alt="Screenshot 2024-12-02 at 3 56 05 PM" src="https://github.com/user-attachments/assets/b1b4a4f0-fdd1-40e4-9249-3897d1d65277">

- Crypto Explore Page
  <img width="1470" alt="Screenshot 2024-12-02 at 3 56 33 PM" src="https://github.com/user-attachments/assets/96020fbc-46f9-4b94-bd83-4b94d48aa3fe">

- Analytics
  <img width="1470" alt="Dashboard Screenshot" src="/public/Analytics.png">

- **CryptAlert Setup**  
  <img width="1470" alt="Dashboard Screenshot" src="/public/CryptoNotify.png">

- **Alert Dashboard Overview**  
  <img width="1470" alt="Dashboard Screenshot" src="/public/AlertDashboard.png">

## 🛠 Tech Stack

- **Frontend:** Next.js 14
- **Database:** MongoDB
- **Authentication:** NextAuth.js
- **Price Data:** CoinGecko API
- **Notification Workflow:** Kestra
- **Styling:** Tailwind CSS

## Prerequisites

- Node.js (v18+)
- MongoDB
- CoinGecko API Key
- SMTP Email Service

## Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/CryptoNotify.git
cd CryptoNotify
```

2. Install dependencies

```bash
npm install
```

3. Create `.env.local` file

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Email Service
EMAIL_SERVICE_USER=your_email
EMAIL_SERVICE_PASS=your_email_password

# Kestra Configuration
KESTRA_API_ENDPOINT=your_kestra_endpoint
```

## Project Structure

```
CryptoNotify/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── blockchains/
│   │   ├── coins/
│   │   ├── cron/
│   │   ├── updatethreshold/
│   │   ├── user/
│   │   └── userthresholds/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── explore/
│   │   └── page.tsx
│   ├── [cryptoId]/
│   │   └── page.jsx
│   ├── models/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── blockchain/
│   ├── ui/
│   ├── Navbar.tsx
│   ├── SearchBar.tsx
│   ├── ThresholdForm.tsx
│   ├── auth-dialog.tsx
│   ├── user-menu.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ClientSessionProvider.tsx
├── public/
│   ├── Analytics.png
│   ├── AlertDashboard.png
│   ├── CryptoNotify.png
│   └── logo.png
├── lib/
│   ├── api.ts
│   ├── cache.ts
│   ├── mongodb.ts
│   └── utils.ts
├── hooks/
│   ├── useDebounce.ts
│   ├── use-toast.ts
│   └── useBlockchainSearch.ts
├── types/
│   └── blockchain.ts
├── kestra/
│   └── crypto-price-monitor.yaml
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── ... (other config and system files)
```

## Key Components

### 1. Authentication (NextAuth)

- Google, Email providers
- Custom login/signup flows

### 2. Crypto Data Fetching

```javascript
// lib/coingecko.js
export async function fetchCryptoData(cryptoId) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${cryptoId}`
  );
  return response.json();
}

export async function fetchMarketData() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100"
  );
  return response.json();
}
```

### 3. Kestra Workflow (crypto-notification.yml)

```yaml
id: crypto-price-monitor
namespace: crypto.alerts

tasks:
  - id: fetch-crypto-prices
    type: io.kestra.core.tasks.scripts.Python
    script: |
      # Fetch prices and check thresholds
      def monitor_crypto_prices():
          # MongoDB connection
          # Fetch user watchlists
          # Compare current prices with thresholds
          # Trigger notifications
          pass

triggers:
  - id: every-5-minutes
    type: io.kestra.core.triggers.Cron
    config:
      cron: "*/5 * * * *"
```

````

## Running the Project

```bash
# Development Mode
npm run dev

# Production Build
npm run build
npm start
````

## Security Considerations

- Environment variable protection
- Secure API key management
- Rate limiting on crypto data fetching

## Page Descriptions

### 1. About Page

- Crypto-themed background animations
- Project introduction
- Technology stack overview

### 2. Explore Page

- Cryptocurrency market data

### 3. Crypto Detail Page

- Comprehensive crypto statistics
- Price history graphs
- Market sentiment indicators

### 4. Dashboard

- User's crypto watchlist
- Threshold management
- Notification preferences

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Happy HackFrost 2024
