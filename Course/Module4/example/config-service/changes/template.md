# Work Item Template

Use this template when creating new work item documents. Copy this file to create numbered work items (e.g., `001-feature-name.md`, `002-bug-fix.md`).

## Story Details

> As a [PERSONA], I want [FEATURE], so that [JUSTIFICATION]

### Notes
**1-2 sentence description of additional information about this story**

### Acceptance Criteria (Given-When-Then Format)
**Clear, testable behavioral scenarios that define completion. Each represents roughly 1-3 commits:**

#### Task 1: [Brief Description]
- **Given**: [Initial context/state]
- **When**: [Action or trigger]
- **Then**: [Expected outcome/behavior]
- **Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

#### Task 2: [Brief Description]
- **Given**: [Initial context/state]
- **When**: [Action or trigger]
- **Then**: [Expected outcome/behavior]
- **Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

#### Task 3: [Brief Description]
- **Given**: [Initial context/state]
- **When**: [Action or trigger]
- **Then**: [Expected outcome/behavior]
- **Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

*Add more tasks as needed...*

## Current Task Focus

- **Active Task**: [Task number and brief description from acceptance criteria above]
- **Stage**: [PLAN / BUILD & ASSESS / REFLECT & ADAPT / COMMIT & PICK NEXT]
- **Branch**: `feature/branch-name`
- **Last Updated**: YYYY-MM-DD

### STAGE 1: PLAN
- **Test Strategy**: What tests are needed for confidence?
  - [ ] Test 1: [Description]
  - [ ] Test 2: [Description]
  - [ ] Edge case: [Description]
- **File Changes**: What code changes are needed?
  - [ ] File/Component 1: [Description of changes]
  - [ ] File/Component 2: [Description of changes]
- **Planning Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

### STAGE 2: BUILD & ASSESS
- **Implementation Progress**:
  - [ ] Tests written and initially failing
  - [ ] Core functionality implemented
  - [ ] Tests passing
  - [ ] Edge cases handled
- **Quality Validation**:
  - [ ] Unit tests pass (`make test-svc` and `make test-ui`)
  - [ ] Code formatting applied (`make format`)
  - [ ] TypeScript type checking passes (`cd ui && npm run type-check`)
  - [ ] Python linting passes (`cd svc && uv run ruff check .`)
- **Build & Assess Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

### STAGE 3: REFLECT & ADAPT
- **Process Assessment**:
  - What went well in this iteration?
  - What friction was encountered?
  - How can the process be improved?
- **Future Task Assessment**:
  - Do remaining tasks need adjustment based on this implementation?
  - Are new tasks needed?
  - Should task order be rearranged?
- **Template/Process Updates**: [Any changes to make to templates or workflow]
- **Reflect & Adapt Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

### STAGE 4: COMMIT & PICK NEXT
- **Commit Details**:
  - **Message**: [Conventional commit message]
  - **Branch**: [Branch name if new]
  - **Files Changed**: [List of modified files]
- **Next Task Selection**: [Which given-when-then task to work on next]
- **Commit & Pick Next Status**: ❌ Not Started / 🔄 In Progress / ✅ Complete

---

## Instructions for Use

1. **Story Setup**: When starting this work item, fill in all story details and acceptance criteria
2. **Task Iteration**: For each task, update the "Current Task Focus" section with detailed tracking
3. **Task Completion**: When a task is completed and committed:
   - Mark the task as ✅ Complete in the acceptance criteria
   - **Delete all details** from the "Current Task Focus" section
   - Update "Current Task Focus" with the next task details
   - This keeps the document current and focused

### Quality Checklist

#### Per Commit (Required)
- [ ] Unit tests pass (`make test-svc` and `make test-ui`)
- [ ] Code formatting applied (`make format`)
- [ ] TypeScript type checking passes (`cd ui && npm run type-check`)
- [ ] Python linting passes (`cd svc && uv run ruff check .`)
- Remember the quality protocol regarding skipping, ignoring, and warnings

#### Before Merge (Required)
- [ ] All tests pass (`make test` - includes integration tests)
- [ ] Full test coverage maintained (>=80%)
- [ ] Integration tests validate real system interactions
- [ ] Documentation updated
- [ ] Breaking changes documented