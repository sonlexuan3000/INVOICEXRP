# INVOICEXRP
# InvoiceXRP - RWA Invoice Financing on XRPL
### 🏆 Built for NUS Fintech Summit 2026


## 📖 Overview
**InvoiceXRP** is a decentralized invoice financing platform built on the **XRP Ledger (XRPL)**. We solve the liquidity crunch for SMEs by transforming real-world invoices into **NFTs (Real World Assets - RWA)**, allowing businesses to raise capital instantly from global investors using **RLUSD** stablecoins.

**The Problem:** SMEs wait 30-90 days for invoice payments, causing cash flow gaps.
**The Solution:** Instant liquidity via a decentralized marketplace with trustless settlement.

## ✨ Key Features
* **🧾 RWA Tokenization:** Invoices are minted as unique NFTs (XLS-20) on XRPL to prove ownership and prevent fraud.
* **💰 RLUSD Integration:** All settlements utilize **RLUSD** (Ripple USD) to ensure price stability and eliminate crypto volatility risks for businesses.
* **🔒 Smart Escrows:** Funds are locked in XRPL Escrows and only released when conditions are met, ensuring trustless security.
* **🆔 DID & Reputation:** (Demo) On-chain credit history and identity verification for issuers.
* **⚡ High Performance:** Sub-cent transaction fees and <4s settlement time via XRPL.

---

## 🏗️ System Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Blockchain** | **XRPL Testnet** | Core ledger for NFTs, Escrows, and Payments. |
| **Frontend** | React, Vite, Tailwind | User interface for Sellers and Investors. |
| **Backend** | Node.js, Express | API, business logic, and off-chain data sync. |
| **Database** | PostgreSQL | Stores user profiles and indexes blockchain events. |
| **Stablecoin** | **RLUSD (Self-Issued)** | Custom issuer setup for stable settlement demo. |

---



---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js v18+
* PostgreSQL v15+
* Git

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/sonlexuan3000/INVOICEXRP
cd invoicexrp