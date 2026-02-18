var curius = "https://curius.app/lundeen-cahilly";
var twitter = "https://www.twitter.com/lundeen06/";
var password = "???";
var linkedin = "https://www.linkedin.com/in/lundeencahilly/";
var github = "https://github.com/lundeen06/";
var resume = "./assets/Lundeen_Cahilly_Resume_oct2025.pdf";
var themeName = '';

about = [
  "<br>",
  "hi, i'm lundeen!",
  "<br>",
  "i'm a student at stanford studying computer science and aerospace engineering",
  "<br>",
  "i'm most passionate about ai, space tech, spacial computing, and design",
  "<br>",
  "when i have free time, you can catch me building satellites in es3, running around", 
  "lake lag, and coding in durand",
  "<br>"
];

advanced = [
  "<br>",
  '<span class="command">theme</span>          change website color scheme',
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
  'personal                <a href="mailto:lundeen.cahilly@gmail.com">lundeen.cahilly@gmail.com</a>...',
  'stanford                <a href="mailto:lundeen@stanford.edu">lcahilly@stanford.edu</a>...',
  '</br>'
]

contact = [
  "<br>",
  'email                   <a href="mailto:lundeen.cahilly@gmail.com">lundeen.cahilly@gmail.com</a>...',
  'linkedin                <a href="' + linkedin + '" target="_blank">linkedin/lundeencahilly' + "</a>",
  'twitter                 <a href="' + twitter + '" target="_blank">twitter/lundeen06' + '</a>',
  'github                  <a href="' + github + '" target="_blank">github/lundeen06' + "</a>",
  'curius                  <a href="' + curius + '" target="_blank">curius/lundeen-cahilly' + "</a>",
  // 'email (stanford)        <a href="mailto:lundeen@stanford.edu">lcahilly@stanford.edu</a>...',
  
  "<br>"
];

error = [
  '<br>',
  `<span class=\"inherit\">Command not found. For a list of commands, type <span class="command clickable" data-cmd="help">help</span>`,
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
  "<br>", // link the phrase "satellite gnc software" to https://github.com/stanford-ssi/samwise-adcs-flight
  `i'm currently finishing up <a href="https://github.com/stanford-ssi/samwise-adcs-flight" target="_blank">satellite gnc software</a> for stanford's SAMWISE satellite, which launches in june 2026!`,
  `super excited for the little guy to finally get off the ground! 🛰️`,
  "<br>",
  `i'm also working on <a href="https://github.com/lundeen06/treesats" target="_blank">autonomous debris detection and avoidance</a> for satellites in space. this started from treehacks,`,
  `and we'll see where it goes 🌲`,
  "<br>"
];

bookshelf = [
  "<br>",
  "<span class='command'>books</span>",
  "   the brothers karamazov                dostoevsky",
  "   ambiguity machines                    vandana singh",
  "   can't hurt me                         david goggins",
  "<br>",
  "<span class='command'>films</span>",
  "   perfect days                          wenders",
  "   good will hunting                     van sant",
  "   at eternity's gate                    schnabel",
  "<br>",
  "<span class='command'>short lit works</span>",
  "   return to tipasa                      camus",
  "   digging                               seamus heaney",
  "   kubla khan                            samuel taylor coleridge",
  "   shooting an elephant                  orwell",
  "<br>",
  "check out my <a href='" + curius + "' target='_blank'>curius/lundeen-cahilly</a> for more!",
  "<br>",
]

writing = [
  "<br>",
  `<a href="#kubla">[filler]</a>                ???`,
  `<a href="#other">[filler]</a>                ???`,
  "<br>",
]

resumeText = [
  "<br>",
  `opening <a href="${resume}" target="_blank">resume</a>...`,
  "<br>",
]

help = [
  "<br>",
  '<span class="command clickable" data-cmd="about">about</span>          a little about me',
  '<span class="command clickable" data-cmd="projects">projects</span>       see my ongoing and past projects',
  '<span class="command clickable" data-cmd="bookshelf">bookshelf</span>      some favorite bits of literature and movies',
  '<span class="command clickable" data-cmd="resume">resume</span>         view my resume',
  '<span class="command clickable" data-cmd="contact">contact</span>        reach out!',
  '<span class="command clickable" data-cmd="help">help</span>           (you\'re here)',
  '<span class="command clickable" data-cmd="clear">clear</span>          clear terminal',
  "<br>",
];

theme = [
  '<br>',
  'theme changed to ' + themeName + '',
  '<br>',
]

credit = [
  '<br>',
  `a special thanks to <a href="https://github.com/lindaktong" target="_blank">linda tong</a> for the terminal website concept`,
  `and <a href='https://www.artstation.com/artwork/DAw5xn' target='_blank'>EiskalterEngel18</a> for the background art!`,
  '<br>',
];

banner = [
  '<br>',
  " .·´¯`·.　·´¯·.",
  " __|__",
  " |ロ__  ╲  ╲  ╲",
  " |ロ |   ╲  ╲  <span class='command'>/&#92;~/&#92;</span>",
  " |ロ |    ╲  ╲<span class='command'>(  •ω •)</span>",
  " |ロ |     ╲ <span class='command'>⊂        づ</span>",
  " |ロ |      ╲   ╲ <span class='command'>つ つ</span>  ╲",
  " |ロ |___    ╲  | ___    ╲|____",
  "<br>",
  '<span class="color2">hello world, i\'m </span><span class="link-color">lundeen!</span><span class="color2"> welcome to my interactive web terminal.</span>',
  `<span class=\"color2\">for a list of available commands, type or click <span class="command clickable" data-cmd="help">help</span>`,
  "<br>",
];

// BANNER WITH TREE!
// banner = [
//   '<br>',
//   "                                           <span class='link-color'>ccee88oo</span>                    ",
//   "                                       <span class='link-color'>C8O8O8Q8PoOb o8oo</span>  ",
//   "                                     <span class='link-color'>dOB69QO8PdUOpugoO9bD</span>",
//   " .·´¯`·.　·´¯·.                     <span class='link-color'>CgggbU8OU qOp qOdoUOdcb</span>",
//   " __|__                                  <span class='link-color'>6OuU  </span>/<span class='link-color'>p u gcoUodpP</span>",
//   " |ロ__  ╲  ╲  ╲                           &#92;&#92;&#92;//  /<span class='link-color'>douUP</span>",
//   " |ロ |   ╲  ╲  <span class='command'>/&#92;~/&#92;</span>                        &#92;&#92;&#92;////",
//   " |ロ |    ╲  ╲<span class='command'>(  •ω •)</span>                       |||/&#92;",
//   " |ロ |     ╲ <span class='command'>⊂        づ</span>                      |||&#92;/    ",
//   " |ロ |      ╲   ╲ <span class='command'>つ つ</span>  ╲                    |||||",
//   " |ロ |___    ╲  | ___    ╲|_________________//||||&#92;____________",
//   '<br>',
//   '<span class="color2">hello world, i\'m </span><span class="link-color">lundeen!</span><span class="color2"> welcome to my interactive web terminal.</span>',
//   "<span class=\"color2\">for a list of available commands, type</span> <span class=\"command\">'help'</span><span class=\"color2\">.</span>",
//   "<br>",
// ]



// '<br>',
// " .·´¯`·.　·´¯·.",
// " __|__",
// " |ロ__  ╲  ╲  ╲",
// " |ロ |   ╲  ╲  <span class='link-color'>/&#92;~/&#92;</span>",
// " |ロ |    ╲  ╲<span class='link-color'>(  •ω •)</span>",
// " |ロ |     ╲ <span class='link-color'>⊂        づ</span>",
// " |ロ |      ╲   ╲ <span class='link-color'>つ つ</span>  ╲",
// " |ロ |___    ╲  | ___    ╲|____",
// "<br>",

// .·´¯`·.　·´¯·.
// __|__
// ||__  ╲  ╲ ╲
// |ロ |   ╲  ╲    /\~/\
// |ロ |     ╲  ╲(   •ω • )
// |ロ |       ╲ ⊂        づ
// |ロ |         ╲   ╲ つ つ  ╲
// |ロ |___        ╲  | ___    ╲|____

// +++

//       ccee88oo
//   C8O8O8Q8PoOb o8oo
//  dOB69QO8PdUOpugoO9bD
// CgggbU8OU qOp qOdoUOdcb
//     6OuU  /p u gcoUodpP
//       \\\//  /douUP
//         \\\////
//          |||/\
//          |||\/
//          |||||
//    .....//||||\....

//                                            ccee88oo                    
//                                        C8O8O8Q8PoOb o8oo  
//                                      dOB69QO8PdUOpugoO9bD
// .·´¯`·.　·´¯·.                      CgggbU8OU qOp qOdoUOdcb
// __|__                                  6OuU  /p u gcoUodpP
// ||__  ╲  ╲ ╲                              \\\//  /douUP
// |ロ |   ╲  ╲    /\~/\                       \\\////
// |ロ |     ╲  ╲(   •ω • )                     |||/\
// |ロ |       ╲ ⊂        づ                    |||\/    
// |ロ |         ╲   ╲ つ つ  ╲                 |||||
// |ロ |___        ╲  | ___    ╲|_____________//||||\____________
