# 209jobs - Hyperlocal Job Board for Central Valley 🌾

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-darkgreen)](https://prisma.io/)

A hyperlocal AI-powered job board platform specialized for California's Central Valley region (209 area code), featuring conversational job search, vector embeddings, and deep local market intelligence.

## 🎯 **Unique Value Proposition**

**The ONLY job platform that truly understands the 209 area code region** - combining advanced AI with hyperlocal expertise to serve Stockton, Modesto, Lodi, Tracy, and surrounding Central Valley communities.

### 🏆 **Competitive Advantages**
- **AI-Powered Conversational Search** - Natural language job finding vs traditional filters
- **Hyperlocal Intelligence** - Deep knowledge of 209 area employers, industries, commute patterns
- **Local Market Expertise** - Salary context, cost-of-living analysis, Bay Area vs local advice
- **Vector Semantic Search** - Advanced matching using OpenAI embeddings and PostgreSQL pgvector

---

## 🚀 **Key Features**

### **🤖 NLP JobsGPT (COMPLETE)**
- ✅ **Conversational AI** - GPT-4 powered job search assistant
- ✅ **Semantic Search** - Vector embeddings with hybrid keyword matching  
- ✅ **Intent Classification** - 7 conversation types (job search, company info, career guidance, etc.)
- ✅ **Local Knowledge Base** - 50+ Central Valley cities, employers, and industry insights
- ✅ **Context Retention** - Multi-turn conversations with session memory

### **🌍 Hyperlocal Specialization**
- **209 Area Focus** - Auto-defaults to Central Valley job search
- **Commute Intelligence** - Bay Area vs local opportunity analysis  
- **Local Employer Database** - Major employers for each city
- **Industry Expertise** - Agriculture, logistics, healthcare, education focus
- **Salary Context** - Local vs Bay Area cost-of-living comparisons

### **🔍 Advanced Search System**
- **Enhanced Job Search** with relevance scoring and faceted search
- **Geolocation-based Search** with radius filtering
- **Autocomplete and Suggestions** for improved UX
- **Search Analytics** and performance tracking
- **Caching and Performance** optimization

### **👥 User Management**
- **NextAuth.js Authentication** with multiple providers
- **Role-based Access Control** (Job Seekers, Employers, Admins)
- **User Profiles** and preferences
- **Email Verification** and password reset

### **💼 For Employers**
- **Job Posting Management** with AI-enhanced descriptions
- **Applicant Tracking** and candidate pipeline
- **Local Advertisement Platform** for business promotion
- **Analytics Dashboard** for hiring insights

---

## 📖 **Documentation**

### **📚 Complete Documentation Hub**
- **[📖 Documentation Index](docs/README.md)** - Complete organized documentation hub with 38+ guides
- **[🚀 Getting Started](docs/ENVIRONMENT_SETUP.md)** - Development environment setup
- **[🔧 API Reference](docs/api/)** - Complete API documentation and examples

### **🎯 Key Documentation**
- **[NLP JobsGPT Complete Guide](docs/NLP_JOBSGPT_COMPLETE.md)** - Comprehensive AI implementation docs
- **[Search System Guide](docs/SEARCH_SYSTEM.md)** - Advanced search capabilities
- **[Mobile Testing Guide](docs/MOBILE_TESTING_GUIDE.md)** - Mobile responsiveness testing
- **[Security & Monitoring](docs/COMPREHENSIVE_MONITORING_SYSTEM.md)** - Production monitoring setup

### **🏗️ Development & Deployment**
- **[Task Management](tasks/)** - Project roadmap and progress tracking
- **[Testing Coverage](docs/TESTING_COVERAGE.md)** - Test suite documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment procedures
- **[209 Area Focus](docs/209_AREA_FOCUS_UPDATE.md)** - Hyperlocal specialization details

---

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for design system
- **React Hook Form** + **Zod** for form validation

### **Backend**
- **PostgreSQL** with **pgvector** extension for vector search
- **Prisma ORM** for database management
- **NextAuth.js** for authentication
- **OpenAI API** (GPT-4, embeddings) for AI features

### **AI/ML Features**
- **Vector Embeddings** - OpenAI text-embedding-3-small
- **Semantic Search** - PostgreSQL pgvector with cosine similarity
- **Conversational AI** - GPT-4 Turbo for intent classification and responses
- **NLP Pipeline** - Natural language parameter extraction

### **Infrastructure**
- **Vercel** deployment and hosting
- **Vercel KV** for caching and sessions
- **GitHub Actions** for CI/CD

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 14+ with pgvector extension
- OpenAI API key

### **Quick Setup**

```bash
# Clone the repository
git clone https://github.com/yourusername/209jobs.git
cd 209jobs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# External APIs
ADZUNA_APP_ID="your-adzuna-id"
ADZUNA_APP_KEY="your-adzuna-key"
```

---

## 🎮 **Usage Examples**

### **Conversational Job Search**
```javascript
// Start conversation
const response = await fetch('/api/jobs/chatbot', { method: 'GET' });
const { sessionId } = await response.json();

// Natural language search
const searchResponse = await fetch('/api/jobs/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Find me nursing jobs in Stockton that don't require Bay Area commuting",
    sessionId
  })
});
```

### **Semantic Search**
```javascript
const semanticResults = await fetch('/api/jobs/semantic-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "I want to work in sustainable agriculture technology helping Central Valley farmers",
    limit: 10
  })
});
```

---

## 🎯 **What Makes This Special**

### **1. Hyperlocal Expertise**
Unlike generic job boards, 209jobs deeply understands:
- **Central Valley Economy** - Agriculture, logistics, healthcare focus
- **Commute Patterns** - Bay Area vs local opportunity analysis
- **Local Employers** - Major companies in each 209 area city
- **Cost of Living** - Real salary comparisons and advice

### **2. AI-First Approach**
- **Natural Language Search** - "Find me warehouse jobs near the Port of Stockton"
- **Intelligent Suggestions** - Context-aware follow-up questions
- **Local Context** - AI knows about Gallo Winery, Delta College, etc.
- **Career Guidance** - Bay Area commute vs local job advice

### **3. Community-Centered**
- **Local Business Support** - Advertisement platform for 209 area companies
- **Regional Focus** - Serves specific Central Valley communities
- **Economic Development** - Helps local workforce and employers connect

---

## 📊 **Project Status**

### **✅ Completed (Production Ready)**
- **NLP JobsGPT System** - Full conversational AI implementation
- **Authentication & User Management** - Complete with role-based access
- **Job Search & Filtering** - Advanced search with semantic capabilities  
- **API Infrastructure** - Production-ready endpoints with error handling
- **UI Component Library** - Comprehensive design system
- **Security Implementation** - Full security measures and validation

### **🚧 In Development**
- Job Listing Detail Pages (85% complete)
- Email Alert System
- Admin Dashboard
- Mobile Responsiveness Optimization

### **📋 Planned**
- Local Advertisement Platform
- Instagram Post Automation  
- Analytics and Tracking
- Performance Optimization

---

## 🤝 **Contributing**

We welcome contributions to help make 209jobs the best hyperlocal job platform for Central Valley!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 **Support the Project**

If you find this project helpful:
- ⭐ Star the repository
- 🐛 Report bugs and suggest features
- 💡 Contribute code or documentation
- 📢 Share with others in the Central Valley tech community

---

**Built with ❤️ for the Central Valley community** 🌾
