(()=>{'use strict';
const V='10.3.7';
const KEY='ofa-scrapbook-studio-2';
const RECOVERY_KEY=`${KEY}-recovery`;
const DRAFT_INDEX_KEY=`${KEY}-draft-index`;
const ACTIVE_DRAFT_KEY=`${KEY}-active-draft`;
const DRAFT_PREFIX=`${KEY}-draft:`;
const ASSET_DB='ofa-scrapbook-assets';
const ASSET_STORE='photos';
const HISTORY_LIMIT=35;
const SAVE_DELAY=1200;
const MAX_IMAGE_EDGE=2400;
const THEMES={
' Sea Glass':['linear-gradient(135deg,#dff7f4,#a8d8d2 55%,#f6e6c8)','🐚'],
'Mountain Escape':['linear-gradient(#9ecfe3 0 45%,#557b67 46% 70%,#d6c7a0 71%)','🏔️'],
'Lighthouse':['linear-gradient(#b9e4f4 0 58%,#5db0c7 59% 75%,#ead9b5 76%)','⚓'],
'Camping Under the Stars':['radial-gradient(circle at 30% 20%,#fff 0 1px,transparent 2px),linear-gradient(#0e2041,#273c64 60%,#284d39 61%)','⛺'],
'Happy Hour':['linear-gradient(135deg,#ffd6a5,#fdffb6,#caffbf)','🍹'],'Celebration':['radial-gradient(circle,#fff5 0 3px,transparent 4px),linear-gradient(135deg,#ffcad4,#bde0fe)','🎉'],
'Wedding Romance':['linear-gradient(135deg,#fff,#f6dbe4)','💍'],'Pet Memories':['linear-gradient(135deg,#f7ead7,#d8e2dc)','🐾'],'Baby Keepsake':['linear-gradient(135deg,#e9f5ff,#fff1f6)','🍼'],
'Autumn Gathering':['linear-gradient(135deg,#f6bd60,#d97746,#8c5e3c)','🍂'],'Sunset Glow':['linear-gradient(#ff9a76,#f7c873,#6d7aa8)','🌅'],'Winter Wonderland':['linear-gradient(#effaff,#bfd7ea)','❄️'],
'Chalkboard Memories':['linear-gradient(135deg,#263b35,#17241f)','✎'],'Vintage Scroll':['linear-gradient(135deg,#f4e1b7,#cfae78)','📜'],'Watercolor Wash':['linear-gradient(135deg,#cce3de,#eaf4f4,#f6fff8,#f4d6cc)','🎨'],
'Warm Sand':['linear-gradient(135deg,#f3e1c3,#d8b384)','🏖️'],'Soft Paisley':['radial-gradient(ellipse at 20% 20%,#ffffff80 0 12%,transparent 13%),linear-gradient(135deg,#d8c7e8,#f0d8de)','🌸'],
'Christmas 🎄':['linear-gradient(135deg,#174c3c,#b02a37)','🎄'],'Halloween 🎃':['linear-gradient(135deg,#2b193d,#f28c28)','🎃'],'Easter 🐰':['linear-gradient(135deg,#f7d6e0,#d6f7e8,#e6dcf7)','🐰'],'Patriotic 🇺🇸':['linear-gradient(135deg,#b22234 0 33%,#fff 34% 66%,#3c3b6e 67%)','🇺🇸']
};
THEMES['Sea Glass']=THEMES[' Sea Glass'];delete THEMES[' Sea Glass'];
const THEME_META={
 'Sea Glass':['#dff7f4','#8ccbc5','#e8cfa2','sea'],'Mountain Escape':['#d8edf5','#54745e','#a88361','mountain'],
 'Lighthouse':['#d8f1fb','#d44f4f','#3d8eac','lighthouse'],'Camping Under the Stars':['#101d3b','#f5c96a','#254c37','camp'],
 'Happy Hour':['#fff1c9','#df7c65','#79a891','party'],'Celebration':['#fff0f5','#d56f91','#6ea7c8','party'],
 'Wedding Romance':['#fffaf4','#c993a4','#b79a62','floral'],'Pet Memories':['#f6eee2','#8d6e59','#7f9b82','pet'],
 'Baby Keepsake':['#eff7ff','#82acd0','#edb4c4','baby'],'Autumn Gathering':['#f5dfbd','#a95031','#d79535','autumn'],
 'Sunset Glow':['#ffd7b2','#d76767','#6b6599','mountain'],'Winter Wonderland':['#edf8ff','#7ca8c5','#ffffff','winter'],
 'Chalkboard Memories':['#17231f','#f7e6a8','#e884a7','chalk'],'Vintage Scroll':['#f3dfb8','#8b5d3b','#b99058','vintage'],
 'Watercolor Wash':['#fffaf7','#d8879c','#68a7b5','watercolor'],'Warm Sand':['#f2dfb8','#cb9a58','#58a9bd','sea'],
 'Soft Paisley':['#eee5f4','#9a71aa','#d68c9e','paisley'],'Christmas 🎄':['#173d34','#cf4451','#e4c26d','christmas'],
 'Halloween 🎃':['#20142f','#ef8c35','#8c6bb1','halloween'],'Easter 🐰':['#fff5ec','#d89fbe','#8fc9b3','baby'],
 'Patriotic 🇺🇸':['#f8f5ee','#b5283b','#334c83','patriotic']
};
function themeArtLegacy(name){
 const [paper,accent,second,kind]=THEME_META[name]||THEME_META['Sea Glass'];
 const scenes={
  sea:`<path d='M0 510 Q110 450 220 510 T440 510 T660 510 T900 510 V675 H0Z' fill='${second}' opacity='.5'/><path d='M0 555 Q100 515 200 555 T400 555 T600 555 T900 555' fill='none' stroke='${accent}' stroke-width='14' opacity='.65'/><g fill='none' stroke='${accent}' stroke-width='6' opacity='.75'><path d='M72 92 q42-55 84 0 q-42 48-84 0Z'/><path d='M760 570 q55-68 110 0 q-55 58-110 0Z'/></g>`,
  mountain:`<circle cx='740' cy='110' r='58' fill='${second}' opacity='.55'/><path d='M0 535 170 280 310 470 455 220 650 480 760 320 900 520V675H0Z' fill='${accent}' opacity='.7'/><path d='m345 350 110-130 76 110-42-20-34 50-35-48Z' fill='#fff' opacity='.72'/><g fill='${second}' opacity='.8'><path d='m90 560 38-92 38 92Z'/><path d='m700 560 46-112 46 112Z'/></g>`,
  lighthouse:`<path d='M0 505 Q130 470 260 505 T520 505 T780 505 T900 505V675H0Z' fill='${second}' opacity='.62'/><g transform='translate(700 155)'><path d='m45 40 34 315H0L32 40Z' fill='#fffaf1' stroke='${accent}' stroke-width='8'/><path d='M8 228h62v55H4Z' fill='${accent}'/><path d='M20 0h42l17 42H2Z' fill='${accent}'/><rect x='16' y='42' width='50' height='38' rx='5' fill='${second}'/></g><path d='M760 176 900 98M760 190 900 220' stroke='#fff7c2' stroke-width='15' opacity='.45'/>`,
  camp:`<g fill='#fff8cf' opacity='.85'><circle cx='90' cy='90' r='4'/><circle cx='220' cy='145' r='5'/><circle cx='410' cy='70' r='4'/><circle cx='620' cy='125' r='6'/><circle cx='825' cy='72' r='4'/></g><path d='M0 555 140 430 255 555 370 405 500 555 650 420 790 555 900 455V675H0Z' fill='${second}'/><g transform='translate(350 385)'><path d='m0 170 105-170 105 170Z' fill='${accent}'/><path d='m105 0 20 170H85Z' fill='#fff0c2'/></g>`,
  party:`<path d='M35 80 Q450 205 865 80' fill='none' stroke='${accent}' stroke-width='5'/><g fill='${second}'><path d='m85 95 45 75 35-56Z'/><path d='m250 126 46 75 38-58Z'/><path d='m430 139 48 76 37-64Z'/><path d='m620 125 44 75 40-61Z'/><path d='m790 95 42 72 36-58Z'/></g><g fill='none' stroke='${accent}' stroke-width='10' opacity='.7'><circle cx='115' cy='555' r='55'/><circle cx='780' cy='535' r='70'/></g><g fill='${accent}' opacity='.6'><circle cx='210' cy='280' r='9'/><rect x='570' y='275' width='16' height='42' transform='rotate(28 578 296)'/><circle cx='680' cy='370' r='10'/></g>`,
  floral:`<path d='M65 610 Q150 420 290 505M835 65Q710 245 600 135' fill='none' stroke='${second}' stroke-width='12'/><g fill='${accent}' opacity='.7'><circle cx='80' cy='590' r='42'/><circle cx='145' cy='530' r='34'/><circle cx='218' cy='510' r='46'/><circle cx='815' cy='78' r='42'/><circle cx='748' cy='122' r='35'/><circle cx='675' cy='145' r='45'/></g><rect x='48' y='42' width='804' height='590' rx='36' fill='none' stroke='${second}' stroke-width='6' stroke-dasharray='18 12'/>`,
  pet:`<g fill='${accent}' opacity='.18'><circle cx='115' cy='120' r='24'/><circle cx='82' cy='82' r='12'/><circle cx='112' cy='70' r='12'/><circle cx='142' cy='82' r='12'/><circle cx='760' cy='535' r='34'/><circle cx='720' cy='490' r='16'/><circle cx='760' cy='475' r='16'/><circle cx='800' cy='490' r='16'/></g><path d='M40 610 Q250 565 430 620 T860 595' fill='none' stroke='${second}' stroke-width='18' stroke-linecap='round'/><path d='M100 585h105M123 555h60' stroke='${accent}' stroke-width='18' stroke-linecap='round'/>`,
  baby:`<g fill='#fff' opacity='.8'><ellipse cx='150' cy='135' rx='95' ry='38'/><ellipse cx='710' cy='170' rx='120' ry='45'/></g><path d='M35 80 Q450 175 865 80' fill='none' stroke='${accent}' stroke-width='5'/><g fill='${second}' opacity='.7'><circle cx='120' cy='110' r='22'/><rect x='270' y='115' width='38' height='38' transform='rotate(18 289 134)'/><circle cx='455' cy='137' r='23'/><rect x='640' y='110' width='40' height='40' transform='rotate(-16 660 130)'/></g><path d='M0 590Q150 535 300 590T600 590T900 590V675H0Z' fill='${accent}' opacity='.3'/>`,
  autumn:`<path d='M40 40Q210 170 260 360M860 635Q700 505 650 320' fill='none' stroke='#765038' stroke-width='18'/><g fill='${accent}' opacity='.8'><ellipse cx='135' cy='125' rx='34' ry='18' transform='rotate(35 135 125)'/><ellipse cx='215' cy='235' rx='38' ry='20' transform='rotate(-20 215 235)'/><ellipse cx='745' cy='455' rx='42' ry='22' transform='rotate(30 745 455)'/><ellipse cx='810' cy='545' rx='35' ry='19' transform='rotate(-28 810 545)'/></g><g fill='${second}' opacity='.7'><ellipse cx='185' cy='170' rx='30' ry='17'/><ellipse cx='700' cy='395' rx='34' ry='18'/></g>`,
  winter:`<path d='M0 530Q140 455 280 530T560 530T900 520V675H0Z' fill='#fff' opacity='.9'/><g fill='none' stroke='${accent}' stroke-width='5' opacity='.6'><path d='m110 90v70m-30-52 60 35m0-35-60 35'/><path d='m760 120v90m-40-67 80 45m0-45-80 45'/></g><g fill='${second}' opacity='.6'><path d='m280 570 55-145 55 145Z'/><path d='m540 575 70-190 70 190Z'/></g>`,
  chalk:`<rect x='30' y='30' width='840' height='615' rx='22' fill='none' stroke='${accent}' stroke-width='7' stroke-dasharray='22 12'/><g fill='none' stroke='${second}' stroke-width='8' opacity='.75'><path d='m80 120 35-35 35 35 35-35'/><path d='M710 545q55-80 110 0q-55 55-110 0Z'/><circle cx='180' cy='520' r='55'/></g><g fill='${accent}' opacity='.7'><circle cx='390' cy='85' r='7'/><circle cx='520' cy='590' r='9'/></g>`,
  vintage:`<rect x='32' y='32' width='836' height='611' rx='24' fill='none' stroke='${accent}' stroke-width='7'/><rect x='52' y='52' width='796' height='571' rx='18' fill='none' stroke='${second}' stroke-width='3'/><g fill='none' stroke='${accent}' stroke-width='8'><path d='M45 170Q45 45 170 45M730 45Q855 45 855 170M45 505Q45 630 170 630M730 630Q855 630 855 505'/></g><path d='M260 78Q450 125 640 78M260 597Q450 550 640 597' fill='none' stroke='${second}' stroke-width='8'/>`,
  watercolor:`<g opacity='.35'><ellipse cx='135' cy='145' rx='180' ry='125' fill='${accent}'/><ellipse cx='760' cy='170' rx='175' ry='140' fill='${second}'/><ellipse cx='500' cy='565' rx='260' ry='115' fill='#e7b65f'/><path d='M40 400Q260 320 470 410T860 390' fill='none' stroke='${accent}' stroke-width='55' stroke-linecap='round'/></g>`,
  paisley:`<g fill='none' stroke='${accent}' stroke-width='12' opacity='.55'><path d='M100 180c120-150 200 60 70 115-80 34-110-40-70-115Z'/><path d='M660 480c140-170 225 70 75 130-95 35-125-50-75-130Z'/></g><g fill='${second}' opacity='.35'><circle cx='150' cy='230' r='24'/><circle cx='710' cy='545' r='32'/></g>`,
  christmas:`<path d='M40 75Q450 160 860 75' fill='none' stroke='${second}' stroke-width='12'/><g fill='${accent}'><circle cx='150' cy='100' r='14'/><circle cx='310' cy='125' r='14'/><circle cx='480' cy='128' r='14'/><circle cx='650' cy='112' r='14'/></g><g fill='${second}' opacity='.8'><path d='m95 590 80-190 80 190Z'/><path d='m690 590 65-160 65 160Z'/></g><g fill='${accent}'><rect x='360' y='530' width='100' height='75'/><rect x='475' y='505' width='125' height='100'/></g>`,
  halloween:`<path d='M35 35Q220 80 300 240M865 35Q680 80 600 240' fill='none' stroke='${second}' stroke-width='5'/><g fill='${accent}' opacity='.85'><ellipse cx='120' cy='555' rx='70' ry='58'/><ellipse cx='780' cy='545' rx='82' ry='68'/></g><g fill='#111' opacity='.75'><path d='m350 110 35 20 35-20-20 34 20 28-35-14-35 14 20-28Z'/><path d='m520 180 30 18 30-18-16 30 16 25-30-12-30 12 17-25Z'/></g>`,
  patriotic:`<path d='M25 70Q450 180 875 70' fill='none' stroke='${accent}' stroke-width='8'/><g fill='${second}'><path d='m70 88 55 90 45-69Z'/><path d='m260 125 55 90 45-72Z'/><path d='m455 135 55 90 45-74Z'/><path d='m650 115 55 90 45-75Z'/></g><g fill='${accent}' opacity='.55'><path d='m120 500 12 25 28 4-20 20 5 29-25-14-26 14 6-29-21-20 29-4Z'/><path d='m770 470 14 30 32 5-23 22 6 33-29-16-29 16 6-33-23-22 32-5Z'/></g><path d='M0 610h900' stroke='${accent}' stroke-width='45'/><path d='M0 650h900' stroke='${second}' stroke-width='45'/>`
 };
 const scene=scenes[kind]||scenes.watercolor;
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 675'><defs><linearGradient id='paper' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${paper}'/><stop offset='1' stop-color='${second}' stop-opacity='.3'/></linearGradient><pattern id='grain' width='18' height='18' patternUnits='userSpaceOnUse'><circle cx='3' cy='4' r='1.2' fill='${accent}' opacity='.12'/></pattern></defs><rect width='900' height='675' fill='url(#paper)'/><rect width='900' height='675' fill='url(#grain)'/>${scene}<rect x='18' y='18' width='864' height='639' rx='24' fill='none' stroke='#fff' stroke-width='5' opacity='.65'/><rect x='30' y='30' width='840' height='615' rx='18' fill='none' stroke='${accent}' stroke-width='2' opacity='.45'/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const PRO_THEME_META={
 'Sea Glass':['#e9e5dc','#4b817d','#b79b6a','#f8f6f0','sea'],'Mountain Escape':['#d8d1c3','#40594a','#976f4c','#f1ede4','mountain'],
 'Lighthouse':['#e8e2d6','#244d62','#b5473e','#f7f3ea','lighthouse'],'Camping Under the Stars':['#121c2c','#b98a49','#314636','#e2d3b6','camp'],
 'Happy Hour':['#1d3130','#b88a47','#7a3042','#efe0ca','happyhour'],'Celebration':['#eee8df','#a85c70','#3f6971','#faf8f2','celebration'],
 'Wedding Romance':['#eee9df','#a98b58','#7d705f','#fffdf8','wedding'],'Pet Memories':['#d7c3a5','#5d4939','#71806b','#f4eadb','pet'],
 'Baby Keepsake':['#eee6d8','#829aaa','#c89ca1','#fbf7ef','baby'],'Autumn Gathering':['#d7bea0','#7e3f2d','#a87438','#f0e4d2','autumn'],
 'Sunset Glow':['#2f2940','#d86f45','#e5ad5a','#f6d1a3','sunset'],'Winter Wonderland':['#263d55','#8eb1c2','#c9d6de','#f1f5f5','winter'],
 'Chalkboard Memories':['#17201f','#e4d7b9','#b9806a','#f0ead9','chalk'],'Vintage Scroll':['#cdbb99','#6d4b36','#9b7d53','#eee1c8','vintage'],
 'Watercolor Wash':['#e8e2dd','#7e9da1','#b67a89','#faf7f2','watercolor'],'Warm Sand':['#dfcfb5','#4c8391','#b8884f','#f5ead7','sand'],
 'Soft Paisley':['#ded6df','#725f7e','#a87c82','#f7f1f3','paisley'],'Christmas 🎄':['#18392f','#b7a05b','#8d2935','#eee7d6','christmas'],
 'Halloween 🎃':['#201b27','#b65f2d','#725978','#e2d0b4','halloween'],'Easter 🐰':['#eee5d8','#a07d9a','#789b8c','#faf5eb','easter'],
 'Patriotic 🇺🇸':['#e6dfd2','#883542','#354c6b','#faf7ef','patriotic']
};
function themeArt(name){
 const [paper,accent,second,mat,kind]=PRO_THEME_META[name]||PRO_THEME_META['Sea Glass'];
 const scenes={
  sea:`<path d='M0 570c120-38 225 30 350-4s230 25 355-8 195 4 195 4v113H0Z' fill='${accent}' opacity='.35'/><g fill='none' stroke='${accent}' stroke-width='5'><path d='M74 122c35-55 96-43 112 5-33-16-75-5-112-5Z'/><path d='M735 548c30-54 92-48 111-2-38-13-72-8-111 2Z'/></g><g fill='${second}' opacity='.55'><circle cx='116' cy='155' r='7'/><circle cx='142' cy='146' r='5'/><circle cx='786' cy='575' r='8'/></g>`,
  mountain:`<path d='M0 590 118 455l78 75 126-176 122 147 118-210 144 188 76-78 138 166v108H0Z' fill='${accent}' opacity='.48'/><path d='m487 394 75-103 50 66-28-12-22 31-24-32Z' fill='${mat}' opacity='.9'/><rect x='48' y='70' width='190' height='55' rx='4' fill='${second}' opacity='.35'/><path d='M65 98h155' stroke='${mat}' stroke-width='3' stroke-dasharray='7 7'/>`,
  lighthouse:`<path d='M0 570c160-45 290 40 445-2s290 34 455-6v113H0Z' fill='${accent}' opacity='.4'/><g transform='translate(748 180)' fill='none' stroke='${second}' stroke-width='8'><path d='m25 50 55 0 26 310H0Z' fill='${mat}'/><path d='M4 245h98M10 176h86M18 106h70'/><path d='M15 50 30 9h44l20 41Z'/><rect x='24' y='52' width='62' height='48' fill='${accent}'/></g><path d='M765 210 590 145M840 210 900 170' stroke='${second}' stroke-width='12' opacity='.28'/>`,
  camp:`<g fill='${mat}' opacity='.8'><circle cx='110' cy='92' r='3'/><circle cx='230' cy='140' r='4'/><circle cx='410' cy='75' r='3'/><circle cx='615' cy='122' r='4'/><circle cx='790' cy='80' r='3'/></g><path d='M0 585 155 420l110 125 120-170 140 162 142-195 145 198 88-112v247H0Z' fill='${accent}' opacity='.72'/><path d='M0 605h900v70H0Z' fill='${second}'/><path d='M0 620h900M0 650h900M90 605v70m90-70v70m90-70v70m90-70v70m90-70v70m90-70v70m90-70v70m90-70v70m90-70v70' stroke='${mat}' opacity='.35'/><g transform='translate(650 440)' fill='none' stroke='${second}' stroke-width='7'><circle cx='55' cy='55' r='48'/><path d='m55 12 12 43-12 43-12-43Z'/></g>`,
  happyhour:`<path d='M0 0h900v92H0Z' fill='${second}' opacity='.9'/><path d='M0 620h900v55H0Z' fill='${accent}' opacity='.9'/><g fill='none' stroke='${mat}' stroke-width='7' opacity='.82'><path d='M85 112h100l-18 90c-8 38-56 38-64 0Z M135 238v70M92 309h86'/><path d='M690 115h120l-18 78c-8 32-21 47-42 47s-34-15-42-47Z M750 240v68M705 309h90'/><path d='M705 148h90l-45 51Z'/><path d='M75 520h95v-116H75Z M170 430h20v68h-20'/></g><g fill='${second}' opacity='.65'><circle cx='240' cy='128' r='8'/><circle cx='270' cy='105' r='5'/><circle cx='635' cy='175' r='9'/></g>`,
  celebration:`<path d='M0 74Q220 160 450 74T900 74' fill='none' stroke='${accent}' stroke-width='7'/><g fill='${second}' opacity='.75'><path d='m78 99 54 86 44-65Z'/><path d='m260 123 55 87 46-67Z'/><path d='m460 110 55 88 46-68Z'/><path d='m665 124 54 86 45-68Z'/></g><g fill='none' stroke='${accent}' stroke-width='5' opacity='.55'><circle cx='120' cy='548' r='57'/><circle cx='780' cy='530' r='70'/></g><path d='M45 610h810' stroke='${second}' stroke-width='18' stroke-dasharray='4 14'/>`,
  wedding:`<path d='M0 0h900v82H0Z' fill='${mat}'/><path d='M0 42h900' stroke='${accent}' stroke-width='2'/><path d='M0 55h900' stroke='${accent}' stroke-width='2' stroke-dasharray='3 8'/><g fill='none' stroke='${accent}' stroke-width='5' opacity='.72'><path d='M35 620c35-115 98-175 205-192M72 574c32-7 58-25 72-54M113 530c-2-35 9-61 34-82M865 55c-40 100-105 151-218 165M820 95c-34 2-62 17-82 46M766 137c-5 32-22 57-49 75'/><circle cx='449' cy='600' r='34'/><circle cx='482' cy='600' r='34'/></g><g fill='${second}' opacity='.22'><ellipse cx='102' cy='552' rx='36' ry='13' transform='rotate(-42 102 552)'/><ellipse cx='160' cy='492' rx='39' ry='14' transform='rotate(-55 160 492)'/><ellipse cx='788' cy='112' rx='38' ry='13' transform='rotate(-42 788 112)'/></g>`,
  pet:`<path d='M0 600h900v75H0Z' fill='${second}' opacity='.75'/><path d='M0 615h900M0 650h900M100 600v75m100-75v75m100-75v75m100-75v75m100-75v75m100-75v75m100-75v75m100-75v75' stroke='${mat}' opacity='.35'/><g fill='${accent}' opacity='.42'><circle cx='95' cy='115' r='25'/><circle cx='60' cy='78' r='12'/><circle cx='92' cy='64' r='13'/><circle cx='126' cy='78' r='12'/><circle cx='793' cy='510' r='29'/><circle cx='754' cy='467' r='14'/><circle cx='792' cy='450' r='15'/><circle cx='832' cy='467' r='14'/></g><g transform='translate(680 78)' fill='${mat}' stroke='${accent}' stroke-width='5'><path d='M0 35C0 5 38 2 58 20 78 2 116 5 116 35s-38 33-58 15C38 68 0 65 0 35Z'/><path d='M20 35h76'/></g>`,
  baby:`<path d='M0 0h900v92H0Z' fill='${second}' opacity='.28'/><path d='M0 0h900v92' fill='none' stroke='${accent}' stroke-width='4' stroke-dasharray='12 12'/><path d='M0 604Q75 558 150 604t150 0t150 0t150 0t150 0t150 0v71H0Z' fill='${accent}' opacity='.26'/><g fill='none' stroke='${second}' stroke-width='5' opacity='.72'><path d='M98 150a58 58 0 1 0 65-90 72 72 0 1 1-65 90Z'/><path d='m735 90 10 24 27 2-21 17 7 26-23-14-22 14 6-26-21-17 27-2Z'/><path d='M690 560h130M715 540h80'/></g><g fill='${mat}' stroke='${accent}' stroke-width='3'><rect x='65' y='520' width='190' height='70' rx='5' transform='rotate(-3 160 555)'/><circle cx='230' cy='548' r='8'/></g>`,
  autumn:`<path d='M0 612h900v63H0Z' fill='${accent}' opacity='.75'/><g fill='none' stroke='${second}' stroke-width='10'><path d='M38 40c105 98 151 205 168 337M860 638c-106-89-160-189-186-323'/></g><g fill='${accent}' opacity='.75'><ellipse cx='105' cy='114' rx='34' ry='15' transform='rotate(35 105 114)'/><ellipse cx='158' cy='202' rx='38' ry='17' transform='rotate(-18 158 202)'/><ellipse cx='718' cy='402' rx='41' ry='18' transform='rotate(31 718 402)'/><ellipse cx='786' cy='516' rx='37' ry='16' transform='rotate(-28 786 516)'/></g><path d='M275 72h350' stroke='${second}' stroke-width='5' stroke-dasharray='16 9'/>`,
  sunset:`<defs><linearGradient id='sunsetSky' x1='0' y1='0' x2='0' y2='1'><stop stop-color='#302944'/><stop offset='.34' stop-color='#7f4058'/><stop offset='.68' stop-color='#d66e48'/><stop offset='1' stop-color='#edb45e'/></linearGradient></defs><rect width='900' height='675' fill='url(#sunsetSky)'/><circle cx='675' cy='435' r='118' fill='#f5c96d' opacity='.9'/><path d='M0 530c165-30 290 27 445-4s302 22 455-6v155H0Z' fill='#292735' opacity='.78'/><path d='M0 555c145-20 284 24 430-3s305 20 470-5' fill='none' stroke='#f2c57c' stroke-width='8' opacity='.5'/><rect x='34' y='34' width='832' height='607' fill='none' stroke='#f3d5aa' stroke-width='4' stroke-dasharray='18 10' opacity='.65'/>`,
  winter:`<path d='M0 0h900v675H0Z' fill='#263d55'/><path d='M0 585Q120 520 240 580t240 0t240 0t180-25v120H0Z' fill='${mat}' opacity='.92'/><path d='M0 0h900v70H0Z' fill='${accent}' opacity='.42'/><g fill='none' stroke='${mat}' stroke-width='5' opacity='.78'><path d='m105 110v92m-40-69 80 46m0-46-80 46'/><path d='m770 126v115m-50-86 100 57m0-57-100 57'/></g><g fill='${accent}' opacity='.62'><path d='m230 595 65-168 65 168Z'/><path d='m550 603 85-225 85 225Z'/></g><rect x='30' y='30' width='840' height='615' rx='8' fill='none' stroke='${mat}' stroke-width='3' stroke-dasharray='5 12'/>`,
  chalk:`<rect width='900' height='675' fill='#17201f'/><path d='M0 0h900v675H0Z' fill='url(#grain)' opacity='.65'/><g opacity='.12' stroke='${mat}' stroke-width='18'><path d='M60 115q220-80 420 10t360-15M40 540q230-65 430 20t390-25'/></g><rect x='32' y='32' width='836' height='611' rx='5' fill='none' stroke='${mat}' stroke-width='5' stroke-dasharray='18 10'/><g fill='none' stroke='${mat}' stroke-width='6' opacity='.82'><path d='M65 145c55-58 108-58 162 0M675 535c52-63 106-63 160 0'/><path d='m82 105 18 17 31-38M770 570l18 17 30-38'/></g><g transform='translate(50 525) rotate(-3)' filter='url(#shadow)'><rect width='255' height='82' rx='4' fill='${second}'/><path d='M18 24h215M18 45h165' stroke='${paper}' stroke-width='4' opacity='.45'/></g>`,
  vintage:`<rect width='900' height='675' fill='${paper}'/><rect x='28' y='28' width='844' height='619' fill='none' stroke='${accent}' stroke-width='7'/><rect x='43' y='43' width='814' height='589' fill='none' stroke='${second}' stroke-width='2'/><g fill='none' stroke='${accent}' stroke-width='7'><path d='M42 180Q42 42 180 42M720 42Q858 42 858 180M42 495Q42 633 180 633M720 633Q858 633 858 495'/></g><path d='M0 585h900v35H0Z' fill='${second}' opacity='.3'/><path d='M0 594h900' stroke='${accent}' stroke-width='2' stroke-dasharray='12 8'/>`,
  watercolor:`<g opacity='.28'><ellipse cx='115' cy='120' rx='190' ry='115' fill='${accent}'/><ellipse cx='790' cy='165' rx='185' ry='145' fill='${second}'/><ellipse cx='515' cy='590' rx='310' ry='105' fill='#c99c62'/><path d='M25 402Q240 320 450 405t420-20' fill='none' stroke='${second}' stroke-width='46' stroke-linecap='round'/></g><path d='M35 70h285M580 600h280' stroke='${accent}' stroke-width='4' stroke-dasharray='16 9'/><rect x='25' y='25' width='850' height='625' rx='12' fill='none' stroke='${second}' stroke-width='3' opacity='.55'/>`,
  sand:`<path d='M0 560c135-52 268 35 408-3s296 28 492-6v124H0Z' fill='${second}' opacity='.45'/><path d='M0 590c150-35 285 28 430-4s300 25 470-4' fill='none' stroke='${accent}' stroke-width='10' opacity='.55'/><g fill='none' stroke='${accent}' stroke-width='5' opacity='.65'><path d='M74 95q50-58 100 0-50 48-100 0Z'/><path d='M730 520q62-70 124 0-62 58-124 0Z'/></g><rect x='55' y='55' width='210' height='62' transform='rotate(-2 160 86)' fill='${mat}' stroke='${second}' stroke-width='3'/>`,
  paisley:`<path d='M0 0h900v75H0Z' fill='${accent}' opacity='.22'/><path d='M0 610h900v65H0Z' fill='${second}' opacity='.24'/><g fill='none' stroke='${accent}' stroke-width='9' opacity='.52'><path d='M86 220c125-165 220 48 94 126-85 48-135-37-94-126Z'/><path d='M650 442c145-180 242 60 100 139-98 48-147-49-100-139Z'/></g><g fill='${second}' opacity='.32'><circle cx='147' cy='273' r='24'/><circle cx='724' cy='520' r='31'/></g><rect x='30' y='30' width='840' height='615' fill='none' stroke='${accent}' stroke-width='3' stroke-dasharray='4 9'/>`,
  christmas:`<path d='M0 0h900v86H0Z' fill='${second}'/><path d='M0 610h900v65H0Z' fill='${accent}'/><path d='M0 620h900M0 650h900M90 610v65m90-65v65m90-65v65m90-65v65m90-65v65m90-65v65m90-65v65m90-65v65m90-65v65' stroke='${mat}' opacity='.28'/><g fill='none' stroke='${mat}' stroke-width='5'><path d='M115 0v115M255 0v150M735 0v128'/><circle cx='115' cy='145' r='32'/><circle cx='255' cy='180' r='39'/><circle cx='735' cy='158' r='35'/></g><g fill='${accent}' stroke='${second}' stroke-width='5'><path d='M55 555c40-115 102-166 188-206-11 91-61 159-188 206Z'/><path d='M846 540c-43-110-103-159-186-194 15 87 65 151 186 194Z'/></g><g fill='${second}'><circle cx='95' cy='515' r='10'/><circle cx='128' cy='486' r='10'/><circle cx='795' cy='500' r='10'/></g>`,
  halloween:`<rect width='900' height='675' fill='#201b27'/><path d='M0 605h900v70H0Z' fill='${accent}' opacity='.8'/><g fill='none' stroke='${second}' stroke-width='4' opacity='.6'><path d='M25 25q190 15 270 190M875 25q-190 15-270 190'/><path d='M25 65q145 5 230 150M875 65q-145 5-230 150'/></g><g fill='${accent}' opacity='.78'><ellipse cx='116' cy='548' rx='66' ry='54'/><ellipse cx='790' cy='540' rx='78' ry='64'/></g><rect x='32' y='32' width='836' height='611' fill='none' stroke='${mat}' stroke-width='3' stroke-dasharray='13 12' opacity='.6'/>`,
  easter:`<path d='M0 0h900v82H0Z' fill='${accent}' opacity='.22'/><path d='M0 610h900v65H0Z' fill='${second}' opacity='.28'/><g fill='none' stroke='${accent}' stroke-width='5' opacity='.62'><path d='M80 555c70-125 125-200 205-255M820 100c-75 100-140 155-225 190'/></g><g fill='${second}' opacity='.45'><ellipse cx='125' cy='505' rx='25' ry='42' transform='rotate(20 125 505)'/><ellipse cx='185' cy='430' rx='27' ry='44' transform='rotate(-18 185 430)'/><ellipse cx='760' cy='148' rx='26' ry='43' transform='rotate(25 760 148)'/></g><path d='M35 35h830v605H35Z' fill='none' stroke='${accent}' stroke-width='3' stroke-dasharray='4 9'/>`,
  patriotic:`<path d='M0 0h900v70H0Z' fill='${second}' opacity='.9'/><path d='M0 610h900v65H0Z' fill='${accent}' opacity='.9'/><path d='M0 620h900M0 650h900' stroke='${mat}' stroke-width='8' opacity='.35'/><g fill='${accent}' opacity='.54'><path d='m105 115 13 27 30 4-22 21 6 31-27-15-28 15 7-31-23-21 31-4Z'/><path d='m780 475 15 31 34 5-25 23 6 35-30-17-31 17 7-35-25-23 34-5Z'/></g><path d='M55 555Q450 430 845 555' fill='none' stroke='${second}' stroke-width='6' stroke-dasharray='18 10'/>`
 };
 const scene=scenes[kind]||scenes.vintage;
 const bg=kind==='sunset'||kind==='winter'||kind==='chalk'||kind==='halloween'?scene:`<rect width='900' height='675' fill='${paper}'/><rect width='900' height='675' fill='url(#grain)' opacity='.72'/><path d='M0 0h900v36H0Z' fill='${accent}' opacity='.14'/><path d='M0 639h900v36H0Z' fill='${second}' opacity='.14'/>${scene}`;
 const border=kind==='sunset'||kind==='winter'||kind==='chalk'||kind==='halloween'?'':`<rect x='24' y='24' width='852' height='627' rx='6' fill='none' stroke='${accent}' stroke-width='3' stroke-dasharray='4 10' opacity='.65'/><path d='M52 45h160M688 630h160' stroke='${second}' stroke-width='8' opacity='.45'/>`;
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 675'><defs><pattern id='grain' width='22' height='22' patternUnits='userSpaceOnUse'><circle cx='4' cy='5' r='1' fill='${accent}' opacity='.18'/><path d='M1 18h12' stroke='${second}' stroke-width='.7' opacity='.12'/></pattern><filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='5' stdDeviation='5' flood-opacity='.24'/></filter></defs>${bg}${border}</svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const STICKERS={
'Seasonal':['🐰','🥕','🥚','🎄','🎅','❄️','🎃','👻','🦃','🍂','🎆','🇺🇸'],
'Military':['🪖','🎖️','⭐','🇺🇸','⚓','✈️','🚁','🛡️'],
'Travel':['✈️','🧳','🗺️','📍','🚗','🏨','🎫','📷'],
'Outdoors':['⛺','🏔️','🌲','🔥','🎣','🛶','🏖️','🌊','⚓','🏍️'],
'Animals':['🐕','🐈','🐐','🐎','🐦','🐾','🦋','🐝'],
'Events':['💍','🎂','🎓','🎉','🎈','💐','👶','🍼'],
'Food & Drinks':['🍔','🍕','🍰','☕','🍷','🍺','🍹','🥂'],
'Flowers':['🌻','🌹','🌸','🌼','🌺','🌷','🪻','🍀']
};
const SHAPES=['none','heart','star','flower','oval','hexagon','puzzle','polaroid','shell','beach','vintage'];
let state=null,history=[],future=[],selected=null,saveTimer=null,gesture=null,pendingShape=null;
let multiSelected=new Set(),editAll=false,frameAll=false,photoEditMode=false;
let renderController=null,lastLocalHash='',lastFirebaseHash='',syncPromise=Promise.resolve(),moveFrame=0,dirty=false,closing=false;
const imageAssets=new Map();
const savedPhotoAssets=new Map();
const bridge=()=>window.OurFamilyAdventuresBridge||null;
const context=()=>bridge()?.getContext?.()||{uid:localStorage.getItem('ofa-uid')||'local-user',name:'Family member',theme:document.body.classList.contains('dark')?'dark':'light',media:[]};
const uid=()=>localStorage.getItem('ofa-uid')||'local-user';
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const clone=x=>typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function defaultTitle(name=context().name){return `${name||'Family member'}'s scrapbook · ${new Date().toLocaleDateString()}`}
function blank(){const ctx=context();return {id:id(),title:defaultTitle(ctx.name),status:'draft',theme:'Sea Glass',objects:[],createdAt:Date.now(),updatedAt:Date.now(),owner:ctx.uid||uid(),authorName:ctx.name||'Family member',tripId:ctx.tripId||'',version:V}}
function normalize(raw){const next=raw&&Array.isArray(raw.objects)?raw:blank(),ctx=context();next.version=V;next.theme=THEMES[next.theme]?next.theme:'Sea Glass';next.status=next.status||'draft';next.owner=next.owner||ctx.uid||uid();next.authorName=next.authorName||ctx.name||'Family member';next.title=next.title&&next.title!=='Untitled Scrapbook Page'?next.title:defaultTitle(next.authorName);next.createdAt=next.createdAt||next.updatedAt||Date.now();return next}
function draftKey(pageId){return `${DRAFT_PREFIX}${pageId}`}
function readDraftIndex(){try{const value=JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function updateDraftIndex(){const meta={id:state.id,title:String(state.title||''),theme:state.theme,status:state.status||'draft',owner:state.owner,authorName:state.authorName,createdAt:state.createdAt,updatedAt:state.updatedAt||Date.now(),photoCount:state.objects.filter(o=>o.type==='photo').length};const next=[meta,...readDraftIndex().filter(x=>x.id!==meta.id)].sort((a,b)=>Number(b.updatedAt)-Number(a.updatedAt));localStorage.setItem(DRAFT_INDEX_KEY,JSON.stringify(next))}
function assetDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(ASSET_DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(ASSET_STORE))request.result.createObjectStore(ASSET_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function assetPut(key,value){const db=await assetDb();return new Promise((resolve,reject)=>{const tx=db.transaction(ASSET_STORE,'readwrite');tx.objectStore(ASSET_STORE).put(value,key);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function assetGet(key){const db=await assetDb();return new Promise((resolve,reject)=>{const tx=db.transaction(ASSET_STORE,'readonly'),request=tx.objectStore(ASSET_STORE).get(key);request.onsuccess=()=>resolve(request.result||'');request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close()})}
async function storePhotoAssets(){for(const o of state.objects){if(o.type!=='photo'||!o.src||String(o.src).startsWith('idb:')||/^https?:/i.test(String(o.src)))continue;o.assetKey=o.assetKey||`${state.id}:${o.id}`;if(savedPhotoAssets.get(o.assetKey)===o.src)continue;await assetPut(o.assetKey,o.src);savedPhotoAssets.set(o.assetKey,o.src)}}
function storageCopy(){const next=clone(state);next.objects.forEach(o=>{if(o.type==='photo'&&o.src&&!/^https?:/i.test(String(o.src))){o.assetKey=o.assetKey||`${next.id}:${o.id}`;o.src=`idb:${o.assetKey}`}});return next}
async function hydrateAssets(next){await Promise.all(next.objects.map(async o=>{if(o.type!=='photo'||!String(o.src).startsWith('idb:'))return;const key=o.assetKey||String(o.src).slice(4);o.assetKey=key;try{o.src=await assetGet(key);if(o.src)savedPhotoAssets.set(key,o.src)}catch(e){console.warn('Photo recovery',e);o.src=''}}));return next}
async function load(pageId=''){
 try{
  const activeId=pageId||localStorage.getItem(ACTIVE_DRAFT_KEY)||'';
  let primary=JSON.parse((activeId&&localStorage.getItem(draftKey(activeId)))||localStorage.getItem(KEY)||'null');
  if(!primary&&activeId&&bridge()?.loadPage)primary=await bridge().loadPage(activeId,window.__ss2OwnerUid||'');
  const recovery=JSON.parse(sessionStorage.getItem(RECOVERY_KEY)||'null');
  const matchingRecovery=recovery&&(!primary||recovery.id===primary.id)?recovery:null;
  const best=matchingRecovery&&(!primary||Number(matchingRecovery.updatedAt)>Number(primary.updatedAt))?matchingRecovery:primary;
  const next=normalize(best);
  lastLocalHash=hash(JSON.stringify(next));
  return await hydrateAssets(next);
 }catch(e){console.warn('Scrapbook recovery reset',e);return blank()}
}
function setStatus(text){const el=document.querySelector('#ss2-status');if(el)el.textContent=text}
function serializeCurrent(){state.updatedAt=Date.now();state.version=V;return JSON.stringify(state)}
async function storageSafe(serialized){
 try{
  if(!navigator.storage?.estimate)return true;
  const {usage=0,quota=0}=await navigator.storage.estimate();
  const projected=usage+new Blob([serialized]).size;
  return !quota||projected<quota*.94;
 }catch{return true}
}
async function persist({force=false,sync=true}={}){
 if(!state)return false;
 clearTimeout(saveTimer);saveTimer=null;
 state.updatedAt=Date.now();state.version=V;
 try{await storePhotoAssets()}catch(e){console.warn('Photo asset save',e);setStatus('Photo save needs space');return false}
 const serialized=JSON.stringify(storageCopy());
 const currentHash=hash(serialized);
 if(!force&&!dirty&&currentHash===lastLocalHash){setStatus('Saved');return true}
 try{
  if(!(await storageSafe(serialized)))throw new DOMException('Device storage is nearly full','QuotaExceededError');
  localStorage.setItem(draftKey(state.id),serialized);
  localStorage.setItem(ACTIVE_DRAFT_KEY,state.id);
  updateDraftIndex();
  sessionStorage.setItem(RECOVERY_KEY,serialized);
  lastLocalHash=currentHash;dirty=false;setStatus('Saved');
  bridge()?.savePage?.(clone(state));
  if(sync)queueFirebaseSync(serialized,currentHash);
  return true;
 }catch(e){
  console.warn('Scrapbook save protection',e);
  try{sessionStorage.setItem(RECOVERY_KEY,serialized)}catch{}
  setStatus('Storage full · recovery kept');
  return false;
 }
}
function scheduleSave(){dirty=true;if(state?.status==='final')state.status='draft';setStatus('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(),SAVE_DELAY)}
function queueFirebaseSync(serialized,currentHash){
 if(currentHash===lastFirebaseHash)return;
 syncPromise=syncPromise.catch(()=>{}).then(async()=>{
  try{
   const user=window.firebase?.auth?.().currentUser;
   if(!user||!window.firebase?.database)return;
   if(currentHash===lastFirebaseHash)return;
   const payload=JSON.parse(serialized);
   const family=context().familyId||'default-family';
   await firebase.database().ref(`families/${family}/scrapbookStudioV2/${user.uid}/${payload.id}`).update(payload);
   lastFirebaseHash=currentHash;
  }catch(e){console.warn('Scrapbook 2 sync',e);setStatus('Saved on device')}
 });
}
function compactSnapshot(){
 const snap=clone(state);
 snap.objects.forEach(o=>{if(o.type==='photo'&&o.src){const key=`asset:${o.id}`;imageAssets.set(key,o.src);o.src=key}});
 return snap;
}
function restoreSnapshot(snap){
 const next=clone(snap);
 next.objects.forEach(o=>{if(o.type==='photo'&&String(o.src).startsWith('asset:'))o.src=imageAssets.get(o.src)||''});
 return next;
}
function snapshot(){
 history.push(compactSnapshot());
 if(history.length>HISTORY_LIMIT)history.shift();
 future=[];
 updateUndoButtons();
}
function undo(){if(!history.length)return;future.push(compactSnapshot());state=restoreSnapshot(history.pop());selected=null;renderStage();scheduleSave();updateUndoButtons()}
function redo(){if(!future.length)return;history.push(compactSnapshot());state=restoreSnapshot(future.pop());selected=null;renderStage();scheduleSave();updateUndoButtons()}
function updateUndoButtons(){['#ss2-undo','#ss2-mundo'].forEach(s=>{const e=document.querySelector(s);if(e)e.disabled=!history.length});['#ss2-redo','#ss2-mredo'].forEach(s=>{const e=document.querySelector(s);if(e)e.disabled=!future.length})}
function obj(){return state?.objects.find(x=>x.id===selected)}
function photos(){return state.objects.filter(o=>o.type==='photo')}
function photoNumber(o){return photos().findIndex(p=>p.id===o.id)+1}
function editTargets(){const current=obj();if(editAll&&multiSelected.size)return photos().filter(o=>multiSelected.has(o.id));return current?[current]:[]}
function frameTargets(){if(frameAll)return photos();if(multiSelected.size)return photos().filter(o=>multiSelected.has(o.id));const current=obj();return current&&current.type==='photo'?[current]:[]}
function add(type,extra={}){snapshot();const base={id:id(),type,x:110,y:90,w:220,h:170,r:0,z:state.objects.length+1,locked:false,opacity:1,group:null};state.objects.push(Object.assign(base,extra));selected=base.id;renderStage();scheduleSave()}
async function compressImage(file){
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=data});
  const ratio=Math.min(1,MAX_IMAGE_EDGE/Math.max(img.naturalWidth,img.naturalHeight));
  if(ratio===1&&file.size<1_500_000)return data;
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.82);
 }catch{return data}
}
async function addPhoto(file,shape='none'){
 setStatus('Preparing photo…');
 const src=await compressImage(file);
 add('photo',{src,name:file.name||'',shape,border:'#fff',borderWidth:0,shadow:0,glow:0,fit:'cover',flipX:1,flipY:1,photoScale:1,photoX:0,photoY:0});
}
function addText(){add('text',{text:'Double-tap to edit',fontSize:34,color:'#263238',fontWeight:700,w:330,h:90})}
function addSticker(text){add('sticker',{text,fontSize:70,w:100,h:100})}
function addTextPreset(shape='plain'){add('text',{text:shape==='speech'?'A favorite memory':shape==='note'?'Remember this…':'Family memory',fontSize:34,color:'#263238',fontWeight:700,fontFamily:'Georgia,serif',backgroundColor:shape==='plain'?'transparent':'#fff4c7',borderColor:'#7f6655',textShape:shape,w:shape==='speech'?360:300,h:shape==='label'?78:120})}
function mediaMarkup(){const media=context().media||[];return media.length?`<div class="ss2-media-grid">${media.map(item=>`<label><input type="checkbox" data-media-photo="${esc(item.id)}"><img src="${esc(item.url)}" alt="${esc(item.name||'Media photo')}"><span>${esc(item.name||'Photo')}</span></label>`).join('')}</div><button id="ss2-add-media" class="primary">Add selected Media photos</button>`:'<p>No saved Media photos are available yet. You can still upload from your phone.</p>'}
function addMediaPhotos(){const media=context().media||[],chosen=[...document.querySelectorAll('[data-media-photo]:checked')].map(input=>media.find(item=>item.id===input.dataset.mediaPhoto)).filter(Boolean);if(!chosen.length){notice('Select at least one Media photo');return}chosen.forEach((item,i)=>addPhotoUrl(item.url,item.name||'Media photo',i,'none'));closePanels();notice(`${chosen.length} Media photo${chosen.length===1?'':'s'} added`)}
function addPhotoUrl(src,name='',offset=0,shape='none'){add('photo',{src,name,shape,border:'#fff',borderWidth:0,shadow:0,glow:0,fit:'cover',flipX:1,flipY:1,photoScale:1,photoX:0,photoY:0,x:80+(offset%4)*26,y:70+(offset%4)*24})}
function render(){
 document.body.classList.add('ss2-open');document.querySelector('.ss2')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<section class="ss2"><div class="ss2-top"><button id="ss2-close">← App</button><h2>Scrapbook Studio 2.0</h2><input id="ss2-title" value="${esc(state.title)}" placeholder="Untitled scrapbook — tap to name" aria-label="Page title"><span id="ss2-status">${state.status==='final'?'Finalized':'Draft saved'}</span><button class="desktop" id="ss2-undo">Undo</button><button class="desktop" id="ss2-redo">Redo</button><button id="ss2-close-page">Close Page</button><button id="ss2-save">Save Draft</button><button id="ss2-finalize">${state.status==='final'?'Finalized ✓':'Finalize'}</button><button class="primary" id="ss2-export">Export</button><button class="ss2-mobiletool" data-panel=".ss2-left">＋ Add</button><button class="ss2-mobiletool" id="ss2-mclose-page">Close</button><button class="ss2-mobiletool" id="ss2-msave">Save</button><button class="ss2-mobiletool" id="ss2-mfinalize">Finalize</button><button class="ss2-mobiletool" data-panel=".ss2-right">☷ Edit</button></div><div class="ss2-body"><aside class="ss2-panel ss2-left"><button class="ss2-panel-close" type="button" aria-label="Close add panel">×</button><h3>Add</h3><div class="ss2-grid"><button id="ss2-photo">📷</button><button id="ss2-text">T</button><button id="ss2-emoji">😊</button></div><input hidden multiple type="file" accept="image/*" id="ss2-files"><h3>Professional scrapbook layouts</h3><p>Layered papers, stitching, ribbons, journaling details, and coordinated embellishments.</p><select id="ss2-theme">${Object.keys(THEMES).map(t=>`<option ${t===state.theme?'selected':''}>${t}</option>`).join('')}</select><h3>Frames</h3><label class="ss2-check"><input id="ss2-frame-all" type="checkbox" ${frameAll?'checked':''}> Add frame to every photo</label><p>Or check photos in Edit to frame only those.</p><div class="ss2-grid">${SHAPES.map(s=>`<button data-frame="${s}" title="${s}">${({none:'▢',heart:'❤️',star:'⭐',flower:'🌸',oval:'⭕',hexagon:'🔷',puzzle:'🧩',polaroid:'📷',shell:'🌊',beach:'🏖️',vintage:'📜'})[s]}</button>`).join('')}</div><div id="ss2-stickers">${Object.entries(STICKERS).map(([g,a])=>`<h3>${g}</h3><div class="ss2-grid">${a.map(s=>`<button data-sticker="${s}">${s}</button>`).join('')}</div>`).join('')}</div></aside><main class="ss2-stage-wrap"><div class="ss2-stage-viewport"><div class="ss2-stage" id="ss2-stage"></div></div><div id="ss2-quickbar" class="ss2-quickbar"></div></main><aside class="ss2-panel ss2-right"><button class="ss2-panel-close" type="button" aria-label="Close edit panel">×</button><h3>Edit</h3><div class="ss2-controls" id="ss2-controls"></div><h3>Layers</h3><div class="ss2-list" id="ss2-layers"></div></aside></div><section id="ss2-pages" class="ss2-pages" hidden><div class="ss2-pages-card"><header><div><h2>Saved scrapbook pages</h2><p>Open a draft or start a new page. Photos stay with each saved page on this device.</p></div><button id="ss2-pages-back" type="button" aria-label="Return to current page">×</button></header><div class="ss2-pages-actions"><button class="primary" id="ss2-new-page">＋ New Page</button><button id="ss2-pages-app">← Back to App</button></div><div id="ss2-draft-list" class="ss2-draft-list"></div></div></section><section id="ss2-export-menu" class="ss2-export-menu" hidden><div class="ss2-export-card"><h2>Export full page</h2><p>Your complete 900 × 675 scrapbook page will be exported without editor controls.</p><div><button class="primary" data-export-format="jpeg">Download JPEG</button><button class="primary" data-export-format="pdf">Download PDF</button><button id="ss2-export-cancel">Cancel</button></div></div></section><div id="ss2-notice" class="ss2-notice" role="status"></div></section>`);
 const editor=document.querySelector('.ss2'),left=document.querySelector('.ss2-left'),title=document.querySelector('#ss2-title'),heading=document.querySelector('.ss2-top h2');
 editor?.classList.toggle('dark',context().theme==='dark');editor?.classList.toggle('viewing',state.status==='final');
 if(heading)heading.textContent=state.status==='final'?'Finalized Page':'Scrapbook Editor';if(title){title.placeholder='Page title';title.readOnly=state.status==='final'}
 title?.insertAdjacentHTML('afterend',`<span class="ss2-author">By ${esc(state.authorName)}</span>`);
 if(state.status==='final'){document.querySelector('#ss2-close-page').textContent='Back to Scrapbook';document.querySelector('#ss2-mclose-page').textContent='Back'}
 const fileInput=document.querySelector('#ss2-files');fileInput?.insertAdjacentHTML('afterend',`<section class="ss2-source-section"><h3>Photos from Media</h3>${mediaMarkup()}<h3>Text cutouts</h3><div class="ss2-text-presets"><button data-text-preset="plain">Plain text</button><button data-text-preset="speech">💬 Chat bubble</button><button data-text-preset="note">📝 Note card</button><button data-text-preset="label">🏷️ Label</button></div></section>`);
 document.querySelector('#ss2-theme')?.insertAdjacentHTML('afterend','<button id="ss2-theme-layout">Arrange photos for this theme</button>');
 bind();renderStage();fit();updateUndoButtons();
}
function objectMarkup(o){
 const style=`width:${o.w}px;height:${o.h}px;transform:translate3d(${o.x}px,${o.y}px,0) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1});z-index:${o.z};opacity:${o.opacity??1}`;
 const photoDecor=o.type==='photo'?`border-color:${o.border||'#fff'};border-width:${o.borderWidth||0}px;box-shadow:0 ${Math.max(2,o.shadow||0)/2}px ${o.shadow||0}px #0007,0 0 ${o.glow||0}px #fff;`:'';
 let inner='';
 if(o.type==='photo')inner=`<div class="ss2-object-content ss2-frame" data-shape="${o.shape||'none'}" style="${photoDecor}"><img draggable="false" src="${o.src}" style="object-fit:${o.fit||'cover'};transform:translate3d(${o.photoX||0}px,${o.photoY||0}px,0) scale(${o.photoScale||1})"></div><span class="ss2-photo-number">${photoNumber(o)}</span>`;
 else inner=`<div class="ss2-object-content"><div class="ss2-text" data-text-shape="${o.textShape||'plain'}" style="font-size:${o.type==='sticker'?Math.max(18,Math.min(o.w,o.h)*.72):(o.fontSize||50)}px;color:${o.color||'#263238'};font-weight:${o.fontWeight||400};font-family:${o.fontFamily||'system-ui,sans-serif'};background:${o.backgroundColor||'transparent'};border-color:${o.borderColor||'transparent'}">${esc(o.text)}</div></div>`;
 if(o.id===selected&&state.status!=='final')inner+='<button class="ss2-delete-handle" type="button" aria-label="Delete selected object">×</button><button class="ss2-resize-handle" type="button" aria-label="Resize selected object"></button>';
 const cls=`ss2-object ${o.id===selected?'selected':''} ${multiSelected.has(o.id)?'multi-selected':''} ${o.locked?'locked':''}`;
 return `<div class="${cls}" data-id="${o.id}" style="${style}">${inner}</div>`;
}
function renderStage(){
 const st=document.querySelector('#ss2-stage');if(!st||!state)return;
 const th=THEMES[state.theme]||THEMES['Sea Glass'];st.style.background=th[0];st.style.backgroundImage=themeArt(state.theme);st.style.backgroundSize='cover';st.style.backgroundPosition='center';st.dataset.corner='';
 st.innerHTML=state.objects.length?state.objects.slice().sort((a,b)=>a.z-b.z).map(objectMarkup).join(''):'<div class="ss2-empty">Tap + to add photos, stickers, or text</div>';
 if(state.status!=='final')st.querySelectorAll('.ss2-object').forEach(el=>{el.onpointerdown=startGesture;el.ondblclick=editObject});
 st.querySelectorAll('.ss2-delete-handle').forEach(button=>{button.onpointerdown=e=>e.stopPropagation();button.onclick=e=>{e.stopPropagation();removeObject(button.closest('.ss2-object').dataset.id)}});
 renderControls();renderLayers();renderQuickbar();
}
function renderControls(){
 const c=document.querySelector('#ss2-controls'),o=obj();if(!c)return;if(!o){c.innerHTML=`${photoSelectionTools()}<p>Select an object on the page or choose a numbered photo below.</p>`;return}
 const targets=editTargets(),sizeName=o.type==='photo'?'Frame':o.type==='sticker'?'Sticker':'Object';
 const photoTools=o.type==='photo'?`<h3>Photo inside frame</h3><button data-action="inside" class="${photoEditMode?'active':''}">${photoEditMode?'Move photo now':'Edit photo inside frame'}</button><p class="ss2-help">Use these sliders or turn on photo editing and drag the photo.</p><label>Photo zoom <input data-photo-prop="photoScale" type="range" min=".25" max="4" step=".05" value="${o.photoScale||1}"></label><label>Photo left / right <input data-photo-prop="photoX" type="range" min="-500" max="500" value="${o.photoX||0}"></label><label>Photo up / down <input data-photo-prop="photoY" type="range" min="-400" max="400" value="${o.photoY||0}"></label><div class="ss2-grid"><button data-action="centerphoto">Center</button><button data-action="fit">Fit</button><button data-action="fill">Fill</button><button data-action="flipx">Flip ↔</button><button data-action="flipy">Flip ↕</button><button data-action="replace">Replace</button></div><h3>Frame style</h3><label>Border <input data-prop="border" type="color" value="${o.border||'#ffffff'}"></label><label>Border thickness <input data-prop="borderWidth" type="range" min="0" max="40" value="${o.borderWidth||0}"></label><label>Shadow <input data-prop="shadow" type="range" min="0" max="50" value="${o.shadow||0}"></label><label>Glow <input data-prop="glow" type="range" min="0" max="40" value="${o.glow||0}"></label>`:'';
 const textTools=o.type==='text'?`<h3>Text style</h3><label>Font <select data-prop="fontFamily"><option value="system-ui,sans-serif" ${o.fontFamily==='system-ui,sans-serif'?'selected':''}>Clean</option><option value="Georgia,serif" ${o.fontFamily==='Georgia,serif'?'selected':''}>Classic serif</option><option value="'Trebuchet MS',sans-serif" ${o.fontFamily==="'Trebuchet MS',sans-serif"?'selected':''}>Friendly</option><option value="'Brush Script MT',cursive" ${o.fontFamily==="'Brush Script MT',cursive"?'selected':''}>Script</option><option value="'Courier New',monospace" ${o.fontFamily==="'Courier New',monospace"?'selected':''}>Typewriter</option></select></label><label>Font color <input data-prop="color" type="color" value="${o.color||'#263238'}"></label><label>Fill color <input data-prop="backgroundColor" type="color" value="${o.backgroundColor&&o.backgroundColor!=='transparent'?o.backgroundColor:'#fff4c7'}"></label><label>Cutout <select data-prop="textShape"><option value="plain" ${o.textShape==='plain'?'selected':''}>Plain</option><option value="speech" ${o.textShape==='speech'?'selected':''}>Chat bubble</option><option value="note" ${o.textShape==='note'?'selected':''}>Note card</option><option value="label" ${o.textShape==='label'?'selected':''}>Label</option></select></label><button data-action="textnofill">No background fill</button>`:'';
 c.innerHTML=`<h3>${o.type==='photo'?'Photo '+photoNumber(o):o.type}</h3>${photoSelectionTools()}${editAll&&targets.length?`<p class="ss2-bulk-note">Editing ${targets.length} checked photos together.</p>`:''}<div class="ss2-grid"><button data-action="forward">Forward</button><button data-action="back">Back</button><button data-action="duplicate">Duplicate</button><button data-action="lock">${o.locked?'Unlock':'Lock'}</button><button data-action="group">${o.group?'Ungroup':'Group'}</button><button data-action="delete">Delete</button></div><h3>${sizeName} size</h3><label>${sizeName} width <input data-prop="w" type="range" min="30" max="850" value="${o.w}"></label><label>${sizeName} height <input data-prop="h" type="range" min="30" max="630" value="${o.h}"></label><label>Rotate <input data-prop="r" type="range" min="-180" max="180" value="${o.r}"></label><label>Opacity <input data-prop="opacity" type="range" min=".1" max="1" step=".05" value="${o.opacity??1}"></label>${photoTools}${textTools}`;
 c.querySelectorAll('[data-prop]').forEach(input=>{
  let captured=false;
  const capture=()=>{if(!captured){snapshot();captured=true}};
  input.onpointerdown=capture;input.onfocus=capture;
  input.oninput=()=>{capture();editTargets().forEach(current=>{current[input.dataset.prop]=input.type==='range'?Number(input.value):input.value;updateObjectElement(current)});scheduleSave()};
  input.onchange=()=>{captured=false;renderControls()};
 });
 c.querySelectorAll('[data-photo-prop]').forEach(input=>{
  let captured=false;const capture=()=>{if(!captured){snapshot();captured=true}};input.onpointerdown=capture;input.onfocus=capture;
  input.oninput=()=>{capture();editTargets().filter(current=>current.type==='photo').forEach(current=>{current[input.dataset.photoProp]=Number(input.value);updateObjectElement(current)});scheduleSave()};
  input.onchange=()=>{captured=false;renderControls()};
 });
 c.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>action(e.dataset.action));
 const all=document.querySelector('#ss2-select-all'),none=document.querySelector('#ss2-select-none'),bulk=document.querySelector('#ss2-edit-all');
 if(all)all.onclick=()=>{multiSelected=new Set(photos().map(x=>x.id));renderStage()};
 if(none)none.onclick=()=>{multiSelected.clear();editAll=false;renderStage()};
 if(bulk)bulk.onchange=()=>{editAll=bulk.checked;if(editAll&&!multiSelected.size)multiSelected=new Set(photos().map(x=>x.id));renderStage()};
}
function photoSelectionTools(){if(!photos().length)return'';return `<div class="ss2-selection-tools"><button id="ss2-select-all">Select all photos</button><button id="ss2-select-none">Clear</button></div><label class="ss2-check"><input id="ss2-edit-all" type="checkbox" ${editAll?'checked':''}> Edit checked photos together</label>`}
function updateObjectElement(o){const el=document.querySelector(`.ss2-object[data-id="${CSS.escape(o.id)}"]`);if(!el){renderStage();return}const fresh=document.createRange().createContextualFragment(objectMarkup(o)).firstElementChild;el.replaceWith(fresh);fresh.onpointerdown=startGesture;fresh.ondblclick=editObject;const del=fresh.querySelector('.ss2-delete-handle');if(del){del.onpointerdown=e=>e.stopPropagation();del.onclick=e=>{e.stopPropagation();removeObject(o.id)}}}
function renderLayers(){const l=document.querySelector('#ss2-layers');if(!l)return;l.innerHTML=state.objects.slice().sort((a,b)=>b.z-a.z).map(o=>{if(o.type==='photo'){const n=photoNumber(o);return `<div class="ss2-layer-row ${o.id===selected?'active':''}"><button data-layer="${o.id}"><img src="${o.src}" alt=""><span><b>Photo ${n}</b><small>${o.shape&&o.shape!=='none'?o.shape+' frame':'No frame'}</small></span></button><label title="Include Photo ${n} in bulk edits"><input data-multi="${o.id}" type="checkbox" ${multiSelected.has(o.id)?'checked':''}><span>Select</span></label></div>`}return `<div class="ss2-layer-row ${o.id===selected?'active':''}"><button data-layer="${o.id}"><span><b>${o.locked?'🔒 ':''}${o.type==='text'?'T '+esc(o.text).slice(0,18):o.text+' sticker'}</b></span></button></div>`}).join('');l.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{selected=b.dataset.layer;photoEditMode=false;renderStage()});l.querySelectorAll('[data-multi]').forEach(i=>i.onchange=()=>{i.checked?multiSelected.add(i.dataset.multi):multiSelected.delete(i.dataset.multi);renderStage()})}
function removeObject(objectId){const target=state.objects.find(x=>x.id===objectId);if(!target)return;snapshot();state.objects=state.objects.filter(x=>x.id!==objectId);multiSelected.delete(objectId);if(selected===objectId)selected=null;renderStage();scheduleSave();notice(`${target.type==='sticker'?'Sticker':'Object'} deleted`)}
function renderQuickbar(){
 const q=document.querySelector('#ss2-quickbar'),o=obj();if(!q)return;
 if(!o){q.innerHTML='<span class="ss2-quick-hint">Tap a photo or sticker for quick editing.</span><button data-quick="undo">↶ Undo</button><button data-quick="redo">Redo ↷</button>'}
 else if(o.type==='photo')q.innerHTML=`<strong>Photo ${photoNumber(o)}</strong><button data-quick="undo">↶ Undo</button><button data-quick="redo">Redo ↷</button><button data-quick="inside" class="${photoEditMode?'active':''}">${photoEditMode?'Move photo now':'Move photo'}</button><button data-quick="zoomout">Zoom −</button><button data-quick="zoomin">Zoom +</button><button data-quick="fit">Fit</button><button data-quick="fill">Fill</button><button class="danger" data-quick="delete">Delete</button><div class="ss2-quick-frames">${SHAPES.map(shape=>`<button data-quick-frame="${shape}" class="${shape===(o.shape||'none')?'active':''}">${shape==='none'?'No frame':shape}</button>`).join('')}</div>`
 else q.innerHTML=`<strong>${o.type==='sticker'?'Sticker':'Text'}</strong><button data-quick="undo">↶ Undo</button><button data-quick="redo">Redo ↷</button><button data-quick="smaller">Smaller</button><button data-quick="larger">Larger</button><button data-quick="rotate">Rotate</button><button data-quick="duplicate">Duplicate</button><button class="danger" data-quick="delete">Delete</button>`;
 q.querySelectorAll('[data-quick]').forEach(button=>button.onclick=()=>quickAction(button.dataset.quick));
 q.querySelectorAll('[data-quick-frame]').forEach(button=>button.onclick=()=>setFrames([obj()].filter(Boolean),button.dataset.quickFrame));
}
function quickAction(name){
 if(name==='undo')return undo();if(name==='redo')return redo();const o=obj();if(!o)return;
 if(name==='delete'){if(o.type==='photo'&&!confirm(`Remove Photo ${photoNumber(o)} from this page?`))return;return removeObject(o.id)}if(name==='duplicate')return action('duplicate');if(name==='inside'){photoEditMode=!photoEditMode;renderStage();return}
 snapshot();
 if(name==='smaller'){o.w=Math.max(40,o.w*.82);o.h=Math.max(40,o.h*.82)}
 if(name==='larger'){o.w=Math.min(850,o.w*1.18);o.h=Math.min(630,o.h*1.18)}
 if(name==='rotate')o.r=((o.r||0)+15)%360;
 if(name==='zoomout')o.photoScale=Math.max(.25,(o.photoScale||1)-.15);
 if(name==='zoomin')o.photoScale=Math.min(4,(o.photoScale||1)+.15);
 if(name==='fit')o.fit='contain';if(name==='fill')o.fit='cover';renderStage();scheduleSave();
}
function action(a){
 const o=obj();if(!o)return;if(a==='inside'){photoEditMode=!photoEditMode;renderStage();return}snapshot();
 if(a==='delete'){if(o.type==='photo'&&!confirm(`Remove Photo ${photoNumber(o)} from this page?`)){history.pop();return}state.objects=state.objects.filter(x=>x.id!==o.id);multiSelected.delete(o.id);selected=null}
 if(a==='duplicate'){const n=clone(o);n.id=id();n.x+=24;n.y+=24;n.z=Math.max(0,...state.objects.map(x=>x.z))+1;state.objects.push(n);selected=n.id}
 if(a==='lock')o.locked=!o.locked;
 if(a==='forward')o.z=Math.max(0,...state.objects.map(x=>x.z))+1;
 if(a==='back')o.z=Math.min(0,...state.objects.map(x=>x.z))-1;
 if(a==='group'){if(o.group){const g=o.group;state.objects.filter(x=>x.group===g).forEach(x=>x.group=null)}else{o.group=id()}}
 const targetPhotos=editTargets().filter(x=>x.type==='photo');
 if(a==='fit')targetPhotos.forEach(x=>x.fit='contain');if(a==='fill')targetPhotos.forEach(x=>x.fit='cover');if(a==='flipx')targetPhotos.forEach(x=>x.flipX=(x.flipX||1)*-1);if(a==='flipy')targetPhotos.forEach(x=>x.flipY=(x.flipY||1)*-1);
 if(a==='centerphoto')targetPhotos.forEach(x=>{x.photoX=0;x.photoY=0});
 if(a==='textnofill'&&o.type==='text')o.backgroundColor='transparent';
 if(a==='replace'){pendingShape=o.shape||'none';document.querySelector('#ss2-files').dataset.replace=o.id;document.querySelector('#ss2-files').click();return}
 renderStage();scheduleSave();
}
function editObject(){selected=this.dataset.id;const o=obj();if(!o||o.locked)return;if(o.type==='text'){const text=prompt('Edit text',o.text);if(text!==null){snapshot();o.text=text;renderStage();scheduleSave()}}else renderStage()}
function startGesture(e){
 selected=this.dataset.id;const o=obj();if(!o||o.locked||e.button>0)return;e.preventDefault();
 try{this.setPointerCapture(e.pointerId)}catch{}
 const mode=e.target.closest('.ss2-resize-handle')?'resize':photoEditMode&&o.type==='photo'?'photo':'move';
 snapshot();gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,ox:o.x,oy:o.y,ow:o.w,oh:o.h,opx:o.photoX||0,opy:o.photoY||0,mode,o,el:this,lastX:e.clientX,lastY:e.clientY};
 this.onpointermove=moveGesture;this.onpointerup=endGesture;this.onpointercancel=endGesture;renderControls();renderLayers();
}
function moveGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;gesture.lastX=e.clientX;gesture.lastY=e.clientY;if(moveFrame)return;moveFrame=requestAnimationFrame(()=>{moveFrame=0;if(!gesture)return;const s=scale(),dx=(gesture.lastX-gesture.x)/s,dy=(gesture.lastY-gesture.y)/s,o=gesture.o;if(gesture.mode==='resize'){o.w=Math.max(40,Math.min(900-o.x,gesture.ow+dx));o.h=Math.max(40,Math.min(675-o.y,gesture.oh+dy));gesture.el.style.width=`${o.w}px`;gesture.el.style.height=`${o.h}px`;const sticker=gesture.el.querySelector('.ss2-text');if(o.type==='sticker'&&sticker)sticker.style.fontSize=`${Math.max(18,Math.min(o.w,o.h)*.72)}px`}else if(gesture.mode==='photo'){o.photoX=gesture.opx+dx;o.photoY=gesture.opy+dy;const img=gesture.el.querySelector('img');if(img)img.style.transform=`translate3d(${o.photoX}px,${o.photoY}px,0) scale(${o.photoScale||1})`}else{o.x=Math.max(0,Math.min(900-o.w,gesture.ox+dx));o.y=Math.max(0,Math.min(675-o.h,gesture.oy+dy));gesture.el.style.transform=`translate3d(${o.x}px,${o.y}px,0) rotate(${o.r}deg) scale(${o.flipX||1},${o.flipY||1})`}})}
function endGesture(e){if(!gesture||e.pointerId!==gesture.pointerId)return;if(moveFrame){cancelAnimationFrame(moveFrame);moveFrame=0}const el=gesture.el;gesture=null;el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;renderStage();scheduleSave()}
function scale(){return Number(document.querySelector('#ss2-stage')?.dataset.scale||1)}
function fit(){
 const wrap=document.querySelector('.ss2-stage-wrap'),viewport=document.querySelector('.ss2-stage-viewport'),st=document.querySelector('#ss2-stage');if(!wrap||!viewport||!st)return;
 const rect=wrap.getBoundingClientRect(),css=getComputedStyle(wrap);
 const px=v=>Number.parseFloat(v)||0;
 const viewportWidth=Math.min(rect.width,document.documentElement.clientWidth||innerWidth);
 const viewportHeight=Math.min(rect.height,window.visualViewport?.height||innerHeight);
 const availableWidth=Math.max(1,viewportWidth-px(css.paddingLeft)-px(css.paddingRight));
 const availableHeight=Math.max(1,viewportHeight-px(css.paddingTop)-px(css.paddingBottom));
 const s=Math.max(.1,Math.min(1,availableWidth/900,availableHeight/675));
 viewport.style.width=`${900*s}px`;viewport.style.height=`${675*s}px`;
 st.style.transform=`scale(${s})`;st.dataset.scale=String(s);
}
function closePanels(){document.querySelectorAll('.ss2-panel.open').forEach(p=>p.classList.remove('open'))}
function resetEditorState(){history=[];future=[];selected=null;multiSelected.clear();editAll=false;frameAll=false;photoEditMode=false}
function renderDraftList(){
 const list=document.querySelector('#ss2-draft-list');if(!list)return;
 const drafts=readDraftIndex();
 list.innerHTML=drafts.length?drafts.map(d=>`<article class="ss2-draft-row ${d.id===state.id?'current':''}"><div><h3>${esc(d.title||'Untitled scrapbook')}</h3><p>${Number(d.photoCount)||0} photo${Number(d.photoCount)===1?'':'s'} · ${d.status==='final'?'Finalized':'Draft'} · ${new Date(Number(d.updatedAt)||Date.now()).toLocaleString()}</p></div><button data-open-draft="${esc(d.id)}">${d.id===state.id?'Return':'Open'}</button></article>`).join(''):'<p class="ss2-no-drafts">No saved pages yet. Start a new page to begin.</p>';
 list.querySelectorAll('[data-open-draft]').forEach(button=>button.onclick=()=>openDraft(button.dataset.openDraft));
}
function showDraftLibrary(){closePanels();renderDraftList();const pages=document.querySelector('#ss2-pages');if(pages)pages.hidden=false}
function hideDraftLibrary(){const pages=document.querySelector('#ss2-pages');if(pages)pages.hidden=true}
function exitToHub(){renderController?.abort();renderController=null;document.querySelector('.ss2')?.remove();document.body.classList.remove('ss2-open');bridge()?.refreshScrapbook?.();if(!location.hash.startsWith('#scrapbook'))location.hash='#scrapbook'}
async function closePage(){if(state.status!=='final'){const ok=await persist({force:true});if(!ok){notice('Page could not be closed until it is saved');return}}exitToHub()}
async function newPage(){if(state&&state.status!=='final')await persist({force:true});state=blank();resetEditorState();await persist({force:true});render();notice(`New page started by ${state.authorName}`)}
async function openDraft(pageId){if(pageId===state.id){hideDraftLibrary();return}state=await load(pageId);resetEditorState();render();notice(state.status==='final'?'Finalized page opened in view mode':'Draft opened for editing')}
function setFrames(targets,shape){if(!targets.length)return;snapshot();targets.forEach(o=>{o.shape=shape;if(shape==='none'){o.borderWidth=0;o.shadow=0;o.glow=0}else if(!Number(o.borderWidth)){o.borderWidth=6}});renderStage();scheduleSave()}
function applyFrame(shape){
 const targets=frameTargets();if(!targets.length){alert('Select a photo, check photos in Edit, or turn on “Add frame to every photo.”');return}
 setFrames(targets,shape);closePanels();
}
function applyThemeLayout(){
 const rows=photos();if(!rows.length){notice('Add photos before arranging the page');return}snapshot();
 const layouts={1:[[180,115,540,405,0]],2:[[70,120,350,390,-3],[480,120,350,390,3]],3:[[55,70,430,350,-2],[535,80,300,235,3],[500,365,340,250,-3]],4:[[55,65,350,250,-3],[495,65,350,250,2],[55,360,350,250,2],[495,360,350,250,-2]]};
 const spots=layouts[Math.min(4,rows.length)]||layouts[4],themeShapes={'Wedding Romance':'vintage','Pet Memories':'oval','Happy Hour':'polaroid','Camping Under the Stars':'vintage','Christmas 🎄':'polaroid','Baby Keepsake':'oval'};
 rows.forEach((photo,i)=>{const [x,y,w,h,r]=spots[i%spots.length];Object.assign(photo,{x,y,w,h,r,z:i+2,shape:themeShapes[state.theme]||'none',borderWidth:8,border:'#fffaf2',shadow:18,glow:0,fit:'cover'})});
 renderStage();scheduleSave();closePanels();notice('Professional theme layout applied');
}
let noticeTimer=0;
function notice(text){const el=document.querySelector('#ss2-notice');if(!el)return;clearTimeout(noticeTimer);el.textContent=text;el.classList.add('show');noticeTimer=setTimeout(()=>el.classList.remove('show'),2400)}
async function saveDraft(){state.status='draft';state.title=String(state.title||'').trim()||defaultTitle(state.authorName);delete state.finalizedAt;const ok=await persist({force:true});if(ok){setStatus('Draft saved');notice(`Saved in My Drafts · by ${state.authorName}`)}else notice('Draft could not be saved — check storage and connection')}
async function finalizePage(){state.title=String(state.title||'').trim()||defaultTitle(state.authorName);state.status='final';state.finalizedAt=Date.now();const ok=await persist({force:true});if(ok){resetEditorState();render();notice(`Finalized · by ${state.authorName}`)}else{state.status='draft';notice('Page could not be finalized')}}
function bind(){
 renderController?.abort();renderController=new AbortController();const {signal}=renderController;
 const on=(target,type,fn,options={})=>target?.addEventListener(type,fn,{...options,signal});
 on(document.querySelector('#ss2-close'),'click',close);
 on(document.querySelector('#ss2-close-page'),'click',closePage);on(document.querySelector('#ss2-mclose-page'),'click',closePage);
 on(document.querySelector('#ss2-pages-back'),'click',hideDraftLibrary);on(document.querySelector('#ss2-pages-app'),'click',close);on(document.querySelector('#ss2-new-page'),'click',newPage);
 on(document.querySelector('#ss2-title'),'focus',e=>e.target.select());
 on(document.querySelector('#ss2-title'),'input',e=>{state.title=e.target.value;scheduleSave()});
 on(document.querySelector('#ss2-undo'),'click',undo);on(document.querySelector('#ss2-redo'),'click',redo);on(document.querySelector('#ss2-mundo'),'click',undo);on(document.querySelector('#ss2-mredo'),'click',redo);
 on(document.querySelector('#ss2-save'),'click',saveDraft);on(document.querySelector('#ss2-msave'),'click',saveDraft);
 on(document.querySelector('#ss2-finalize'),'click',finalizePage);on(document.querySelector('#ss2-mfinalize'),'click',finalizePage);
 on(document.querySelector('#ss2-photo'),'click',()=>{pendingShape='none';document.querySelector('#ss2-files').click()});
 on(document.querySelector('#ss2-files'),'change',handleFiles);
 on(document.querySelector('#ss2-text'),'click',()=>addTextPreset('plain'));on(document.querySelector('#ss2-emoji'),'click',()=>{const text=prompt('Enter emoji','😊');if(text)addSticker(text)});
 on(document.querySelector('#ss2-add-media'),'click',addMediaPhotos);
 document.querySelectorAll('[data-text-preset]').forEach(button=>on(button,'click',()=>addTextPreset(button.dataset.textPreset)));
 on(document.querySelector('#ss2-frame-all'),'change',e=>{frameAll=e.target.checked});
 document.querySelectorAll('[data-frame]').forEach(b=>on(b,'click',()=>applyFrame(b.dataset.frame)));
 document.querySelectorAll('[data-sticker]').forEach(b=>on(b,'click',()=>addSticker(b.dataset.sticker)));
 on(document.querySelector('#ss2-theme'),'change',e=>{snapshot();state.theme=e.target.value;renderStage();scheduleSave();closePanels()});
 on(document.querySelector('#ss2-theme-layout'),'click',applyThemeLayout);
 document.querySelectorAll('[data-panel]').forEach(b=>on(b,'click',()=>{const panel=document.querySelector(b.dataset.panel),wasOpen=panel?.classList.contains('open');closePanels();if(panel&&!wasOpen)panel.classList.add('open')}));
 document.querySelectorAll('.ss2-panel-close').forEach(b=>on(b,'click',closePanels));
 on(document.querySelector('#ss2-export'),'click',()=>{closePanels();document.querySelector('#ss2-export-menu').hidden=false});
 on(document.querySelector('#ss2-export-cancel'),'click',()=>{document.querySelector('#ss2-export-menu').hidden=true});
 document.querySelectorAll('[data-export-format]').forEach(button=>on(button,'click',()=>exportPage(button.dataset.exportFormat)));
}
async function handleFiles(e){
 const input=e.currentTarget;const files=[...input.files];const replaceId=input.dataset.replace||'';delete input.dataset.replace;input.value='';
 const shape=pendingShape||'none';pendingShape=null;if(!files.length)return;
 let uploaded=[];
 try{uploaded=await bridge()?.uploadPhotos?.(files)||[]}catch(error){console.warn('Media upload fallback',error);notice('Cloud upload unavailable · keeping photo in this draft')}
 if(replaceId){
  const target=state.objects.find(x=>x.id===replaceId);if(!target)return;
  snapshot();target.src=uploaded[0]?.url||await compressImage(files[0]);delete target.assetKey;target.name=uploaded[0]?.name||files[0].name||target.name||'';target.shape=shape;selected=target.id;renderStage();scheduleSave();return;
 }
 if(uploaded.length)uploaded.forEach((item,i)=>addPhotoUrl(item.url,item.name||files[i]?.name||'Photo',i,shape));
 else for(const file of files)await addPhoto(file,shape);
}
function buildExportStage(){
 const source=document.querySelector('#ss2-stage'),clone=source.cloneNode(true),host=document.createElement('div');
 clone.id='ss2-export-stage';clone.style.transform='none';clone.style.left='0';clone.style.top='0';clone.style.width='900px';clone.style.height='675px';clone.style.boxShadow='none';clone.dataset.scale='1';
 clone.querySelectorAll('.ss2-photo-number,.ss2-resize-handle,.ss2-delete-handle,.ss2-empty').forEach(el=>el.remove());
 clone.querySelectorAll('.ss2-object').forEach(el=>el.classList.remove('selected','multi-selected'));
 host.className='ss2-export-host';host.append(clone);document.body.append(host);return{host,clone};
}
async function waitForExportImages(clone){await Promise.all([...clone.querySelectorAll('img')].map(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve})))}
function safeFilename(){return String(state.title||'scrapbook').trim().replace(/[\\/:*?"<>|]+/g,'-')||'scrapbook'}
async function exportPage(format){
 const menu=document.querySelector('#ss2-export-menu'),editor=document.querySelector('.ss2');if(menu)menu.hidden=true;editor?.classList.add('exporting');setStatus('Exporting full page…');
 let host;
 try{
  const built=buildExportStage();host=built.host;await waitForExportImages(built.clone);
  const canvas=await html2canvas(built.clone,{scale:2,useCORS:true,backgroundColor:'#ffffff',width:900,height:675,windowWidth:900,windowHeight:675,scrollX:0,scrollY:0});
  if(canvas.width!==1800||canvas.height!==1350)throw new Error(`Unexpected export size ${canvas.width}×${canvas.height}`);
  const jpeg=canvas.toDataURL('image/jpeg',.94),name=safeFilename();
  if(format==='jpeg'){const a=document.createElement('a');a.href=jpeg;a.download=`${name}-10.3.7.jpg`;a.click();notice('Full-page JPEG saved')}
  else{const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('PDF library is unavailable');const pdf=new jsPDF({orientation:'landscape',unit:'px',format:[900,675],hotfixes:['px_scaling']});pdf.addImage(jpeg,'JPEG',0,0,900,675);pdf.save(`${name}-10.3.7.pdf`);notice('Full-page PDF saved')}
 }catch(e){console.warn('Scrapbook export',e);notice('Export failed — please try again')}finally{host?.remove();editor?.classList.remove('exporting');setStatus('Saved')}
}
function shouldOpen(){return location.hash.replace(/^#/,'').split('/')[0]==='scrapbook-editor'}
async function open(){if(document.querySelector('.ss2'))return;closing=false;state=await load();resetEditorState();render()}
async function openPage(pageId,{ownerUid=''}={}){window.__ss2OwnerUid=ownerUid;if(document.querySelector('.ss2'))document.querySelector('.ss2').remove();closing=false;state=await load(pageId);resetEditorState();render()}
async function close(){if(closing)return;closing=true;await persist({force:true});renderController?.abort();renderController=null;document.querySelector('.ss2')?.remove();document.body.classList.remove('ss2-open');if(location.hash.startsWith('#scrapbook'))location.hash='#home';closing=false}
window.addEventListener('resize',()=>{if(document.querySelector('.ss2'))fit()},{passive:true});
window.visualViewport?.addEventListener('resize',()=>{if(document.querySelector('.ss2'))fit()},{passive:true});
window.addEventListener('orientationchange',()=>requestAnimationFrame(fit),{passive:true});
window.addEventListener('hashchange',()=>{if(shouldOpen())open();else if(document.querySelector('.ss2'))close()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&state)persist({force:true})});
window.addEventListener('pagehide',()=>{if(state)persist({force:true})});
if(shouldOpen())setTimeout(open,50);
window.ScrapbookStudio2={open,newPage,openPage,version:V,save:()=>persist({force:true})};
})();
