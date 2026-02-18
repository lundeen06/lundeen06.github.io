var before = document.getElementById("before");
var liner = document.getElementById("liner");
var command = document.getElementById("typer"); 
var textarea = document.getElementById("texter"); 
var terminal = document.getElementById("terminal");
var password = "???";
// var theme_i = randomInt(0, themes.length - 1);
var theme_i = 1;
var themeName = changeTheme(themes[theme_i]);

var git = 0;
var pw = false;
let pwd = false;
var commands = [];

setTimeout(function() {
  loopLines(banner, "", 80);
  textarea.focus();
}, 100);

window.addEventListener("keyup", enterKey);

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('clickable')) {
    const cmd = e.target.getAttribute('data-cmd');
    const typer = document.getElementById('typer');
    const texter = document.getElementById('texter');
    
    // Set the command text
    typer.innerHTML = cmd;
    texter.value = cmd;
    
    // Execute the command
    commands.push(cmd);
    git = commands.length;
    addLine("guest@lundeenterminal:~$ " + cmd, "no-animation", 0);
    commander(cmd.toLowerCase());
    
    // Clear the input
    typer.innerHTML = "";
    texter.value = "";
    
    // Focus the textarea
    texter.focus();
  }
});

console.log(
  "%cYou hacked my password!ðŸ˜ ",
  "color: #04ff00; font-weight: bold; font-size: 24px;"
);
console.log("%cPassword: '" + password + "' - I wonder what it does?ðŸ¤”", "color: grey");

//init
textarea.value = "";
command.innerHTML = textarea.value;

function enterKey(e) {
  if (e.keyCode == 181) {
    document.location.reload(true);
  }
  if (pw) {
    let et = "*";
    let w = textarea.value.length;
    command.innerHTML = et.repeat(w);
    if (textarea.value === password) {
      pwd = true;
    }
    if (pwd && e.keyCode == 13) {
      loopLines(secret, "color2 margin", 120);
      command.innerHTML = "";
      textarea.value = "";
      pwd = false;
      pw = false;
      liner.classList.remove("password");
    } else if (e.keyCode == 13) {
      addLine("Wrong password", "error", 0);
      command.innerHTML = "";
      textarea.value = "";
      pw = false;
      liner.classList.remove("password");
    }
  } else {
    if (e.keyCode == 13) {
      commands.push(command.innerHTML);
      git = commands.length;
      addLine("guest@lundeenterminal:~$ " + command.innerHTML, "no-animation", 0);
      commander(command.innerHTML.toLowerCase());
      command.innerHTML = "";
      textarea.value = "";
    }
    if (e.keyCode == 38 && git != 0) {
      git -= 1;
      textarea.value = commands[git];
      command.innerHTML = textarea.value;
    }
    if (e.keyCode == 40 && git != commands.length) {
      git += 1;
      if (commands[git] === undefined) {
        textarea.value = "";
      } else {
        textarea.value = commands[git];
      }
      command.innerHTML = textarea.value;
    }
  }
}

function commander(cmd) {
  const commands = {
    help: () => loopLines(help, "color2 margin", 80),
    ls: () => loopLines(help, "color2 margin", 80),
    resume: () => {
      loopLines(resumeText, "color2 margin", 80);
      newTab(resume);
    },
    theme: () => {
      loopLines(theme, "color2 margin", 80);
      theme_i = randomInt(0, themes.length - 1, theme_i);
      changeTheme(themes[theme_i]);
    },
    about: () => loopLines(about, "color2 margin", 80),
    whoami: () => loopLines(whoami, "color2 margin", 80),
    sudo: () => {
      loopLines(sudo, "color2", 80);
      setTimeout(() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 1000);
    },
    contact: () => loopLines(contact, "color2 margin", 80),
    credit: () => loopLines(credit, "color2 margin", 80),
    secret: () => {
      liner.classList.add("password");
      pw = true;
    },
    projects: () => loopLines(projects, "color2 margin", 80),
    bookshelf: () => loopLines(bookshelf, "color2 margin", 80),
    writing: () => loopLines(writing, "color2 margin", 80),
    password: () => addLine("<span class=\"inherit\"> Lol! You're joking, right? You\'re gonna have to try harder than that!ðŸ˜‚</span>", "error", 100),
    history: () => {
      addLine("<br>", "", 0);
      loopLines(commands, "color2", 80);
      addLine("<br>", "command", 80 * commands.length + 50);
    },
    email: () => loopLines(emailLines, "color2", 80),
    clear: () => {
      setTimeout(() => {
        terminal.innerHTML = '<a id="before"></a>';
        before = document.getElementById("before");
      }, 1);
      setTimeout(() => {
        loopLines(banner, "", 80);
        textarea.focus();
      }, 100);
    },
    banner: () => loopLines(banner, "", 80),
    advanced: () => loopLines(advanced, "color2", 80),
    twitter: () => {
      addLine("opening twitter...", "color2", 0);
      newTab(twitter);
    },
    linkedin: () => {
      addLine("opening linkedin...", "color2", 0);
      newTab(linkedin);
    },
    github: () => {
      addLine("opening github...", "color2", 0);
      newTab(github);
    }
  };

  (commands[cmd.toLowerCase()] || (() => loopLines(error, "error", 100)))();
}

function newTab(link) {
  setTimeout(() => window.open(link, "_blank"), 500);
}

function addLine(text, style, time) {
  const t = text.replace(/  /g, "&nbsp;&nbsp;");
  setTimeout(() => {
    const next = document.createElement("p");
    next.innerHTML = t;
    next.className = style;
    before.parentNode.insertBefore(next, before);
    window.scrollTo(0, document.body.offsetHeight);
  }, time);
}

function loopLines(name, style, time) {
  name.forEach((item, index) => addLine(item, style, index * time));
}

function changeTheme(theme) {
  Object.entries(theme).forEach(([key, value]) => 
    document.querySelector(":root").style.setProperty(`--${key}`, value)
  );
}

function getHashText() {
  return window.location.hash ? window.location.hash.substring(1) : null;
}

window.onhashchange = () => {
  const hash = getHashText();
  console.log(hash);
  displayWriting(hash);
};

function displayWriting(hash) {
  const writings = {
    kubla: () => loopLines(kublaFormatted, "color2 margin", 80),
    other: () => loopLines(otherFormatted, "color2 margin", 80)
  };
  writings[hash]?.();
}

function randomInt(min, max, notEquals = 0) {
  const n = Math.floor(Math.random() * (max - min + 1) + min);
  return n !== notEquals ? n : randomInt(min, max, notEquals);
}