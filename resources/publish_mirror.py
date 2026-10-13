#!/usr/bin/env python3
"""Run on GitHub Actions with its repository-scoped token, not cloud credentials."""
import concurrent.futures,hashlib,json,pathlib,subprocess,time,urllib.request,urllib.error

REPO='Yamiko-Kyuka/Yamiko-Kyuka-Brave-Exvius-Survivor-Downloads'
ROOT=pathlib.Path.cwd()

def gh(*args):
    p=subprocess.run(['gh',*args],text=True,capture_output=True)
    if p.returncode:raise RuntimeError(p.stderr.strip())
    return p.stdout
def api(endpoint):return json.loads(gh('api',endpoint))
def assets(release):
    result=[];page=1
    while True:
        batch=api(f'repos/{REPO}/releases/{release}/assets?per_page=100&page={page}')
        result.extend(batch)
        if len(batch)<100:return {a['name']:a for a in result}
        page+=1

def main():
    entries=json.loads((ROOT/'resources/source-manifest.json').read_text())
    folder=ROOT/'mirror-cache';folder.mkdir(exist_ok=True)
    mirrors=[]
    for tag,items in [('resources-v1-a',entries[:800]),('resources-v1-b',entries[800:])]:
        release=next(r for r in api('repos/'+REPO+'/releases?per_page=100') if r['tag_name']==tag)
        existing=assets(release['id'])
        def upload(entry):
            name=pathlib.Path(entry['file']).name
            if name in existing:
                a=existing[name]
                if a['size']!=entry['bytes'] or a.get('digest')!='sha256:'+entry['sha256']:raise RuntimeError('Remote hash mismatch: '+name)
                return
            target=folder/name;last=None
            for attempt in range(4):
                try:
                    request=urllib.request.Request('https://www.spriters-resource.com'+entry['url'],headers={'User-Agent':'BraveExviusSurvivor-AssetImport/0.5.8','Accept-Encoding':'identity','Referer':'https://www.spriters-resource.com'+entry['page']})
                    digest=hashlib.sha256();received=0
                    with urllib.request.urlopen(request,timeout=90) as response,target.open('wb') as out:
                        while block:=response.read(1024*1024):
                            received+=len(block)
                            if received>entry['bytes']:raise RuntimeError('Unexpected resource size: '+name)
                            digest.update(block);out.write(block)
                    if received!=entry['bytes'] or digest.hexdigest()!=entry['sha256']:raise RuntimeError('Source SHA-256 mismatch: '+name)
                    gh('release','upload',tag,str(target),'--repo',REPO)
                    target.unlink();return
                except Exception as error:
                    last=error
                    if attempt<3:time.sleep(3*2**attempt)
            raise last
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for count,_ in enumerate(pool.map(upload,items),1):
                if count%25==0 or count==len(items):print(f'{tag}: {count}/{len(items)} verified resources',flush=True)
        verified=assets(release['id'])
        for e in items:
            name=pathlib.Path(e['file']).name;a=verified[name]
            if a['size']!=e['bytes'] or a.get('digest')!='sha256:'+e['sha256']:raise RuntimeError('Published SHA-256 mismatch: '+name)
            mirrors.append({'file':e['file'],'bytes':e['bytes'],'sha256':e['sha256'],'mirrorUrl':a['browser_download_url']})
        if release['draft']:gh('release','edit',tag,'--repo',REPO,'--draft=false','--latest=false')
    (ROOT/'resources/mirror-manifest.json').write_text(json.dumps(mirrors,indent=2)+'\n')
    gh('api',f'repos/{REPO}/contents/resources/mirror-manifest.json','--method','PUT','--input',str(write_request(mirrors)))
    print('All 1226 archives publicly published with their original SHA-256.',flush=True)

def write_request(records):
    import base64
    content=(json.dumps(records,indent=2)+'\n').encode()
    request={'message':'Publish SHA-256 verified resource mirror manifest','branch':'gh-pages','content':base64.b64encode(content).decode()}
    try:request['sha']=api(f'repos/{REPO}/contents/resources/mirror-manifest.json?ref=gh-pages')['sha']
    except RuntimeError as error:
        if '404' not in str(error):raise
    file=ROOT/'mirror-manifest-request.json';file.write_text(json.dumps(request));return file

if __name__=='__main__':
    try:main()
    except Exception as error:
        import base64
        data=json.dumps({'status':'failed','error':str(error)})+'\n'
        request={'message':'Record resource mirror diagnostic','branch':'gh-pages','content':base64.b64encode(data.encode()).decode()}
        try:request['sha']=api(f'repos/{REPO}/contents/resources/mirror-status.json?ref=gh-pages')['sha']
        except RuntimeError:pass
        file=ROOT/'mirror-status-request.json';file.write_text(json.dumps(request))
        gh('api',f'repos/{REPO}/contents/resources/mirror-status.json','--method','PUT','--input',str(file))
        raise
