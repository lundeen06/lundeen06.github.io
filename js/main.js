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
  switch (cmd.toLowerCase()) {
    case "help":
      loopLines(help, "color2 margin", 80);
      break;
    case "resume":
      loopLines(resumeText, "color2 margin", 80);
      newTab(resume);
      break;
    case "theme":
      loopLines(theme, "color2 margin", 80);
      // theme_i = (theme_i + 1) % themes.length;
      theme_i = randomInt(0, themes.length - 1, theme_i);
      var nextTheme = themes[theme_i]
      var themeName = changeTheme(nextTheme);
      break;
    case "about":
      loopLines(about, "color2 margin", 80);
      break;
    case "whoami":
      loopLines(whoami, "color2 margin", 80);
      break;
    case "sudo":
      loopLines(sudo, "color2", 80)
      setTimeout(function() {
        window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }, 1000); 
      break;
    case "contact":
      loopLines(contact, "color2 margin", 80);
      break;
    case "credit":
      loopLines(credit, "color2 margin", 80);
      break;
    case "secret":
      liner.classList.add("password");
      pw = true;
      break;
    case "projects":
      loopLines(projects, "color2 margin", 80);
      break;
    case "bookshelf":
      loopLines(bookshelf, "color2 margin", 80);
      break;
    case "writing":
      loopLines(writing, "color2 margin", 80);
      break;
    case "password":
      addLine("<span class=\"inherit\"> Lol! You're joking, right? You\'re gonna have to try harder than that!ðŸ˜‚</span>", "error", 100);
      break;
    case "history":
      addLine("<br>", "", 0);
      loopLines(commands, "color2", 80);
      addLine("<br>", "command", 80 * commands.length + 50);
      break;
    case "email":
      loopLines(emailLines, "color2", 80);
      break;
    case "clear":
      setTimeout(function() {
        terminal.innerHTML = '<a id="before"></a>';
        before = document.getElementById("before");
      }, 1);
      setTimeout(function() {
        loopLines(banner, "", 80);
        textarea.focus();
      }, 100);
      break;
    case "banner":
      loopLines(banner, "", 80);
      break;
    case "advanced":
      loopLines(advanced, "color2", 80);
      break;
    case "bookshelf":
      addLine("opening bookshelf...", "color2", 80);
      newTab(youtube);
      break;
    case "twitter":
      addLine("opening twitter...", "color2", 0);
      newTab(twitter);
      break;
    case "linkedin":
      addLine("opening linkedin...", "color2", 0);
      newTab(linkedin);
      break;
    case "github":
      addLine("opening github...", "color2", 0);
      newTab(github);
      break;
    default:
      loopLines(error, "error", 100);
      break;
  }
}

function newTab(link) {
  setTimeout(function() {
    window.open(link, "_blank");
  }, 500);
}

function addLine(text, style, time) {
  var t = "";
  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) == " " && text.charAt(i + 1) == " ") {
      t += "&nbsp;&nbsp;";
      i++;
    } else {
      t += text.charAt(i);
    }
  }
  setTimeout(function() {
    var next = document.createElement("p");
    next.innerHTML = t;
    next.className = style;

    before.parentNode.insertBefore(next, before);

    window.scrollTo(0, document.body.offsetHeight);
  }, time);
}

function loopLines(name, style, time) {
  name.forEach(function(item, index) {
    addLine(item, style, index * time);
  });
}

function changeTheme(theme) {
  const root = document.querySelector(":root");
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(`--${key}`, value);
  }
  return theme;
}

function getHashText() {
  // Check if the URL contains a hash
  if (window.location.hash) {
      // Remove the '#' character and return the remaining text
      return window.location.hash.substring(1);
  } else {
      // Return an empty string or a custom message if no hash is found
      return null;
  }
}

window.onhashchange = function() {
  hash = getHashText(); // Outputs: part of link following the hash (if applicable)
  console.log(hash);
  displayWriting(hash);
};

function displayWriting(hash) {
  // console.log('display' + hash);
  switch (hash) {
    case 'kubla':
      loopLines(kublaFormatted, "color2 margin", 80);
      break;
    case 'other':
      loopLines(otherFormatted, "color2 margin", 80);
      break;
  }
}

function randomInt(min, max, notEquals = 0) {
  console.log()
  // gets random integer between min and max, inclusive
  n = Math.floor(Math.random() * (max - min + 1) + min)
  if (n != notEquals) {
    console.log(n);
    return n; 
  } else {
    return randomInt(min, max, notEquals);
  }
}