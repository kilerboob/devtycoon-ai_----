# Unified Memory System Architecture - DeVOS/CyberNation

**Version:** 1.1 (Updated with Context7)  
**Date:** 2025-11-27  
**Project:** DevTycoon AI: Путь Программиста (DeVOS / CyberNation MMO)

---

## 🧠 Overview

The **Unified Memory System** integrates three complementary MCP servers to provide comprehensive memory management for the DeVOS/CyberNation project:

1. **Memory Bank MCP** — Structured, file-based documentation (Internal)
2. **Rememberizer Vector Store MCP** — Semantic, vector-based long-term memory (Context)
3. **Context7 MCP** — Up-to-date library documentation (External)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Memory System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         Memory Bank MCP (Structured Docs)                 │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Storage:  Local file system (Markdown)                   │ │
│  │  Access:   File path-based                                │ │
│  │  Use Case: Project documentation, schemas, rules          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Content:                                                  │ │
│  │  • REDMAP v6.0 (27 layers)                                │ │
│  │  • Database Schema (PostgreSQL)                           │ │
│  │  • API Plans (REST endpoints)                             │ │
│  │  • AI Rules (Orchestrator, Build Crew)                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │      Rememberizer Vector Store MCP (Semantic Memory)      │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Storage:  Cloud-based vector database                    │ │
│  │  Access:   Semantic search (embeddings)                   │ │
│  │  Use Case: Long-term memory, context, events              │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Content:                                                  │ │
│  │  • Conversation History                                   │ │
│  │  • Game Events & Lore                                     │ │
│  │  • Player Interactions                                    │ │
│  │  • Dynamic Context                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            Context7 MCP (External Docs)                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Storage:  Cloud-based documentation index                │ │
│  │  Access:   Library ID lookup                              │ │
│  │  Use Case: Up-to-date library documentation               │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Content:                                                  │ │
│  │  • React, Next.js, PostgreSQL                             │ │
│  │  • Express, TypeScript, Node.js                           │ │
│  │  • No hallucinations, version-specific                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparison Matrix

| Feature | Memory Bank MCP | Rememberizer Vector Store | Context7 MCP |
|---------|-----------------|---------------------------|--------------|
| **Source** | Local Files | Vector DB | Official Docs |
| **Content** | Internal Project Docs | Context & Memories | External Libraries |
| **Search** | File Path | Semantic Similarity | Library ID |
| **Update** | Manual | AI-driven | Automatic (Source) |
| **Offline** | ✅ Yes | ❌ No | ❌ No |
| **Cost** | Free | API Key | API Key |

---

## 🎯 Use Cases

### Memory Bank MCP (Internal)
- Reading **REDMAP v6.0**
- Checking **Database Schema**
- Reviewing **API Plans**
- Following **AI Rules**

### Rememberizer Vector Store MCP (Context)
- Finding **similar past conversations**
- Retrieving **game lore**
- Checking **player feedback**
- Storing **implementation decisions**

### Context7 MCP (External)
- Getting latest **Next.js middleware** examples
- Checking **PostgreSQL connection pooling** syntax
- Verifying **React hooks** usage
- Avoiding **hallucinated APIs**

---

## 🔄 Workflow Integration

### Phase 1: Pre-Flight
1. **Memory Bank:** Read core project docs
2. **Rememberizer:** Get recent conversation context

### Phase 2: Planning
1. **Memory Bank:** Check architecture & schema
2. **Rememberizer:** Find similar past implementations
3. **Context7:** Fetch docs for required libraries (e.g., "how to use pg-pool")

### Phase 3: Execution
1. **Memory Bank:** Follow rules & schema
2. **Context7:** Use verified code examples
3. **Rememberizer:** Log decisions

### Phase 4: Documentation
1. **Memory Bank:** Update progress & active context
2. **Rememberizer:** Store summary & insights

---

## 🛠️ Setup Instructions

**Windows:**
```powershell
cd memory-bank
.\setup-unified-memory.ps1
```

**Linux/macOS:**
```bash
cd memory-bank
chmod +x setup-unified-memory.sh
./setup-unified-memory.sh
```

*(Both setup-unified-memory scripts now configure Memory Bank, Rememberizer, and Context7. Re-run them after changing API keys and then issue 'read memory bank', 'search memory', and 'use context7' inside Cursor to validate the connections.)*

---

## 🚀 Next Steps

1. **Run setup script**
2. **Enter API keys** (Rememberizer & Context7)
3. **Restart Cursor**
4. **Use:**
   - "read memory bank" (Internal)
   - "search memory" (Context)
   - "use context7" (External Docs)

