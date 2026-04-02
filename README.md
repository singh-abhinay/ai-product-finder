🚀 **AI Product Finder**
  An AI-powered product discovery platform that aggregates products from multiple sources and delivers intelligent insights to help users make smarter buying decisions.

✨ **Features**
  🔍 Smart Product Search
  Search products across multiple platforms (Amazon, Flipkart, etc.)
  
**🤖 AI Insights**
  Get product summaries, pros & cons, and best recommendations powered by AI
  
  **🕘 Recent Searches**
      Track and revisit user search history
  **🛍️ Recent Products**
      View recently explored products
  **🔐 Secure Authentication**
      Cookie-based authentication using JWT
  **⚡ High Performance UI**
      Built with Next.js for fast and optimized user experience
  **📊 Scalable Backend**
      Robust architecture using Node.js and Prisma

🏗️ **Tech Stack**
  **Frontend**
    Next.js (App Router)
    React
    Tailwind CSS

**Backend**
    Node.js
    Next.js API Routes

**Database**
    PostgreSQL
    Prisma ORM

**APIs & Integrations**
    REST APIs
    Product Data APIs (SerpAPI / Web Scraping)

**Groq AI (for ultra-fast AI inference)**

**⚙️ Installation**
  **1. Clone the Repository**
    git clone https://github.com/your-username/ai-product-finder.git
    cd ai-product-finder

  **2. Install Dependencies**
    npm install
    # or
    pnpm install

  **3. Create .env.local**
    DATABASE_URL=
    JWT_SECRET=
    SERP_API_KEY=
    GROQ_API_KEY=   # Get from console.groq.com

  **4. Setup Database**
    npx prisma migrate dev
    npx prisma generate

**🧠 AI Features (Powered by Groq)**
  **🚀 Groq Integration**
    ⚡ Fast Inference – Up to 10x faster response times
    🧩 Multiple Models – Supports Llama, Mixtral, and more
    💰 Cost-Effective – Optimized pricing for AI workloads
    📈 High Performance – Production-ready AI inference

**🤖 AI Capabilities**
  Product summary generation
  Pros & cons extraction
  Best product recommendations
  Intelligent product comparison
  Natural language search queries

**🔮 Future Improvements**
  🔄 Real-time price tracking
  ❤️ Wishlist system
  📊 Product comparison dashboard
  📱 Mobile app version
  🧾 Order tracking integration
  🎯 Personalized AI recommendations
  💬 AI-powered chat assistant for product queries

**🛡️ Security**
  JWT-based authentication
  HTTP-only cookies
  No user ID exposure on frontend
  Input validation & sanitization
  Secure API key handling (Groq & external services)
  
**📌 Summary**
  A scalable, AI-driven platform combining product aggregation + intelligent insights, designed to improve how users discover and evaluate products.
