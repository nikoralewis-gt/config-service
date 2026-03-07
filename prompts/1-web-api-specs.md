# Config Service – Simple Specification

> This document contains details necessary to create a prompt, which will later be used to create an implementation plan for a REST Web API. Please review the contents of this file and recommend a PROMPT that can be sent to an AI coding assistant for help with creating an implementation plan for this service. 
> 
> The prompt should:
> - ask the assistant to create a comprehensive plan that includes dependencies, file/folder structure, and architectural patterns.
> - recommend strict adherence to ALL of the details in this document.
> - strongly encourage the assistant to not add any additional dependencies without approval.
> - encourage the assistant to ask for more information if they need it.

I want a small backend service that stores a list of applications.  
Each application should have configuration settings made up of name/value pairs.

The service should let me:
- add, update, delete, and list applications  
- add, update, delete, and list configuration settings for each application  

Use Python and FastAPI to build the service.  
Use SQLite as the database.  
Include automated tests.  
Keep the code simple, clean, and well‑structured.
