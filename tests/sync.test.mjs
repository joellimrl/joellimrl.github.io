import test from 'node:test';
import assert from 'node:assert/strict';
import { syncProjects } from '../scripts/sync-projects.mjs';
import { validateManifest } from '../js/manifest.mjs';

const repo=(name,extra={})=>({name,owner:{login:'joellimrl'},has_pages:true,private:false,pushed_at:'2026-09-15T00:00:00Z',language:'HTML',...extra});
const reply=(data,status=200,url='')=>({ok:status>=200&&status<300,status,url,json:async()=>data});

test('sync discovers all owned public Pages sites and resolves custom-domain redirects without leaking API authorization',async()=>{
  const fetcher=async(url,options)=>{
    if(url.startsWith('https://api.github.com/')) {
      assert.equal(options.headers.Authorization,'Bearer test-credential');
      return reply([repo('joellimrl.github.io'),repo('private',{private:true}),repo('disabled',{has_pages:false}),repo('custom',{homepage:'https://unrelated.example'}),repo('other',{owner:{login:'other'}})]);
    }
    assert.equal(options.headers?.Authorization,undefined);
    assert.equal(url,'https://joellimrl.github.io/custom/');
    return reply(null,200,'https://custom.example/');
  };
  const result=await syncProjects({fetcher,token:'test-credential',now:new Date('2026-09-15T00:17:00Z')});
  assert.equal(result.projects.length,1);
  assert.equal(result.projects[0].url,'https://custom.example/');
  assert.equal(result.generatedAt,'2026-09-15T00:17:00.000Z');
  assert.equal(JSON.stringify(result).includes('test-credential'),false);
  assert.equal(validateManifest(result),result);
});

test('sync includes repositories beyond the first page and skips sites that have not published',async()=>{
  const fetcher=async url=>{
    if(url.startsWith('https://api.github.com/'))return reply(new URL(url).searchParams.get('page')==='1'?Array.from({length:100},(_,i)=>repo(`unpublished${i}`,{has_pages:false})):[repo('newApp'),repo('notYet')]);
    return reply(null,url.includes('notYet')?404:200,url);
  };
  const result=await syncProjects({fetcher});
  assert.deepEqual(result.projects.map(p=>p.name),['newApp']);
});

test('transient URL failure aborts publication rather than losing existing projects',async()=>{
  await assert.rejects(syncProjects({fetcher:async url=>url.startsWith('https://api.github.com/')?reply([repo('existing')]):reply(null,503,url)}),/503/);
});

test('a failed later API page never produces a partial manifest',async()=>{
  await assert.rejects(syncProjects({fetcher:async url=>reply(Array.from({length:100},(_,i)=>repo(`r${i}`)),new URL(url).searchParams.get('page')==='1'?200:403)}),/403/);
});

test('successful empty discovery clears removed sites',async()=>{
  assert.deepEqual((await syncProjects({fetcher:async()=>reply([])})).projects,[]);
});

test('manifest rejects invalid timestamps, unexpected data and unsafe destinations',()=>{
  assert.throws(()=>validateManifest({version:1,generatedAt:'wrong',projects:[]}),/manifest/i);
  assert.throws(()=>validateManifest({version:1,generatedAt:new Date().toISOString(),projects:[{name:'bad',title:'Bad',description:'',language:'HTML',url:'javascript:alert(1)',code:'https://github.com/joellimrl/bad'}]}),/manifest/i);
});
