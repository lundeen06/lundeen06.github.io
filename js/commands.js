var curius = "https://curius.app/lundeen-cahilly";
var twitter = "https://www.twitter.com/lundeen06/";
var password = "???";
var linkedin = "https://www.linkedin.com/in/lundeencahilly/";
var github = "https://github.com/lundeen06/";
var themeName = '';

whois = [
  "<br>",
  "hi, i'm lundeen",
  "i study at phillips academy andover",
  "i'm especially interested in extended reality (XR), astrophysics, linguistics, and philosophy",
  "in my free time, i like to read, run, watch movies/films, and build cool things!",
  "<br>"
];

advanced = [
  "<br>",
  '<span class="command">whoami</span>         who are you?',
  '<span class="command">secret</span>         find the password',
  '<span class="command">banner</span>         display the header',
  '<span class="command">history</span>        view command history',
  "<br>"
]

whoami = [
  "<br>",
  "<span class=\"color2\">ʕノ•ᴥ•ʔノ</span>",
  "<br>"
];

emailLines = [
  '<br>',
  'academic related        <a href="mailto:lundeen@stanford.edu">lundeen@stanford.edu</a>...',
  'everything else!        <a href="mailto:lundeen.cahilly@gmail.com">lundeen.cahilly@gmail.com</a>...',
  '</br>'
]

social = [
  "<br>",
  'linkedin       <a href="' + linkedin + '" target="_blank">linkedin/lundeencahilly' + "</a>",
  'twitter        <a href="' + twitter + '" target="_blank">twitter/lundeen06' + '</a>',
  'github         <a href="' + github + '" target="_blank">github/lundeen06' + "</a>",
  'curius         <a href="' + curius + '" target="_blank">curius/lundeen-cahilly' + "</a>",
  "<br>"
];

error = [
  '<br>',
  "<span class=\"inherit\">Command not found. For a list of commands, type <span class=\"command\">'help'</span>.</span>",
  '<br>',
]

sudo = [
  "<br>",
  "Oh no, you're not admin...",
  "<br>",
]

secret = [
  "<br>",
  '<span class="command">sudo</span>           Only use if you\'re admin',
  "<br>"
];

projects = [
  "<br>",
  "work in progress! most of my projects are offline or on github.",
  "<br>"
];

bookshelf = [
  "<br>",
  "<span class='command'>books</span>",
  "   the brothers karamazov                dostoevsky",
  "   neuromancer                           william gibson",
  "   ambiguity machines                    vandana singh",
  "   can't hurt me                         david goggins",
  "   the death of ivan ilyich              tolstoy",
  "<br>",
  "<span class='command'>films</span>",
  "   arrival                               villeneuve",
  "   come and see                          klimov",
  "   apocalypse now                        coppola",
  "   blade runner 2049                     villeneuve",
  "   good will hunting                     van sant",
  "<br>",
  "<span class='command'>short lit works</span>",
  "   return to tipasa                      camus",
  "   digging                               seamus heaney",
  "   kubla khan                            samuel taylor coleridge",
  "   shooting an elephant                  orwell",
  "<br>",
]

writing = [
  "<br>",
  `<a href="#kubla">kubla</a>                ???`,
  `<a href="#other">other</a>                ???`,
  "<br>",
]

help = [
  "<br>",
  '<span class="command">whois</span>          a little about me',
  '<span class="command">projects</span>       view my ongoing and past projects',
  '<span class="command">writing</span>        my essays, short stories, etc.',
  "<span class='command'>bookshelf</span>      some favorite reads!",
  "<span class='command'>social</span>         where you can find me",
  '<span class="command">email</span>          reach out!',
  '<span class="command">clear</span>          clear terminal',
  '<span class="command">theme</span>          change website color scheme',
  '<span class="command">help</span>           (you\'re here)',
  '<span class="command">credit</span>         credits for this website!',
  '<span class="command">advanced</span>       advanced commands (pros only)',
  "<br>",
];

theme = [
  '<br>',
  'theme changed to ' + themeName + '',
  '<br>',
]

credit = [
  '<br>',
  `a special thanks to <a href="https://lindaktong.github.io/" target="_blank">linda tong</a> for the terminal website concept!`,
  '<br>',
];

banner = [
  '<br>',
  " .·´¯`·.　·´¯·.",
  " __|__",
  " |ロ__  ╲  ╲  ╲",
  " |ロ |   ╲  ╲  <span class='link-color'>/&#92;~/&#92;</span>",
  " |ロ |    ╲  ╲<span class='link-color'>(  •ω •)</span>",
  " |ロ |     ╲ <span class='link-color'>⊂        づ</span>",
  " |ロ |      ╲   ╲ <span class='link-color'>つ つ</span>  ╲",
  " |ロ |___    ╲  | ___    ╲|____",
  "    ",
  '<span class="color2">hello world, i\'m </span><span class="link-color">lundeen!</span><span class="color2"> welcome to my interactive web terminal.</span>',
  "<span class=\"color2\">for a list of available commands, type</span> <span class=\"command\">'help'</span><span class=\"color2\">.</span>",
  "<br>",
];
// .·´¯`·.　·´¯·.
// __|__
// ||__  ╲  ╲ ╲
// |ロ |   ╲  ╲    /\~/\
// |ロ |     ╲  ╲(   •ω • )
// |ロ |       ╲ ⊂        づ
// |ロ |         ╲   ╲ つ つ  ╲
// |ロ |___        ╲  | ___    ╲|____