# Oshin Hotel Review Management System (Frontend)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-orange?style=for-the-badge)

A comprehensive admin dashboard and review management frontend built for hotel administrators and staff. This application handles analytics visualization, guest feedback management, and public review collection.

## 🚀 Features

### 📊 Analytics & Dashboard
- **Visual Data:** Interactive charts (Bar, Line, Pie) using `recharts` to track performance over time.
- **Comparative Analysis:** Compare performance across different hotel categories (Room, F&B, CFC).
- **Report Generation:** PDF export functionality for monthly and yearly reports using `jspdf`.
- **Detail Views:** Drill down into specific question performance and composite scores.

### 🛡️ Authentication & Security
- **Role-Based Access Control (RBAC):** Distinct routes and views for `admin`, `viewer`, and specific staff roles (`staff_room`, `staff_f&b`, `staff_cfc`).
- **Secure Routing:** Protected routes utilizing a global Auth Store.
- **Persistent Session:** LocalStorage persistence for user sessions.

### 📝 Review Management
- **Public Review Interface:** Mobile-responsive pages for guests to submit reviews via unique tokens.
- **Staff Dashboard:** Tools for staff to generate and manage review links.
- **Issue Tracking:** "Yes/No" response tracking for immediate guest issue resolution.

## 🛠️ Tech Stack

- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (with persistence)
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios
- **Icons:** Lucide React, React Icons
- **Utilities:** date-fns, clsx

## 📂 Project Structure

```bash
src/
├── components/      # UI primitives (Layouts, Charts, Modals)
│   ├── auth/        # Protected route guards
│   ├── Charts/      # Recharts components
│   └── layout/      # Sidebar, Header, Main Layout
├── context/         # React Contexts (e.g., ChartContext)
├── pages/           # Lazy-loaded application pages
│   ├── management/  # Admin management screens (Users, Hotels, Questions)
│   ├── review/      # Staff review generation screens
│   └── public/      # Guest-facing review screens
├── stores/          # Zustand stores (Auth, Analytics, Filters)
├── utils/           # Helpers (PDF Generator, Formatters)
└── App.tsx          # Main routing and initialization logic
