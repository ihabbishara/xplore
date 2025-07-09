# Claude Code Multi-Agent Review Prompt

## 🤖 Comprehensive Xplore Code Review with Subagents

Use multiple Subagents to perform a comprehensive code review and gap analysis of the Xplore project. Each Subagent should focus on specific domains and provide detailed findings.

## 📋 Subagent Task Assignments

```
Please spin up **8 specialized subagents in parallel to review the following areas:

### 1. **Architecture & Infrastructure Subagent**
**Task**: Review overall project structure, monorepo setup, and technical foundations
- Analyze monorepo structure (apps/, packages/, turbo.json, pnpm-workspace.yaml)
- Verify domain-driven design implementation across all apps
- Check database schema design and relationships for all 8 domains
- Assess API architecture and design patterns
- Review security infrastructure (authentication, authorization, encryption)
- Evaluate development environment setup and configuration

### 2. **Backend API & Services Subagent**
**Task**: Review Node.js/Express backend implementation and business logic
- Verify all API endpoints from Linear issues PER-11 through PER-18
- Analyze service layer implementation and business logic separation
- Check external API integrations (Weather, Mapbox, Property scraping)
- Review data processing, validation, and error handling
- Assess real-time features (WebSocket implementation)
- Evaluate background job processing and queue management

### 3. **Frontend & Mobile Subagent**
**Task**: Review React/React Native implementation and user experience
- Analyze component architecture and state management across web and mobile
- Check domain organization and component reusability
- Review UI/UX consistency and cross-platform implementation
- Assess mobile-specific optimizations and native integrations
- Verify accessibility implementation (WCAG compliance)
- Evaluate performance optimizations and bundle sizes

### 4. **Database & Performance Subagent**
**Task**: Review database design, query optimization, and system performance
- Analyze PostgreSQL schema implementation for all domains
- Check indexing strategy and query performance optimization
- Review data migration and seeding implementation
- Assess caching strategy (Redis implementation)
- Evaluate database connection pooling and scaling considerations
- Check performance monitoring and optimization measures

### 5. **Feature Implementation Subagent**
**Task**: Verify complete implementation of all Linear issues (PER-11 through PER-18)
- **PER-11**: User Registration & Profile Creation - verify auth flow, profile setup, privacy controls
- **PER-12**: Location Discovery & Wishlist - check search, save functionality, map integration
- **PER-13**: Multi-Day Route Planning - verify trip creation, optimization, weather integration
- **PER-14**: Real-Time Journaling - check media handling, voice transcription, offline sync
- **PER-15**: Property URL Import - verify web scraping, data extraction, property management
- **PER-16**: Analytics Dashboard - check sentiment analysis, insights, export functionality
- **PER-17**: Weather Integration - verify multi-provider setup, climate analysis, alerts
- **PER-18**: Smart Checklists - check suggestion engine, collaboration, templates

### 6. **Security & Privacy Subagent**
**Task**: Comprehensive security audit and privacy compliance review
- Audit authentication and authorization implementation
- Check data encryption, transmission security, and storage protection
- Review GDPR compliance mechanisms and privacy controls
- Assess API security measures (rate limiting, input validation, CORS)
- Check for common vulnerabilities (XSS, CSRF, SQL injection)
- Verify secret management and environment variable security

### 7. **Testing & Quality Subagent**
**Task**: Assess test coverage, code quality, and quality assurance measures
- Analyze test coverage across unit, integration, and E2E tests
- Review code quality tools (ESLint, Prettier, TypeScript configuration)
- Check error handling and edge case coverage
- Assess performance testing and optimization measures
- Verify user acceptance criteria compliance for all Linear issues
- Review code review processes and quality gates

### 8. **Production Readiness Subagent**
**Task**: Evaluate deployment readiness and operational concerns
- Review CI/CD pipeline configuration and automation
- Check monitoring, logging, and observability implementation
- Assess scalability and high availability measures
- Review documentation completeness (setup, deployment, operations)
- Evaluate backup, recovery, and disaster preparedness
- Check production security hardening and environment configuration

## 📊 Required Output from Each Subagent

Each Subagent must provide:

### **1. Implementation Status Score**
- Overall score for their domain (0-100)
- Individual component scores with ✅/⚠️/❌ ratings
- Percentage completion for relevant Linear issues

### **2. Critical Issues Found**
- High-priority issues requiring immediate attention
- Security vulnerabilities or compliance gaps
- Performance bottlenecks or scalability concerns
- Missing features that block production deployment

### **3. Gap Analysis**
- Missing implementations from Linear issue requirements
- Incomplete features with estimated completion effort
- Integration gaps between different domains
- Technical debt areas requiring refactoring

### **4. Improvement Recommendations**
- Specific enhancement opportunities with implementation steps
- Performance optimization recommendations
- Security improvements with priority levels
- Code quality improvements and best practices

### **5. Evidence-Based Findings**
- Specific file paths and code examples supporting findings
- Quantitative metrics where available (test coverage, performance metrics)
- Comparison against requirements from Linear issues
- References to industry best practices and standards

## 🎯 Final Consolidation Requirements

After all Subagents complete their analysis, provide:

### **Executive Summary**
- Overall project health score (0-100)
- Production readiness assessment
- Critical path items for launch
- Resource requirements for completion

### **Prioritized Action Plan**
```markdown
## Phase 1: Critical Fixes (1-2 weeks)
- [ ] Critical issue 1 with owner and timeline
- [ ] Critical issue 2 with dependencies

## Phase 2: Feature Completion (2-4 weeks)
- [ ] Missing feature 1 with effort estimate
- [ ] Integration gap 2 with requirements

## Phase 3: Production Preparation (1-2 weeks)
- [ ] Production task 1 with acceptance criteria
- [ ] Monitoring setup 2 with success metrics


### **Risk Assessment**
- Technical risks that could impact launch timeline
- Business risks from missing or incomplete features
- Security risks requiring immediate mitigation
- Performance risks under expected load

### **Success Criteria for Production Launch**
- Clear checklist of items that must be completed before launch
- Performance benchmarks that must be met
- Security requirements that must be satisfied
- Feature completeness thresholds

## 🔍 Implementation Instructions

1. **Start by exploring the project structure** to understand the current state
2. **Focus on evidence-based analysis** - provide specific file paths and examples
3. **Reference Linear issues** when evaluating feature completeness
4. **Consider the three main user personas** (Marie, Alex, Jordan) when assessing UX
5. **Evaluate against production standards** - not just "working" but "production-ready"
6. **Provide actionable recommendations** with specific implementation guidance

## 📝 Special Focus Areas

Given the complexity of Xplore, pay special attention to:
- **Real-time collaboration features** (trips, checklists, journaling)
- **Weather intelligence integration** across all relevant features
- **Property web scraping** implementation and data accuracy
- **Mobile offline functionality** and sync mechanisms
- **Cross-platform consistency** between web and mobile apps
- **Performance under realistic data loads** (thousands of users, millions of data points)
- **Security of sensitive user data** (location, personal information, property interests)

Begin the comprehensive review now, with each Subagent working in parallel on their assigned domain.
```