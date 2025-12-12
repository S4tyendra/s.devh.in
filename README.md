# s.devh.in (DevH MiNi)

**s.devh.in** is a simple, fast, and clean URL shortener service built with modern web technologies. It allows users to shorten long URLs, manage them in bulk, and report abusive links.

![Tech Stack](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt.js)
![Tech Stack](https://img.shields.io/badge/TypeScript-Blue?logo=typescript)
![Tech Stack](https://img.shields.io/badge/MongoDB-Green?logo=mongodb)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)

## 🚀 Features

* **URL Shortening**: Instantly generate short links for long URLs.
* **Bulk Shortening**: Shorten multiple URLs at once via the bulk interface.
* **Link History**: View a history of your recently shortened links.
* **Reporting System**: Report abusive or malicious links.
* **Admin Dashboard**: Manage links and view statistics (protected route).
* **Modern UI**: Built with Shadcn Vue and Tailwind CSS for a clean, accessible design.
* **Dark Mode**: Fully supported.

## 🛠️ Tech Stack

* **Framework**: [Nuxt 3](https://nuxt.com/)
* **Language**: TypeScript
* **Database**: MongoDB (using Mongoose or native driver via `server/utils/mongodb.ts`)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI Components**: [Shadcn Vue](https://www.shadcn-vue.com/)
* **Icons**: Lucide Vue (likely used with Shadcn)

## 📂 Project Structure

```bash
.
├── components/         # Vue components (HistorySection, etc.)
│   └── ui/             # Shadcn UI components (Button, Input, Dialog, etc.)
├── composables/        # Auto-imported Vue composables
├── layouts/            # Layout wrappers
├── pages/              # Application routes
│   ├── index.vue       # Home page
│   ├── bulk.vue        # Bulk shortening page
│   ├── report.vue      # Abuse reporting page
│   └── p/[shortId].vue # Redirect logic
├── server/             # API routes and backend logic
│   ├── api/            # API endpoints (shorten, info, verify, etc.)
│   ├── utils/          # Server-side utilities (database connection)
│   └── routes/         # Server middleware and routes
└── public/             # Static assets
````

## ⚡ Getting Started

### Prerequisites

  * Node.js (v18+ recommended)
  * MongoDB instance (local or Atlas)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/S4tyendra/s.devh.in.git
    cd s.devh.in
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your MongoDB connection string and other necessary config:

    ```env
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/url-shortener
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open your browser:**
    Visit `http://localhost:3000` to see the app in action.

## 📦 Build for Production

To build the application for production:

```bash
npm run build
```


## 🤝 Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.

## 📄 License

This project is open source. Unlicensed (Public Domain).
