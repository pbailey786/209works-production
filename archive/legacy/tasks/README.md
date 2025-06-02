# BMAD Product Management Process

## Overview
This folder contains all product and technical tasks for the 209Jobs project. Task management is aligned with strategic business goals (see `task-46-strategic-alignment.md` and `task-47-technical-architecture.md`).

## Task Tracking
- **active-tasks.json**: The single source of truth for all pending and in-progress tasks, their owners, dependencies, and strategic alignment.
- Each task must map to a strategic goal. If not, flag for review.
- Completed tasks should be archived (move to `archive/` or mark as complete).

## Review Cadence
- **Weekly Review:** Product manager (BMAD) reviews all tasks, updates status, and unblocks dependencies.
- **Alignment Check:** Every task must support a strategic goal from Task 46 or 47. Non-aligned tasks are flagged for removal or revision.

## Task Creation & Management
- Break down large tasks into actionable subtasks with clear acceptance criteria.
- Assign owners and deadlines.
- For new features, document current limitations, user experience issues, and both quick-fix and long-term plans.

## Adding a New Task
1. Add a new entry to `active-tasks.json` with:
   - Unique ID
   - Title
   - Status (pending, in-progress, complete)
   - Owner
   - Dependencies
   - Strategic alignment (reference Task 46/47 goals)
   - Details (if needed)
2. Ensure the task supports a strategic goal. If not, discuss with the product manager.

## Example Task Entry
```json
{
  "id": 54,
  "title": "Implement True NLP/AI-Powered Job Search",
  "status": "pending",
  "owner": "unassigned",
  "dependencies": [],
  "strategic_alignment": ["User experience improvement", "AI/ML differentiation", "Task 46.5"],
  "details": {
    "current_limitations": "Search only does basic keyword matching. No support for natural language queries or structured filter extraction.",
    "quick_fix_plan": "Implement regex-based parser for common patterns (salary, location, job type, etc) as a quick solution.",
    "long_term_plan": "Integrate LLM (OpenAI or local model) to extract intent and filters from natural language queries. Parsing can happen on frontend, backend, or both.",
    "user_experience_issues": "Users cannot search with natural language (e.g., 'jobs paying $20 or more per hour', 'remote frontend jobs in Austin'). No structured filter extraction."
  }
}
```

## Strategic Alignment
- All tasks must reference a strategic goal from Task 46 or 47.
- If a task does not align, flag for review.

---

*BMAD Product Manager: Ensuring every task drives strategic value and launch readiness.* 