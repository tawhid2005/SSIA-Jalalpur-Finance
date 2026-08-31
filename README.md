# Shah Sultan IELTS Academy - Finance & Management Dashboard 🎓💻

Welcome to the **Shah Sultan IELTS Academy** Finance and Student Management Dashboard! This is a comprehensive, modern, and highly responsive web application built to streamline operations, manage students, track fees, and analyze financial reports for the Jalalpur Branch.

## ✨ Key Features

- **📊 Comprehensive Dashboard:** Get real-time lifetime financial metrics, total student count, net profit, and expense breakdowns at a glance.
- **👨‍🎓 Student Master:** Add, manage, and delete students. Includes auto-generated Student IDs and automated due tracking.
- **📝 Mock Test Management:** Keep track of internal and external students' mock test records and fees completely separately from general income.
- **💳 Fee Collection & Due Management:** Record monthly or course fees and automatically calculate partial payments, dues, and overdue statuses.
- **💰 Income & Expense Tracking:** Dedicated modules for Other Income, General Expenses, Marketing Expenses, and Teacher Salaries.
- **📈 Lifetime & Periodic Reports:** Generate detailed financial reports (Monthly, Yearly, Lifetime) and print them perfectly formatted on A4 paper.
- **📱 PWA & Mobile Responsive:** Fully optimized for mobile screens with a sleek sidebar and custom scrollbars. Install it on your PC or mobile as a Native App!

## 🛠️ Technology Stack

- **Frontend:** React (Vite)
- **Styling:** Vanilla CSS (Custom dark theme with glassmorphism)
- **Database:** Firebase Cloud Firestore (Real-time NoSQL Database)
- **Icons:** Lucide React
- **Charts:** Recharts

## 🚀 Quick Start (Local Development)

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tawhid2005/SSIA-Jalalpur-Finance.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd SSIA-Jalalpur-Finance
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Open in browser:**
   Visit `http://localhost:5173` to view the application.

## 🖨️ Printing & PDF Export

The application features customized `@media print` rules. Whenever you print an Admission Slip, Mock Test Slip, or Financial Report, the system automatically:
- Removes the sidebar and navigation.
- Hides browser-injected headers/footers.
- Scales the content perfectly to fit on a single A4 page.

## 📱 Progressive Web App (PWA)

This dashboard is PWA-ready! You can install it on your Android, iOS, or PC browser.
- Look for the "Install App" or "Add to Home Screen" prompt in your browser menu.
- A beautiful "Shah Sultan Logo" shortcut will be created for 1-click quick access.

---
*Developed & Maintained for Shah Sultan IELTS Academy, Jalalpur Branch.*
