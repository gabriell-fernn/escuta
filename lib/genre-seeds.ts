// Editorial artist groupings for the six requested game categories.
export const GENRES=[{id:'all',label:'Todos'},{id:'pop',label:'Pop'},{id:'hiphop',label:'Hip-hop'},{id:'rock',label:'Rock / Alternativo'},{id:'rnb',label:'R&B'},{id:'country',label:'Country / Folk'},{id:'kpop',label:'K-pop'}];
export const ARTISTS:Record<string,string[]>={
 pop:['Michael Jackson','Madonna','Taylor Swift','Dua Lipa','Lady Gaga','Britney Spears','Ariana Grande','Katy Perry','Bruno Mars','Adele','Ed Sheeran','ABBA','Elton John','Shakira','Cyndi Lauper','George Michael','Justin Bieber','Miley Cyrus','Sabrina Carpenter','Harry Styles','Billie Eilish','Olivia Rodrigo','P!nk','Christina Aguilera'],
 hiphop:['Eminem','Kendrick Lamar','Drake','Kanye West','JAY-Z','2Pac','The Notorious B.I.G.','Snoop Dogg','Nas','50 Cent','Outkast','Nicki Minaj','Cardi B','Travis Scott','J. Cole','Missy Elliott','Lauryn Hill','Wu-Tang Clan','Beastie Boys','Racionais MC\'s','Emicida','Criolo','Tyler, The Creator','A Tribe Called Quest'],
 rock:['Queen','The Beatles','The Rolling Stones','Led Zeppelin','Pink Floyd','Nirvana','Radiohead','Foo Fighters','Coldplay','Linkin Park','Red Hot Chili Peppers','Green Day','Arctic Monkeys','The Killers','Oasis','The Strokes','Muse','Paramore','R.E.M.','U2','Legião Urbana','Charlie Brown Jr.','Guns N\' Roses','The Cure'],
 rnb:['Beyoncé','Rihanna','The Weeknd','SZA','Usher','Alicia Keys','Frank Ocean','Mary J. Blige','Mariah Carey','Whitney Houston','Stevie Wonder','Marvin Gaye','D\'Angelo','Erykah Badu','Destiny\'s Child','TLC','Aaliyah','Boyz II Men','Ne-Yo','Chris Brown','H.E.R.','Summer Walker','Toni Braxton','Maxwell'],
 country:['Johnny Cash','Dolly Parton','Willie Nelson','Shania Twain','Garth Brooks','Carrie Underwood','Luke Combs','Chris Stapleton','Kacey Musgraves','Zach Bryan','John Denver','Bob Dylan','Neil Young','Joni Mitchell','Simon & Garfunkel','Mumford & Sons','The Lumineers','Fleet Foxes','Bon Iver','The Chicks','Kenny Rogers','Blake Shelton','Tim McGraw','Faith Hill'],
 kpop:['BTS','BLACKPINK','TWICE','EXO','Red Velvet','Stray Kids','SEVENTEEN','NCT 127','SHINee','BIGBANG','Girls\' Generation','2NE1','Super Junior','Wonder Girls','TVXQ!','INFINITE','IU','PSY','NewJeans','IVE','LE SSERAFIM','aespa','ITZY','ATEEZ']
};
export function artistPage(genre:string,page:number){const groups=genre==='all'?Object.values(ARTISTS):[ARTISTS[genre]];if(groups.some(g=>!g))return {artists:[],pages:0};const artists=genre==='all'?Array.from({length:24},(_,i)=>groups.map(g=>g[i])).flat():groups[0];const pages=Math.ceil(artists.length/8);const start=(page%pages)*8;return {artists:artists.slice(start,start+8),pages};}

// Broader discovery catalog; popularity is measured by the API, not by these lists.
export const DISCOVERY:Record<string,string[]>={
 pop:['Magdalena Bay','Allie X','Rina Sawayama','Caroline Polachek','Empress Of','Shura','Georgia','Florrie','Laura Mvula','Låpsley','Tei Shi','Christine and the Queens'],
 hiphop:['billy woods','Ka','MIKE','Mavi','Navy Blue','Quelle Chris','Open Mike Eagle','Roc Marciano','Armand Hammer','Little Simz','Danny Brown','Earl Sweatshirt'],
 rock:['Squid','black midi','Black Country, New Road','Protomartyr','Preoccupations','Women','Deerhoof','Ought','Iceage','Shame','Wednesday','Horsegirl'],
 rnb:['Cleo Sol','SAULT','Ravyn Lenae','Yazmin Lacey','duendita','Nao','Kelela','Tirzah','Erika de Casier','Charlotte Day Wilson','JMSN','Jordan Rakei'],
 country:['Nick Drake','Adrianne Lenker','Jessica Pratt','Julie Byrne','Shirley Collins','Vashti Bunyan','Lankum','Hurray for the Riff Raff','Gillian Welch','Sierra Ferrell','Aldous Harding','Lisa O\'Neill'],
 kpop:['Dreamcatcher','Billlie','PURPLE KISS','ONF','ONEUS','OnlyOneOf','CIX','P1Harmony','Rocket Punch','Cherry Bullet','Weki Meki','TRI.BE']
};
