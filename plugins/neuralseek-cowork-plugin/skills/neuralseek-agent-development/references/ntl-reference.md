# NeuralSeek mAIstro & NTL (NeuralSeek Template Language) — Complete Reference Guide v3

> **Purpose**: Self-contained reference for building agents on NeuralSeek mAIstro. Pass to any LLM for full context on NTL syntax, the complete node catalog (140+ nodes), agent architecture, and integration patterns.

---

## 1. What is mAIstro?

**mAIstro** is NeuralSeek's visual, no-code/low-code **agentic workflow builder**. Agents are directed graphs of nodes (blocks) that chain together to automate workflows: API calls, database queries, LLM prompts, file processing, looping, branching, and more.

Agents are callable via REST endpoints (`/mAIstro` synchronous, `/mAIstro_stream` for long-running) and can nest other agents as sub-agents.

**Key concepts:**
- **Agent (Template)**: A named workflow graph, independently callable.
- **Node (Block)**: A single execution unit. Each type has specific functionality and parameters.
- **Variable**: A named value flowing through the agent context.
- **NTL**: The syntax for defining nodes and interpolating variables.

---

## 2. NTL — Core Syntax

### 2.1 Node Definition Syntax

Nodes are enclosed in **double curly braces** with **pipe-delimited parameters**:

```
{{ node_type | parameter1: "value1" | parameter2: "value2" }}
```

The **arrow operator `=>`** chains nodes, passing context/output forward:

```
{{ post | url: "https://api.example.com" | operation: "GET" }} => {{ variable | name: "result" }}
```

Literal text and variable references **outside** `{{ }}` braces act as prompts/payloads passed to the next node.

### 2.2 Variable Interpolation Syntax

Variables are referenced using **double angle brackets** `<< >>` inside any text field or parameter:

```
<< name: variableName, prompt: false >>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | The variable name to reference. |
| `prompt` | Yes | `true` = prompt caller for value at runtime (input). `false` = use current value silently. |
| `desc` | No | Human-readable description shown when `prompt: true`. |

### 2.3 Examples

```
// User-facing input
<< name: stockSymbol, prompt: true, desc: "Enter ticker (e.g., AAPL)" >>

// Internal reference
<< name: ticker, prompt: false >>

// In a URL
https://data.sec.gov/api/xbrl/companyfacts/CIK<< name: cik, prompt: false >>.json

// In a JSON payload
{
  "title": "<< name: title, prompt: false >>",
  "content_vector": [<< name: embeddings.embedding, prompt: false >>],
  "ticker": "<< name: ticker, prompt: false >>"
}

// Concatenated with static text in a query
"<< name: companyName, prompt: false >> major corporate acquisitions 2020-2025"
```

### 2.4 Special Variables

| Variable | Context | Description |
|----------|---------|-------------|
| `loopValue` | Inside any loop | The current iteration's value. |

### 2.5 Variable Scoping

- Scoped to the agent execution context.
- Parent variables pass to child agents via `maistroSandbox` params.
- `prompt: true` = entry point (must be provided by caller).
- `prompt: false` = exists in current context.
- **Case-sensitive.**

---

## 3. Complete Node Catalog (140+ Nodes)

Every available NTL node, organized by category. Parameters shown are the configurable fields; all support NTL variable interpolation in their values.

---

### 3.1 🤖 AI / LLM Nodes

#### `LLM` — Send Prompt to LLM
The primary node for AI generation. Sends a prompt to a configured language model.
```
{{ LLM | prompt: "Analyze: << name: data, prompt: false >>" | cache: "false" | stream: "enable_streaming" | modelCard: "ns-gpt-5" | maxTokens: "8000" | temperatureMod: "0.1" }}
```
| Parameter | Description |
|-----------|-------------|
| `prompt` | Full prompt text with NTL interpolation. |
| `cache` | `"true"` to cache; `"false"` for fresh generation. |
| `stream` | `"enable_streaming"` for streaming output. |
| `modelCard` | Model identifier (configured at instance level). |
| `maxTokens` | Max response tokens. |
| `temperatureMod` | Temperature modifier (lower = more deterministic). |

#### `llmPlan` / `llmAct` — Plan-and-Act Pattern
Two-stage LLM execution: `llmPlan` generates a plan, `llmAct` executes it.
```
{{ llmPlan }} => {{ llmAct }}
```

#### `generateImage` — AI Image Generation
Generates an image from a text prompt.
```
{{ generateImage }}
```

#### `generateImageEdit` — AI Image Editing
Edits an existing image based on instructions.
```
{{ generateImageEdit }}
```

#### `generateVideo` — AI Video Generation
Generates video content.
```
{{ generateVideo }}
```

#### `generateSpeech` — Text-to-Speech
Converts text to spoken audio.
```
{{ generateSpeech }}
```

#### `summarize` — Text Summarization
Summarizes input text.
```
{{ summarize }}
```

#### `translate` / `translateHTML` — Translation
Translates text or HTML content to a target language.
```
{{ translate | target: "es" }}
{{ translateHTML | target: "fr" }}
```

#### `embeddings` — Generate Vector Embeddings
Generates vector embeddings for text. Model-specific prefixes may be required (e.g., `passage:` / `query:` for e5-small-v2).
```
{{ embeddings | model: "e5-small-v2" }}
```

#### `semanticScore` — Semantic Similarity Scoring
Scores the semantic similarity between two texts.
```
{{ semanticScore | text: "candidate answer" | truth: "ground truth" }}
```

---

### 3.2 📦 Variable & Data Nodes

#### `variable` — Set a Variable
Captures the preceding node's output into a named variable.
```
{{ variable | name: "myVar" }}
```
| Parameter | Description |
|-----------|-------------|
| `name` | Variable name to assign. |
| `mode` | `"overwrite"` (default) or `"append"`. |

#### `deleteVariable` — Delete a Variable
Removes a variable from the current context.
```
{{ deleteVariable | name: "myVar" }}
```

#### `useVariable` — Use/Reference a Variable
Explicitly injects a variable's value into the flow.
```
{{ useVariable }}
```

#### `jsonToVars` — JSON to Variables
Parses JSON and maps keys into mAIstro variables.
```
{{ jsonToVars | startingPath: "hits" | prefix: "result_" }}
```

#### `varsToJSON` — Variables to JSON
Collects variables into a JSON object.
```
{{ varsToJSON | path: "" | variable: "" | includePath: "" | output: "" }}
```

#### `jsonEscape` — JSON Escape Strings
Escapes special characters for safe JSON embedding.
```
{{ jsonEscape }}
```

---

### 3.3 🔀 Control Flow Nodes

#### `condition` — Conditional Branching
Evaluates an expression and routes execution.
```
{{ condition | value: "'<< name: status, prompt: false >>'=='0'" }}
```
Supports: `==`, `!=`, `>`, `<`, string and numeric comparisons.

#### `stop` — Halt Execution
Immediately terminates the workflow.
```
{{ stop }}
```

**Common pattern — halt on invalid session:**
```
{{ condition | value: "'<< name: auth, prompt: false >>'=='INVALID'" }} => INVALID=>{{ stop }}
```

#### `startLoop` — Count-Based Loop
Loops a fixed number of times.
```
{{ startLoop | count: "5" }}
  ... loop body ...
{{ endLoop }}
```

#### `endLoop` — Close Any Loop
**Required** to close every loop type.
```
{{ endLoop | sleep: "0" }}
```
| Parameter | Description |
|-----------|-------------|
| `sleep` | Seconds between iterations (rate limiting). |

#### `breakLoop` — Break Out of Loop
Exits the current loop early.
```
{{ breakLoop }}
```

#### `contextLoop` — Token-Based Text Chunking Loop
Breaks text into token-sized chunks and iterates. Each chunk available as `loopValue`.
```
{{ contextLoop | tokens: "1000" | overlap: "0" }}
  ... process << name: loopValue, prompt: false >> ...
{{ endLoop | sleep: "0" }}
```

#### `variableLoop` — Array Iteration Loop
Iterates over a JSON array. Each element available as `loopValue`.
```
{{ variableLoop | variable: "hits" | loopType: "array-objects" | consumeDelete: "" }}
  ... process << name: loopValue, prompt: false >> ...
{{ endLoop | sleep: "0" }}
```
| Parameter | Description |
|-----------|-------------|
| `variable` | Name of the array variable. |
| `loopType` | `"array-objects"` for JSON object arrays. |
| `consumeDelete` | Delete consumed elements from array if set. |

#### `agentLoop` — Agentic Loop
An autonomous loop where the agent decides when to stop.
```
{{ agentLoop }}
  ... agent logic ...
{{ endLoop }}
```

#### `videoLoop` — Video Frame Loop
Iterates over video frames.
```
{{ videoLoop | video: "" | url: "" | fps: "1" | framesPerLoop: "1" }}
  ...
{{ endLoop }}
```

#### `pdfLoop` — PDF Page Loop
Iterates over pages of a PDF.
```
{{ pdfLoop | file: "" | pagesPerLoop: "1" }}
  ...
{{ endLoop }}
```

#### `delay` — Pause Execution
```
{{ delay | seconds: "1" }}
```

#### `comment` — Documentation
No execution effect. For visual editor annotation (yellow blocks).
```
{{ comment | text: "Authentication section" }}
```

#### `stream` — Stream Output
Streams intermediate output to the caller during execution.
```
{{ stream }}
```

---

### 3.4 🌐 REST & Web Nodes

#### `post` — REST API Call
Makes HTTP requests to external endpoints.
```
{{ post | url: "https://api.example.com" | headers: "{\"Authorization\": \"Bearer << name: token, prompt: false >>\"}" | operation: "GET" | jsonToVars: "false" }}
```
| Parameter | Description |
|-----------|-------------|
| `url` | Endpoint URL (supports NTL). |
| `headers` | JSON string of HTTP headers. |
| `operation` | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`. |
| `jsonToVars` | `"true"` to auto-parse response into variables. |

#### `web` — Web Search/Fetch
Fetches web content.
```
{{ web }}
```

#### `linkRipper` — Extract Content from URL
Scrapes and extracts content from a webpage.
```
{{ linkRipper | url: "https://example.com" }}
```

#### `googleSearch` — Google Search
Performs a Google search query.
```
{{ googleSearch }}
```

#### `braveSearch` — Brave Search
Performs a Brave search query.
```
{{ braveSearch }}
```

---

### 3.5 🗄️ Database Nodes

#### `postgres` — PostgreSQL
```
{{ postgres | query: "SELECT * FROM companies WHERE ticker='<< name: ticker, prompt: false >>';" | uri: "<< name: pg_uri, prompt: false >>" | rds: "false" | ssl: "true" }}
```
| Parameter | Description |
|-----------|-------------|
| `query` | SQL statement (supports NTL). |
| `uri` | Connection string (use secrets). |
| `rds` | `"true"` for AWS RDS. |
| `ssl` | `"true"` for SSL. |

#### `mysql` — MySQL
```
{{ mysql | uri: "" }}
```

#### `mariadb` — MariaDB
```
{{ mariadb | uri: "" }}
```

#### `mssql` — Microsoft SQL Server
```
{{ mssql | uri: "" }}
```

#### `oracle` — Oracle Database
```
{{ oracle | uri: "" }}
```

#### `db2` — IBM Db2
```
{{ db2 | DATABASE: "" | HOSTNAME: "" | UID: "" | PWD: "" | PORT: "" | SECURE: "true" }}
```

#### `redshift` — Amazon Redshift
```
{{ redshift | uri: "" }}
```

#### `bigquery` — Google BigQuery
```
{{ bigquery | projectId: "" | location: "" | credentials: "" }}
```

#### `snowflake` — Snowflake
```
{{ snowflake | accessUrl: "" | username: "" | password: "" | database: "" }}
```

#### `databricks` — Databricks
```
{{ databricks | host: "" | path: "" | token: "" }}
```

#### `neo4j` — Neo4j Graph Database
```
{{ neo4j | boltURI: "" | username: "" | password: "" }}
```

#### `elastic` — Elasticsearch
```
{{ elastic | operation: "search" | payload: "{...}" }}
```

#### `watsonDiscovery` — IBM Watson Discovery
```
{{ watsonDiscovery }}
```

---

### 3.6 📁 File & Document Nodes

#### `doc` — Reference a Document
```
{{ doc | name: "report.pdf" }}
```

#### `readB64Doc` — Read Base64 Document
Reads a document encoded in base64.
```
{{ readB64Doc }}
```

#### `saveB64Doc` — Save Base64 Document
Saves base64-encoded data as a document.
```
{{ saveB64Doc }}
```

#### `createFile` — Create a Generic File
```
{{ createFile }}
```

#### `createPPT` — Create PowerPoint
```
{{ createPPT }}
```

#### `createDOC` — Create Word Document
```
{{ createDOC }}
```

#### `createPDF` — Create PDF
```
{{ createPDF }}
```

#### `TableUnderstanding` — Table Extraction/Analysis
Extracts and interprets tabular data from documents.
```
{{ TableUnderstanding }}
```

#### `ocr` — Optical Character Recognition
Extracts text from images/scanned documents.
```
{{ ocr }}
```

---

### 3.7 🔄 Data Transformation Nodes

#### `jsonTools` — JSON Cleanse & Filter
```
{{ jsonTools | filter: "key_name" | filterType: "include" }}
```

#### `JSONtoCSV` — Convert JSON to CSV
```
{{ JSONtoCSV }}
```

#### `reMapJSON` — Remap JSON Keys
```
{{ reMapJSON | match: "old_key" | replace: "new_key" }}
```

#### `arrayMerge` — Merge Two Arrays
```
{{ arrayMerge | array1: "arr1" | array2: "arr2" }}
```

#### `arrayFilter` — Filter Array Elements
```
{{ arrayFilter | filter: "" | filterType: "" }}
```

#### `resortArray` — Sort Array
```
{{ resortArray | array: "myArray" | sort: "asc" }}
```

#### `keyFilter` — Filter JSON by Keys
```
{{ keyFilter | filter: "key1,key2" }}
```

#### `XMLtoJSON` / `JSONtoXML` — Format Conversion
```
{{ XMLtoJSON }}
{{ JSONtoXML }}
```

#### `extractCode` — Extract Code Blocks
Extracts code blocks from LLM responses (e.g., content between backtick fences).
```
{{ extractCode }}
```

#### `cleanHTML` — Strip HTML Tags
```
{{ cleanHTML }}
```

#### `cleanSQL` — Sanitize SQL
```
{{ cleanSQL }}
```

#### `convertToHTML` — Convert to HTML
```
{{ convertToHTML }}
```

#### `uppercase` / `lowercase` — Case Conversion
```
{{ uppercase }}
{{ lowercase }}
```

#### `b64encode` / `b64decode` — Base64 Encoding
```
{{ b64encode }}
{{ b64decode }}
```

#### `urlencode` / `urldecode` — URL Encoding
```
{{ urlencode }}
{{ urldecode }}
```

#### `split` / `splitDelim` — String Splitting
```
{{ split }}
{{ splitDelim | delimiter: "," }}
```

#### `regex` — Regular Expression
```
{{ regex | pattern: "/\\.([^.]+)$/" }}
```

#### `truncateToken` — Truncate by Token Count
```
{{ truncateToken | tokens: "2500" }}
```

#### `stopwords` — Remove Stop Words
```
{{ stopwords }}
```

#### `forceNumeric` — Extract/Force Numeric Values
```
{{ forceNumeric }}
```

#### `math` — Mathematical Operations
```
{{ math }}
```

#### `pack` / `unPack` — Pack/Unpack Data
```
{{ pack }}
{{ unPack }}
```

#### `tablePrep` — Table Data Preparation
```
{{ tablePrep | query: "" | sentences: "array" }}
```

---

### 3.8 🤖 Agent Composition Nodes

#### `maistro` — Call mAIstro Agent (Inline)
Calls another agent inline within the current flow.
```
{{ maistro }}
```

#### `maistroSandbox` — Call Agent (Sandboxed)
Calls a child agent in an isolated sandbox with parameter passing.
```
{{ maistroSandbox | template: "session_validator" | params: "{\"session_id\":\"<< name: session_id, prompt: false >>\"}" }}
```

#### `getNTL` — Get Agent NTL Code
Retrieves the NTL source code of an agent.
```
{{ getNTL }}
```

#### `makeNTL` — Generate NTL Code
Dynamically generates NTL code (meta-programming).
```
{{ makeNTL }}
```

#### `selectAgent` — Dynamic Agent Selection
Selects an agent to call based on runtime logic.
```
{{ selectAgent }}
```

#### `selectAgentPlan` — Plan-Based Agent Selection
Selects an agent based on an LLM-generated plan.
```
{{ selectAgentPlan }}
```

#### `callA2A` — Agent-to-Agent Call (External)
Calls an external agent via URL (cross-instance communication).
```
{{ callA2A | url: "https://other-instance.neuralseek.com/agent" }}
```

#### `callMCP` — Call MCP Server
Calls a Model Context Protocol server.
```
{{ callMCP }}
```

---

### 3.9 📊 Chart / Visualization Nodes

```
{{ areaChart }}
{{ lineChart }}
{{ barChart }}
{{ pieChart }}
{{ doughnutChart }}
{{ bubbleChart }}
```

---

### 3.10 🎬 Media / Video Nodes

#### `videoFrame` — Extract Video Frame
```
{{ videoFrame | video: "file.mp4" | frame: "last" }}
```

#### `joinMedia` — Join Media Files
```
{{ joinMedia | files: "file1.mp4,file2.mp4" | outputFile: "merged.mp4" }}
```

#### `ffmpeg` — FFmpeg Processing
Full FFmpeg command-line access for media processing.
```
{{ ffmpeg | video: "" | inputOptions: "" | outputOptions: "" | outputFile: "" }}
```

#### `mergeAudioVideo` — Merge Audio + Video
```
{{ mergeAudioVideo | audio: "audio.mp3" | video: "video.mp4" }}
```

---

### 3.11 💾 Caching Nodes

```
{{ readCacheKey }}
{{ writeCacheKey }}
{{ deleteCacheIndex }}
{{ listCacheKeys }}
{{ writePhoneticCacheKey }}
```

---

### 3.12 🔍 Search & Knowledge Nodes

#### `seek` — NeuralSeek Seek Query
Queries the NeuralSeek knowledge base with full RAG.
```
{{ seek | query: "What are the risk factors?" }}
```

#### `kb` — Knowledge Base Direct Query
Direct knowledge base query.
```
{{ kb | query: "revenue growth trends" }}
```

#### `curate` — Curate Knowledge
```
{{ curate }}
```

#### `categorize` — Categorize a Question
Classifies a question into predefined categories.
```
{{ categorize | question: "What is the company's debt ratio?" }}
```

#### `queryCache` — Query the Cache
```
{{ queryCache | question: "previous query" }}
```

#### `sessionHistory` — Retrieve Session History
```
{{ sessionHistory | sessionId: "uuid" | turns: "5" }}
```

#### `addContext` — Add Context to Session
```
{{ addContext | session_id: "uuid" }}
```

---

### 3.13 📧 Email Nodes

```
{{ email | message: "Hello..." }}
{{ parseEmail }}
{{ createEmail }}
{{ gmailSearch }}
{{ gmailList }}
{{ gmailSend }}
{{ gmailDelete }}
{{ gmailMove }}
{{ gmailGetEmail }}
```

---

### 3.14 ☁️ Cloud Storage Nodes

#### SharePoint
```
{{ sharepointListFiles }}
{{ sharepointDownload }}
{{ sharepointUpload }}
```

#### Box
```
{{ boxListFolder }}
{{ boxWriteFile }}
{{ boxReadFile }}
```

#### SFTP
```
{{ sftpListFolder }}
{{ sftpWriteFile }}
{{ sftpReadFile }}
```

#### AWS S3
```
{{ s3Read }}
{{ s3Write }}
{{ s3Delete }}
{{ s3List }}
```

#### Azure Blob Storage
```
{{ azBlobListContainers }}
{{ azBlobList }}
{{ azBlobRead }}
{{ azBlobWrite }}
{{ azBlobDelete }}
```

#### Google Drive
```
{{ readGoogleDrive }}
{{ writeGoogleDrive }}
```

---

### 3.15 🔧 Project Management & Collaboration Nodes

#### Jira
```
{{ jiraSearch }}
{{ jiraGetProjects }}
{{ jiraGetIssue }}
{{ jiraAddIssue }}
{{ jiraEditIssue }}
```

#### Trello
```
{{ trelloSearch }}
{{ trelloGetList }}
{{ trelloGetCard }}
{{ trelloCreateCard }}
{{ trelloUpdateCard }}
```

#### GitHub
```
{{ githubSearch }}
{{ githubGetIssues }}
{{ githubGetIssue }}
{{ githubAddIssue }}
```

#### Slack
```
{{ slackSearch }}
{{ slackConversationHistory }}
{{ slackSendMessage }}
{{ slackEventIn }}
{{ slackEventOut }}
```

#### Google Calendar
```
{{ googleCalendarSearch }}
{{ googleCalendarList }}
{{ googleCalendarAddEvent }}
{{ googleCalendarUpdateEvent }}
{{ googleCalendarDeleteEvent }}
{{ googleCalendarGetEvent }}
```

---

### 3.16 🛡️ Governance, Security & Safety Nodes

#### Content Protection
```
{{ protect | piThreshold: "0.8" | piRemoveThreshold: "0.9" }}
{{ profanity }}
{{ PII }}
{{ regexPII }}
```

#### Seek Pipeline Hooks (Pre/Post Processing)
These are injection points in the NeuralSeek Seek pipeline for custom logic:
```
{{ dynamicPersonalizationIn }}   {{ dynamicPersonalizationOut }}
{{ contextGrammar }}
{{ minConfMsg }}
{{ minWordsMsg }}
{{ maxWordsMsg }}
{{ virtualKbIn }}                {{ virtualKbOut | context: "" | kbCoverage: "0" | kbScore: "0" | url: "" | document: "" }}
{{ postKBAgentIn }}              {{ postKBAgentOut | context: "" }}
{{ seekIn }}                     {{ seekOut | answer: "" | kbCoverage: "0" | kbScore: "0" | url: "" | passages: "" | document: "" }}
{{ corpLogIn }}                  {{ corpLogReplay }}
{{ preCustomGovernanceIn }}      {{ preCustomGovernanceOut }}
{{ customGovernanceIn }}         {{ customGovernanceOut }}
```

---

### 3.17 🔐 Security & Auth Nodes

#### `jwtCreate` — Create JWT Token
```
{{ jwtCreate | signingkey: "" | algorithm: "HS256" | body: "{}" }}
```

---

### 3.18 🧰 Utility Nodes

```
{{ date }}                    // Current date
{{ time }}                    // Current time
{{ dateTime }}                // Current date+time
{{ uuid }}                    // Generate UUID
{{ random }}                  // Generate random value
{{ categories }}              // List configured categories
{{ intents }}                 // List configured intents
{{ gather }}                  // Gather/collect data
{{ extract }}                 // Extract structured data
{{ agentsData }}              // Get agents metadata
{{ seekUsersData }}           // Get Seek users data
{{ maistroUsersData }}        // Get mAIstro users data
{{ getPackedConfig }}         // Get packed configuration
```

#### Watson Integration
```
{{ watsonXGovSeek }}
{{ watsonXGovRaw }}
```

#### Python & JavaScript Sandboxes

```
{{ pythonSandbox | script: "import json\nprint('hello')" | maxTime: "30000" }}
{{ javascriptSandbox | script: "return 'hello';" }}
```

---

## 4. NTL Code Patterns (Copy-Paste Examples)

### 4.1 REST Call → Store Result
```
{{ post | url: "https://api.finage.co.uk/last/trade/stock/<< name: ticker, prompt: false >>" | operation: "GET" }}
=> {{ variable | name: "lastTrade" }}
```

### 4.2 Session Validation → Halt on Invalid
```
{{ maistroSandbox | template: "session_validator" | params: "{\"session_id\":\"<< name: session_id, prompt: false >>\"}" }}
=> {{ variable | name: "auth" }}
=> {{ condition | value: "'<< name: auth, prompt: false >>'=='INVALID'" }}
=> INVALID=>{{ stop }}
```

### 4.3 Database Check → Conditional Branching
```
{{ postgres | query: "SELECT MAX(id) FROM companies WHERE ticker = '<< name: ticker, prompt: false >>';" | uri: "<< name: pg_uri, prompt: false >>" | ssl: "true" }}
=> {{ variable | name: "status" }}

{{ condition | value: "'<< name: status, prompt: false >>'=='0'" }}
=> {{ maistroSandbox | template: "new_company_ingestion" | params: "{\"ticker\":\"<< name: ticker, prompt: false >>\"}" }}

{{ condition | value: "'<< name: status, prompt: false >>'!='0'" }}
=> {{ maistroSandbox | template: "check_mode_info_available" | params: "{...}" }}
```

### 4.4 Loop Over Array → Process Each
```
{{ variableLoop | variable: "search_results" | loopType: "array-objects" | consumeDelete: "" }}
  << name: loopValue, prompt: false >>
  => {{ jsonToVars | startingPath: "" | prefix: "" }}
  => {{ maistroSandbox | template: "embedding_ingestion" | params: "{\"raw\":\"<< name: raw_content, prompt: false >>\"}" }}
{{ endLoop | sleep: "0" }}
```

### 4.5 Text Chunk → Embed → Index
```
{{ contextLoop | tokens: "500" | overlap: "10" }}
  << name: loopValue, prompt: false >>
  => {{ maistroSandbox | template: "cleaning_text" | params: "{\"text\":\"<< name: loopValue, prompt: false >>\"}" }}
  => {{ variable | name: "cleaned_chunk" }}
  => {{ embeddings | model: "e5-small-v2" }}
  => {{ variable | name: "embed_result" }}
  => {{ elastic | operation: "index" | payload: "{\"index\":\"<< name: index, prompt: false >>\",\"body\":{\"text_content\":\"<< name: cleaned_chunk, prompt: false >>\",\"content_vector\":[<< name: embed_result.embedding, prompt: false >>]}}" }}
{{ endLoop | sleep: "0" }}
```

### 4.6 LLM with Context Injection
```
{{ LLM | prompt: "Act as a Lead Equity Research Analyst.\n\nFinancial Data:\n<< name: financialData, prompt: false >>\n\nContext:\n<< name: context, prompt: false >>\n\nGenerate a research report." | cache: "false" | modelCard: "ns-gpt-5" | maxTokens: "8000" | temperatureMod: "0.1" }}
=> {{ variable | name: "report" }}
```

### 4.7 File Extension Routing
```
<< name: filename, prompt: false >>
=> {{ regex | pattern: "/\\.([^.]+)$/" }}
=> {{ lowercase }}
=> {{ variable | name: "ext" }}

{{ condition | value: "'<< name: ext, prompt: false >>'=='pdf'" }}
=> {{ maistroSandbox | template: "PDF_Page_JSON_Extractor" | params: "{\"pdf_name\":\"<< name: filename, prompt: false >>\"}" }}

{{ condition | value: "'<< name: ext, prompt: false >>'=='png'" }}
=> {{ maistroSandbox | template: "Image_OCR_Embeddings_Elastic_Indexer" | params: "{...}" }}
```

### 4.8 PDF Page-by-Page Processing
```
{{ pdfLoop | file: "<< name: pdf_file, prompt: false >>" | pagesPerLoop: "1" }}
  << name: loopValue, prompt: false >>
  => {{ LLM | prompt: "Extract structured text from this page..." }}
  => {{ variable | name: "page_content" }}
  => {{ maistroSandbox | template: "PDF_Embeddings_Elastic_Indexer" | params: "{...}" }}
{{ endLoop | sleep: "0" }}
```

### 4.9 Count-Based Loop with Break
```
{{ startLoop | count: "10" }}
  ... do work ...
  {{ condition | value: "'<< name: done, prompt: false >>'=='true'" }}
  => {{ breakLoop }}
{{ endLoop }}
```

---

## 5. Architecture Patterns

### 5.1 Sequential Flow
Nodes execute top-to-bottom (visual) or left-to-right via `=>` chains.

### 5.2 Parallel Execution
Independent blocks in a visual "Block" container run simultaneously. ~28s vs ~36s for equivalent sequential REST calls.

### 5.3 Conditional Branching
Chain `condition` nodes vertically for if/else-if/else. Use `{{ stop }}` to halt on errors.

### 5.4 Orchestrator Pattern
Master agent coordinating sub-agents: validate session → check state → branch to ingestion or retrieval → link results.

### 5.5 Ingestion Pipeline
```
Source → Loop results → Extract fields → contextLoop chunks → clean → embed → index
```

### 5.6 Plan-and-Act Pattern
```
{{ llmPlan }} => {{ llmAct }}
```
LLM generates a plan, then executes it autonomously.

### 5.7 Agentic Loop Pattern
```
{{ agentLoop }}
  ... autonomous decision-making logic ...
{{ endLoop }}
```

---

## 6. Integration Reference

### 6.1 Supported Database Connectors
PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, DB2, Redshift, BigQuery, Snowflake, Databricks, Neo4j, Elasticsearch, Watson Discovery.

### 6.2 Supported Cloud Storage
AWS S3, Azure Blob, Google Drive, SharePoint, Box, SFTP.

### 6.3 Supported SaaS Integrations
Jira, Trello, GitHub, Slack, Google Calendar, Gmail.

### 6.4 Search Providers
Google Search, Brave Search, Watson XGov.

### 6.5 API Endpoints
| Endpoint | Use Case |
|----------|----------|
| `POST /mAIstro` | Synchronous. Short-running agents. |
| `POST /mAIstro_stream` | Streaming. Long-running agents. |
| Seek API | Chatbot conversational interface. |

### 6.6 Secrets Management
Store credentials as NeuralSeek secrets, reference via NTL variables. Never hardcode.

---

## 7. Embedding & Vector Search

### 7.1 Ingestion Pattern
```
Raw Text → contextLoop (500 tokens, 10 overlap) → clean → embed (passage: prefix) → elastic index
```

### 7.2 Elasticsearch Document Schema
```json
{
  "title": "string",
  "text_content": "string",
  "content_vector": [float],
  "source_url": "string",
  "ticker": "string",
  "visibility": "public|private",
  "session_id": "uuid|null"
}
```

### 7.3 Hybrid Search
Combines multi-match keyword search + kNN vector search + boolean filters.

### 7.4 Model Prefixes
`e5-small-v2`: `passage:` for indexing, `query:` for searching.

---

## 8. Database Schemas (Reference Implementation)

### 8.1 PostgreSQL
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    entra_object_id TEXT UNIQUE,
    display_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE data_richness AS ENUM ('none', 'basic', 'full');
CREATE TYPE ingestion_status_type AS ENUM ('pending', 'complete', 'failed');

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY, ticker TEXT UNIQUE, name TEXT NOT NULL,
    data_level data_richness DEFAULT 'none',
    ingestion_status ingestion_status_type DEFAULT 'pending',
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE session_companies (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    company_id INT REFERENCES companies(id) ON DELETE CASCADE,
    is_principal BOOLEAN DEFAULT FALSE,
    UNIQUE(session_id, company_id)
);

CREATE TABLE financial_metrics (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, year INT NOT NULL,
    value NUMERIC(20, 2), pct_rev NUMERIC(10, 2),
    UNIQUE(company_id, metric_name, year)
);

CREATE TABLE session_raw_tables (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    table_name TEXT UNIQUE NOT NULL,
    original_file_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-cleanup trigger
CREATE OR REPLACE FUNCTION drop_dynamic_raw_tables()
RETURNS TRIGGER AS $$ BEGIN
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(OLD.table_name);
    RETURN OLD;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_raw_tables
AFTER DELETE ON session_raw_tables
FOR EACH ROW EXECUTE FUNCTION drop_dynamic_raw_tables();
```

---

## 9. Execution Trees (Reference Implementation)

### Auth Flow
```
Frontend → Microsoft_Login_Flow (JWT → session_id)
         → session_validator (every request) → [Agent Logic]
```

### Company Ingestion
```
Orchestrator
├── get_cik_name_python (Ticker → CIK)
├── postgres_check_company
├── IF NEW → new_company_database_ingestion
│   ├── Edgar_API → postgres_financial_metric_ingestion
│   └── tavily_api_call (×5) → API_results_iteration → embedding_ingestion
├── IF EXISTS → check_mode → update if needed
└── Link company to session
```

### File Upload
```
File_Extension_Type_Detector
├── .pptx/.docx → file_converter_agent → PDF_Page_JSON_Extractor
├── .pdf        → PDF_Page_JSON_Extractor → PDF_Embeddings_Elastic_Indexer
├── .png/.jpg   → Image_OCR_Embeddings_Elastic_Indexer
└── .xlsx/.csv  → Spreadsheet_JSON_Postgres_Loader
```

---

## 10. Best Practices

1. **`comment` blocks are free** — Use them liberally for documentation.
2. **Secrets over hardcoding** — Always use NeuralSeek secrets for credentials.
3. **`pythonSandbox` for complex parsing** — NTL's native JSON is limited.
4. **`truncateToken` before LLM** — Prevent context window overflow.
5. **`/mAIstro_stream` for long agents** — Avoids timeout on multi-step pipelines.
6. **`contextLoop` for chunking** — 500 tokens, 10 overlap for quality embeddings.
7. **`variableLoop` for arrays** — Always close with `{{ endLoop }}`.
8. **Parallel blocks for speed** — Independent operations run simultaneously.
9. **Embedding prefixes** — `passage:` for indexing, `query:` for search.
10. **Session isolation** — Tag private data with `session_id` + `visibility: private`.
11. **`breakLoop` for early exit** — Don't waste iterations.
12. **`pdfLoop` for page-by-page** — Better than manual page counting.
13. **`extractCode`after LLM** — Cleanly extract code from markdown-fenced responses.
14. **Case normalization** — `{{ lowercase }}` before string comparisons.
15. Avoid python and javascript sandboxing unless completely necessary. 
16. NS does not allow referring to arrays directly by name, have to ingest each of the items
17. Condition nodes require single quotes ', not double ones "
---

*Compiled from production implementations, NTL configuration files, and the authoritative all_node.dat platform export (v3, March 2026).*
