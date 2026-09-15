import { discoverProjects, fetchRepositories, readCache, saveCache, MAX_AGE } from './feed.mjs';

const presentation = {
  auditionClone: ['Audition Clone','A rhythm game for your next keyboard break.','rhythm','← ↓ ↑ →'],
  sportsCalendar: ['Sports Calendar','Keep the next match on your radar.','calendar','15'],
  parkingCalculator: ['Parking Calculator','A little less guesswork at the car park.','parking','P'],
  webTools: ['Web Tools','Small tools for the everyday browser workflow.','tools','{ }'],
  geologicalTimescale: ['Geological Timescale','Explore the chapters of Earth’s history.','earth','4.6B'],
  weightTracker: ['Weight Tracker','A space to keep track of your progress.','weight','↗'],
  spendingsReport: ['Spendings Report','Make a little more sense of your spending.','spend','＋'],
  worldCup2026: ['World Cup 2026','Follow the world’s biggest football tournament.','football','⚽'],
  japan2026: ['Japan 2026','Notes and memories from a Japanese adventure.','japan','日本'],
  ultimateTicTacToe: ['Ultimate Tic Tac Toe','Nine boards. A whole new way to think ahead.','game','× ○'],
  unixClock: ['Unix Clock','A clock for humans and computers.','clock','00:00'],
  irasHelper: ['IRAS Helper','A helper for repetitive tax form workflows.','tools','∑'],
  luckyDraw: ['Lucky Draw','Make the next name out of the hat a moment.','draw','★'],
  ticTacToeSimple: ['Tic Tac Toe','One familiar grid. One more round.','game','○ ×'],
  leftOrRight: ['Left or Right','A simple choice that gets the whole room playing.','rhythm','← →'],
};
let projects = [], category = 'All';
const grid = document.querySelector('#projects');
const search = document.querySelector('#search');
const sort = document.querySelector('#sort');
const status = document.querySelector('#feed-status');
const refresh = document.querySelector('#refresh');
function el(tag, className, text) { const node=document.createElement(tag); node.className=className; if(text!==undefined)node.textContent=text; return node; }
function link(label,url,className) { const a=el('a',className,label); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; return a; }
function render() {
  const query=search.value.trim().toLowerCase();
  const visible=projects.filter(p => (category==='All'||p.language===category) && `${p.title} ${p.name} ${p.description} ${p.language}`.toLowerCase().includes(query));
  if(sort.value==='name')visible.sort((a,b)=>a.title.localeCompare(b.title));
  grid.replaceChildren();
  document.querySelector('#result-count').textContent=`${visible.length} ${visible.length===1?'project':'projects'}`;
  for(const p of visible) {
    const custom=presentation[p.name];
    const title=p.title;
    const article=el('article','project');
    const art=link('',p.url,`art ${custom?.[2]||'default-art'}`);
    art.setAttribute('aria-label',`Open ${title}`);
    art.append(el('span','art-symbol',custom?.[3]||title.slice(0,2)));
    art.append(el('span','art-caption',title));
    const content=el('div','project-content');
    const meta=el('div','project-meta');
    meta.append(el('span','language',p.language),el('span','project-state',p.archived?'Archived':'GitHub Pages'));
    const heading=el('h3',''); heading.append(link(title,p.url,''));
    content.append(meta,heading,el('p','description',p.description));
    const actions=el('div','project-actions');
    actions.append(link('Open project ↗',p.url,'open-project'),link('Source',p.code,'source'));
    content.append(actions);article.append(art,content);grid.append(article);
  }
  document.querySelector('#empty').hidden=visible.length>0;
}
function populate(repositories) {
  projects=discoverProjects(repositories).map(project=>{
    const custom=presentation[project.name];
    const title=custom?.[0]||project.title;
    return {...project,title,description:project.description||custom?.[1]||`Explore ${title}, a web project by Joel Lim.`};
  });
  document.querySelectorAll('[data-total]').forEach(n=>n.textContent=projects.length);
  const filters=document.querySelector('#filters');filters.replaceChildren();
  const languages=['All',...new Set(projects.map(p=>p.language).sort())];
  if(!languages.includes(category))category='All';
  for(const language of languages) {
    const button=el('button','filter',language==='All'?'All projects':language);button.type='button';
    button.setAttribute('aria-pressed',String(category===language));
    button.addEventListener('click',()=>{category=language;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));button.setAttribute('aria-pressed','true');render();});
    filters.append(button);
  }
  render();
}
function timestamp(value) {return new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
async function update(force=false) {
  refresh.disabled=true;
  const cache=readCache();
  if(!force&&cache) {
    populate(cache.repositories);
    status.textContent=`Saved feed · ${timestamp(cache.savedAt)}`;
    if(Date.now()-cache.savedAt<MAX_AGE){refresh.disabled=false;return;}
  }
  status.textContent='Checking GitHub for projects…';
  try {
    const repositories=await fetchRepositories();
    const saved=saveCache(repositories);populate(repositories);
    status.textContent=`Updated from GitHub · ${timestamp(saved.savedAt)}`;
  } catch {
    status.textContent=projects.length ? 'GitHub unavailable. Showing saved projects; try Refresh later.' : 'Projects could not load. Try Refresh or visit GitHub.';
  } finally {refresh.disabled=false;}
}
search.addEventListener('input',render);sort.addEventListener('change',render);
refresh.addEventListener('click',()=>update(true));
document.querySelector('#clear-search').addEventListener('click',()=>{
  search.value='';category='All';
  document.querySelectorAll('#filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent==='All projects')));
  render();search.focus();
});
document.querySelector('#surprise')?.addEventListener('click',()=>{
  if(!projects.length)return;
  const p=projects[Math.floor(Math.random()*projects.length)];
  const dialog=document.querySelector('#surprise-dialog');
  dialog.querySelector('h2').textContent=presentation[p.name]?.[0]||p.title;
  dialog.querySelector('a').href=p.url;dialog.showModal();
});
try {
  const response=await fetch('../shared/projects.json');
  if(!response.ok)throw new Error();
  const snapshot=await response.json();populate(snapshot.repositories);
} catch { /* The live request below can recover a missing snapshot. */ }
await update();
