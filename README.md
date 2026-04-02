🚀 AI Product Finder 
AI-powered product discovery platform that aggregates products from multiple sources and provides intelligent insights to help users make better buying decisions.

✨ Features
🔍 Smart Product Search – Search products across multiple sources (Amazon, Flipkart, etc.)
🤖 AI Insights – Get summaries, pros/cons, and best choice recommendations powered by Groq AI
🕘 Recent Searches – Track user search history
🛍️ Recent Products – View recently explored products
🔐 Secure Authentication – Cookie-based auth with JWT
⚡ Fast UI – Built with Next.js for high performance
📊 Scalable Backend – Node.js + Prisma architecture
🏗️ Tech Stack
Frontend
Next.js (App Router)
React
Tailwind CSS
Backend
Node.js
Next.js API Routes
Database
PostgreSQL
Prisma ORM
APIs & Integrations
REST APIs
Product Data APIs (SerpAPI / scraping)
Groq AI – Lightning-fast LLM inference for product insights
⚙️ Installation
1. Clone the repository
git clone https://github.com/your-username/ai-product-finder.git
cd ai-product-finder

**  Install dependencies **
npm install
# or
pnpm install


** Create .env.local file: **
env
DATABASE_URL=
JWT_SECRET=
SERP_API_KEY=
GROQ_API_KEY=          # Get from console.groq.com

** Setup database **
npx prisma migrate dev
npx prisma generate

** 🧠 AI Features with Groq **
Groq Integration
Fast Inference – Blazing fast response times (up to 10x faster)
Multiple Models – Support for Llama, Mixtral, and other open-source models
Cost-Effective – Competitive pricing for AI inference
High Performance – Optimized for production workloads

** AI Capabilities **

Product summary generation
Pros & cons extraction
Best product recommendation
Intelligent product comparison
Natural language search queries

** 🚀 Future Improvements **
🔄 Real-time price tracking
❤️ Wishlist system
📊 Product comparison dashboard
📱 Mobile app version
🧾 Order tracking integration
🎯 Personalized AI recommendations

** 💬 AI-powered chat assistant for product queries **
🛡️ Security
JWT-based authentication
HTTP-only cookies
No userId exposure in frontend
Input validation & sanitization
API key protection for Groq services
