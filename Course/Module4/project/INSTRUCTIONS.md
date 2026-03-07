# Module 4: Using Model Context Protocol Servers

> Terminology note: This doc uses "MCP" to refer to the protocol itself, AND also servers that implement the Model Context Protocol. This intentionally prioritises readability over precision.

## Table of Contents
- Learning objectives
- Installation Options
- Exercise 1: Up-to-date Documentation
- Exercise 2: Database and/or Cloud tools
- Exercise 3: Read/write 3rd Party Service

## Learning objectives
- How to setup an existing local MCP
- How to configure a client to use an MCP
- How to choose an appropriate setup for a specific scenario

## Installation Options
As we covered in the discussion, we have local and remote options for where and how the MCP runs. However, when it comes to configuring the client to use a server, the process is (currently) still largely specific to the client. For example, configuring Cline and Claude is different. We'll cover both here, but if you're using a different client, be sure to read its docs on how to configure it to use MCPs.

**Cline**

Cline can use both local and remote MCPs. When you install from its Marketplace, it will invoke the selected LLM for help downloading and installing dependencies, and configuring it to run the MCP locally, on the metal. 

Remote MCPs are configured with a URL. By default, it will use the `sse` (server-sent events) transport, which has been deprecated from the spec. If you want to use streamable HTTP, select the "Configure MCP Server" button, and add a `type` property with a value of `streamableHttp`. You can find examples in the exercises below.

Cline's MCP configuration applies to all instances of Cline, regardless of the project, but they are easy to toggle between enabled/disabled.

**Claude Code**

Claude Code can configure MCPs to be specific to a project, or global (available to all projects for that user). The recommended way to install MCPs is to use the `claude mcp` command and there are a few installation options. See `claude mcp help` or [the docs](https://docs.claude.com/en/docs/claude-code/mcp#installing-mcp-servers) for more details.
- `local` (default) saves your MCP config in `~/.claude.json`, but annotates it for only the active project
- `user` also saves the config in `~/.claude.json`, but will be available to all projects
- `project` saves the config in `.mcp.json` at the project's root

## Exercise 1: Up-to-date Documentation
There are a number of different services that provide the latest documentation, but the most popular choice (for good reason) is [Context7](https://context7.com). Fortunately, Context7 is in the Marketplace for most clients.

1. Create an account at [Context7](https://context7.com). This provides you an API key.
2. Setup a Context7 MCP server using the official remote endpoint.
    
    Claude Code example:

    ```json
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "ctx7sk-c22f1d7b-76ca-46a5-a6f7-00a77b45b8cc"
      }
    }
    ```

    Cline example:

    ```json
    "context7": {
      "type": "streamableHttp",
      "url": "https://mcp.context7.com/mcp",
      "autoApprove": [],
      "disabled": false
    }
    ```

3. Within your IDE/terminal, create a new session with your coding assistant.
4. Issue a few different prompts with varying levels of specificity to experience how the client/MCP behaves.
   - "Using the latest Context7 documentation, recommend changes to the test files in @src/tests/integration"
   - "Please check @some/file/path.ts for compliance with the latest documentation" (didn't mention context7)

## Exercise 2: Database and/or Cloud tools
You have a lot of flexibility with this one. Considering the platform of your application, what tools would be helpful to engage with during development? For example,
- specific details of the database schema
- the contents of a specific data store
- if a cloud service is healthy

Part of this exercise is understanding what is available. It's pretty easy to find lists of MCP servers online. For example,
- [Official reference servers](https://github.com/modelcontextprotocol/servers?tab=readme-ov-file#-reference-servers) (scroll down for _many_ more unofficial ones)
- https://mcpservers.org
- https://mcpmarket.com

**Option 1: Choose your own MCP** 

1. Choose an MCP for the service you want to engage with.
2. Configure your client to use the service. Remote services may require credentials.
3. Establish a new session with your client and verify the server is available and responding.
4. Send a few different prompts to experience what it is both good at and not-so-good at.

**Option 2: Configure the Postgres Pro MCP server** 

After seeing what's available, if you would rather not have to choose, you can use the [Postgres MCP Pro](https://mcpservers.org/servers/crystaldba/postgres-mcp) server. Its installation instructions require either Docker or Python using `uv` or `pipx`. We will use Docker and our example config service project.

0. Ensure the config service database is running. To start it, navigate to the project folder and run `make install` and then `make up`.
1. Pull the image to your local Docker environment: `docker pull crystaldba/postgres-mcp`
2. In the Cline UI, select the "Manage MCP Servers" option (the icon that looks like 3 rack blades).
3. In the MCP screen, select the gears to open the settings.
4. From the MCP Servers screen, select the "Installed" tab, and then the "Configure MCP Servers" button. This will open the configuration file.
5. Add the following to the configuration so the file looks like this (assuming you don't have other MCP servers installed):

    ```json
    {
      "mcpServers": {
        "postgres": {
          "command": "docker",
          "args": [
            "run",
            "-i",
            "--rm",
            "-e",
            "DATABASE_URI",
            "crystaldba/postgres-mcp",
            "--access-mode=restricted"
          ],
          "env": {
            "DATABASE_URI": "postgresql://config_user:config_pass@localhost:5432/config_db"
          }
        }
      }
    }
    ```

    When Cline initialises the server, this config will create a new container from this image and run the entry point so the client will know what capabilities the server supports. On subsequent calls, it will use this container and delete it when the client is closed.

    If you're using Claude Code, you can save the above JSON in a file called `.mcp.json` in the root of the project and Claude Code will apply it.

  6. Send a few different prompts to ensure it's able to read the data in the tables, or tell you there are no records.
  7. Change the `--access-mode` to `unrestricted` to enable queries that can make changes. You may need to create a new client session to apply the changes. Are you able to make changes using a prompt now?

## Exercise 3: Read/write 3rd Party Service
Considering a different aspect of the SDLC, let's configure an MCP that can pull items from our backlog. The assumption is, while we maintain a _little_ context about the work we're actively doing _in_ the repo itself, the majority of our unstarted work is managed using a SaaS product (Jira, Asana, Trello, etc). Perhaps a connection between our shared backlog and our IDE would remove some friction in our process.

**Option 1: Choose your own MCP** 

1. Choose an MCP for the service you want to engage with.
2. Configure your client to use the service. This will likely require credentials and a token.
3. Establish a new session with your client and verify you're able to read backlog items.
4. Send a few different prompts to experience what it is both good at and not-so-good at.

**Option 2: Configure a Trello MCP server** 

In this exercise we're going to install the [Trello MCP Server](https://mcpservers.org/servers/m0xai/trello-mcp-server).

**_Creating the API key_**

0. If you don't already have a Trello account, you first need to [create one](https://trello.com).
1. In order to get API access, you must first create a Power-UP. So head to the [Trello Power-Up Admin Portal] and select the "New" button.
2. Choose a name, select the workspace, fill in the email fields, and the author fields. Ignore the Iframe connector URL and select the "Create" button.
3. On the following screen, select the "Generate a new API key" button and the "Generate API key" button on the resulting screen.
4. Copy the API key and paste it somewhere temporarily safe.
5. In the paragraph to the right of the API key section, select the "Token" link to manually generate one.
6. Select the "Allow" button on the next screen to give the power-up access to your account.
7. On the resulting page, copy the token value and store it along with the key.

**_Provisioning the local Docker server_**

1. Clone the [trello-mcp-server](https://github.com/m0xai/trello-mcp-server) repo.
2. Run `cp .env{.example,}` to create a usable copy of the `.env.example` file.
3. Edit the `.env` file with the key and token you copied in the previous section. Save `.env`.
4. On the terminal in this repo, run `docker compose up --build -d` to run the server.
5. Check the logs to be sure the server has been started.

**_Configuring the client_**

1. The Trello MCP server uses the deprecated SSE transport, so we need to configure it like this:

    ```json
    "trello-mcp": {
      "type": "sse",
      "url": "http://localhost:8000/sse"
    }
    ```

2. Use this to configure the client you wish to use based on how it needs MCP servers configured.

**_Taking it for a spin_**

1. Have a look at the [Trello MCPs capabilities](https://github.com/m0xai/trello-mcp-server?tab=readme-ov-file#capabilities).
2. Ask your assistant to create a new board
3. Ask it to create a few lists (backlog, doing, done)
4. Ask it to create some backlog cards ("update dependencies", "investigate deployment warning")
5. Ask it to move a card from "backlog" to "doing".

Well done! 🎉
