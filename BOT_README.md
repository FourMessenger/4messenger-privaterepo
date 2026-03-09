# 4 Messenger Bot API

## Docker Execution (Recommended for Production)

For better security and isolation, you can run bots inside Docker containers:

### 1. Install Docker

**Windows:**
- Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Start Docker Desktop and wait for it to fully load (whale icon in system tray)

**macOS:**
- Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- Or use Homebrew: `brew install --cask docker`

**Linux:**
```bash
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Build the Docker Image

**Cross-Platform (Recommended):**
```bash
cd server/bot_env
node build.js
```

**Windows (Command Prompt):**
```cmd
cd server\bot_env
build.bat
```

**Linux/macOS (Bash):**
```bash
cd server/bot_env
chmod +x build.sh
./build.sh
```

**Manual:**
```bash
cd server/bot_env
docker build -t 4messenger-bot .
```

### 2. Enable Docker in Config

Edit `server/config.json`:
```json
"bots": {
  "maxMemoryMB": 50,
  "timeoutMs": 10000,
  "docker": {
    "enabled": true,
    "image": "4messenger-bot",
    "memoryLimit": "64m",
    "cpuLimit": "0.5",
    "networkDisabled": false
  }
}
```

### Docker Security Features

| Feature | Description |
|---------|-------------|
| Memory Limit | Default 64MB RAM per execution |
| CPU Limit | Default 0.5 CPU cores |
| Read-only FS | Bot cannot write to filesystem (except /bot_storage) |
| No Privileges | Cannot escalate privileges |
| Non-root User | Runs as `botuser`, not root |
| Auto-cleanup | Container removed after execution |
| Network Control | Can disable network access entirely |

---

Welcome to the 4 Messenger Bot Framework! 
You can write Python scripts directly in your 4 Messenger Settings to create custom interactive bots for your chats.

## Capabilities

- **Read Messages**: Bots trigger whenever someone sends a message in a chat they belong to.
- **Send Messages**: Bots can send messages to the chat using the injected `send_message(chat_id, content)` function.
- **External APIs**: The `requests` module is allowed! Your bots can fetch live data from the internet.

## Security Constraints

To ensure server safety, the Python environment is sandboxed:
- `os.system` and other execution methods are disabled.
- Standard file writing (`open` with write flags) is disabled.
- Only safe standard modules (`math`, `random`, `json`, `datetime`, `re`, `time`) and `requests` are permitted to be imported.

## Getting Started

1. Open **Settings** in 4 Messenger and go to the **Bots** tab.
2. Enter a name (e.g., `WeatherBot`) and paste your Python code.
3. Your bot will automatically be given the `🤖` suffix.
4. Open a direct chat with your bot, or add it to a group.
5. Click **"Start Bot"** (or send `/start`) to trigger it!

## Example Script

```python
import requests

def on_message(message, chat_id, sender_id):
    if message == "/start":
        send_message(chat_id, "Hello! I am a Joke Bot. Type /joke to hear one!")
        
    elif message == "/joke":
        try:
            res = requests.get("https://official-joke-api.appspot.com/random_joke").json()
            send_message(chat_id, f"{res['setup']}\n\n{res['punchline']}")
        except Exception as e:
            send_message(chat_id, f"Error fetching joke: {e}")
            
    else:
        send_message(chat_id, f"Unrecognized command. Type /joke")
```

## API Reference

The environment injects the following tools directly:
- `on_message(message, chat_id, sender_id)`: You MUST define this function. It gets called whenever a user sends a message.
- `send_message(chat_id, text)`: Provided automatically. Use this to post messages into the chat.

### File Operations (Bot Sandbox Storage)
Each bot gets a dedicated, isolated storage directory on the server. You can store data, config files, or user states using these injected functions (the standard `open()` function is blocked for security):

- `create_file(filename: str) -> bool` — Creates a new empty file. If the file already exists, it does nothing and keeps the data.
- `write_file(filename: str, content: str) -> bool` — Completely erases the file and writes the new text content (overwrite).
- `read_file(filename: str) -> str` — Reads the contents of a file as text.
- `add_file(filename: str, content: str) -> bool` — Adds (appends) text to the end of an existing file without erasing old data.
- `delete_file(filename: str) -> bool` — Deletes the specified file.
- `list_files() -> list` — Returns a list of filenames in your bot's storage directory.

**Example usage:**
```python
def on_message(message, chat_id, sender_id):
    if message == "/save":
        write_file("data.txt", "Hello World")
        send_message(chat_id, "File saved!")
    elif message == "/read":
        text = read_file("data.txt")
        send_message(chat_id, f"File says: {text}")
```
