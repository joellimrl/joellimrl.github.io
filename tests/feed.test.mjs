import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverProjects, fetchRepositories } from '../prototypes/shared/feed.mjs';

const repo = (name, extra = {}) => ({name, owner:{login:'joellimrl'}, has_pages:true, private:false, language:'HTML', pushed_at:'2026-01-01T00:00:00Z', ...extra});

test('discovers all Pages projects, excluding the portfolio and private or unpublished repos', () => {
  const projects = discoverProjects([repo('newProject'),repo('joellimrl.github.io'),repo('private',{private:true}),repo('unpublished',{has_pages:false}),repo('fork',{fork:true}),repo('archived',{archived:true})]);
  assert.deepEqual(projects.map(p=>p.name), ['archived','fork','newProject']);
  assert.equal(projects.find(p=>p.name==='newProject').url,'https://joellimrl.github.io/newProject/');
});

test('does not use arbitrary homepages as deployment URLs; preserves case and humanizes names', () => {
  const [p] = discoverProjects([repo('myNewApp',{homepage:'javascript:alert(1)'})]);
  assert.equal(p.title,'My New App');
  assert.equal(p.url,'https://joellimrl.github.io/myNewApp/');
});

test('pagination includes projects beyond the first 100 repos', async () => {
  const fetcher = async url => ({ok:true,json:async()=>new URL(url).searchParams.get('page')==='1' ? Array.from({length:100},(_,i)=>repo(`p${i}`)) : [repo('last')]});
  assert.equal((await fetchRepositories('joellimrl',fetcher)).length,101);
});

test('failed later pages reject the entire refresh instead of deleting cached projects', async () => {
  const fetcher = async url => new URL(url).searchParams.get('page')==='1' ? {ok:true,json:async()=>Array.from({length:100},(_,i)=>repo(`p${i}`))} : {ok:false,status:403};
  await assert.rejects(fetchRepositories('joellimrl',fetcher), /403/);
});

test('empty account returns an empty list', async () => {
  assert.deepEqual(await fetchRepositories('joellimrl',async()=>({ok:true,json:async()=>[]})),[]);
});
