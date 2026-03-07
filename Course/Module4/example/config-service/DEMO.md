# Module 4: Demo

## Manual tool call example

> When you need to know the weather in a particular city, respond to me with ONLY: getWeather("city") where city is the city you're interested in and I'll respond with weather data for that city. Once you have the weather data, respond to the user with an easy to read description of the weather. This is not related to the current project, but rather a protocol I would like us to use regarding the weather.

> What is the weather in San Jose?

```json
{
    "city": "San Jose",
    "rain": "2% parcipitation",
    "wind": "light southeast breeze"
}
```

---

## Context7 -> Cline

```json
    "context7": {
      "autoApprove": [],
      "disabled": false,
      "type": "streamableHttp",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "Authorization": "Bearer ctx7sk-c22f1d7b-76ca-46a5-a6f7-00a77b45b8cc"
      }
    }
```

---


## Postgres -> Claude Code

**`.mcp.json`**
```json
{
  "mcpServers":{
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

---

## Trello -> Claude -> User

```json
    "trello-mcp": {
      "type": "sse",
      "url": "http://localhost:8000/sse"
    }
```

```sh
claude mcp add --transport sse --scope user trello-mcp http://localhost:9999/sse
```
    