# Terminal-Style Personal Website 🖥️

A minimalist, interactive terminal-themed personal portfolio built with vanilla JavaScript. Navigate through my professional journey using familiar command-line inputs.

## ✨ Concept Preview
```
guest@lundeenterminal:~$ help

about          a little about me
resume         view my resume
projects       ongoing and past projects
contact        reach out!
bookshelf      some favorite bits of literature and movies
help           (you're here)
clear          clear terminal
```

## 🎨 Available Themes

| Theme Name | Description | Primary Colors |
|------------|-------------|----------------|
| Modern Ink | Clean monochrome | Black on white, red accents |
| Retro | Classic terminal | Neon green on black |
| Rose Pine Moon | Elegant purple | Purple and pink pastels |
| Blue Dolphin | Ocean-inspired | Deep blue with cyan |

## 🏗️ Architecture

```mermaid
flowchart TD
    A[index.html] --> B[style.css]
    A --> C[JavaScript Modules]
    
    subgraph C[JavaScript Modules]
        D[main.js] --> E[commands.js]
        D --> F[theme.js]
        D --> G[caret.js]
        D --> H[writing.js]
    end
    
    B --> I[Theme Variables]
    B --> J[Animations]
    
    E --> K[Command Responses]
    F --> L[Theme Definitions]
    G --> M[Cursor Behavior]
    H --> N[Writing Content]
```

## 🔍 Core Features

```mermaid
graph LR
    A[User Input] --> B[Command Parser]
    B --> C{Command Type}
    C -->|Navigation| D[Content Display]
    C -->|Theme| E[Theme Switcher]
    C -->|System| F[Terminal Actions]
    
    D --> G[Typing Animation]
    E --> H[CSS Variable Update]
    F --> I[Clear/History/etc]
```

## 🚀 Command Flow

```mermaid
sequenceDiagram
    participant U as User
    participant I as Input Handler
    participant C as Command Processor
    participant D as Display

    U->>I: Enter Command
    I->>C: Parse Command
    C->>C: Process Command
    C->>D: Update Display
    D->>U: Show Response
```

## 🛠️ Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/terminal-website.git
```

2. Open `index.html` in your browser
3. Start typing commands!

## 📈 Performance Considerations

| Feature | Implementation | Impact |
|---------|---------------|---------|
| Typing Animation | CSS Transitions | Smooth visuals |
| Theme Switching | CSS Variables | Instant updates |
| Command History | Array Buffer | Memory efficient |
| Content Loading | Dynamic Import | Fast initial load |

## 🎯 Future Roadmap

```mermaid
gantt
    title Development Roadmap
    dateFormat  YYYY-MM-DD
    section Features
    Tab Completion            :a1, 2024-11-01, 30d
    Command Aliases          :a2, after a1, 45d
    Mobile Optimization      :a3, after a2, 30d
    Theme Expansion         :a4, 2024-11-15, 60d
```

## 🙏 Credits

- Background art by [EiskalterEngel18](https://www.artstation.com/artwork/DAw5xn)
- Terminal concept inspired by [Linda Tong](https://github.com/lindaktong)

## 📄 License

MIT License - feel free to use and modify for your own portfolio!
