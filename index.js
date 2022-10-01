const puppeteer = require('puppeteer');
const fs=require("fs");
let count=0
let visited=0


const fetchtargets=()=>{
    let list=[]
    try{let x=fs.readFileSync(process.argv[2],'utf8')}
    catch(err){if(err.code=="ENOENT"){console.log("FILE "+process.argv[2]+" NOT FOUND");process.exit()}else throw err}
    let x=fs.readFileSync(process.argv[2],"utf8")
    for(i of x.split('\n')){
        if(i!==''){
            list.push(i)
        }
    }
    return list
}

const saveHeaders=async(request)=>{
    const line="--------------------------------------------------"
    const headers=await request.response().headers()
    let blacklist=['age','date','expires']
    const url=request.url().split("?")[0].replace(/\//g,'\u2215')
    await fs.appendFile("headers/"+url,line+"\n"+request.url()+"\n"+line+"\n",(error)=>{if(error){throw error}})
    for(x in headers){
        let match=false
        for(i of blacklist){
            if(i==x){match=true}
        }
        if(!match){ await fs.appendFile("headers/"+url,x+":"+headers[x]+"\n",(error)=>{if(error){throw error}})

        }
    }

}

const noteUri=async (url,file)=>{
    await fs.appendFile(file,url+"\n",(error)=>
    {if(error){throw error}
})}

const saveResponse=async (request,folder)=>{
    const line="--------------------------------------------------\n"
    let filename=request.url().split("?")[0].replace(/\//g,'\u2215')
    let response=await request.response().text()
    if(response==null || response==""){return null}
    //await fs.writeFile(folder+"/"+filename,line+request.url()+'\n'+line,(err)=>{if(err) throw err})
    await fs.writeFile(folder+"/"+filename,line+request.url()+'\n'+line+response,(err)=>{if(err) throw err})
}

const makefolders=async ()=>{
    const folders=["html","other","headers","js","screenshots","noContentType"]
    for(let i of folders){
    await fs.mkdir(i,(err)=>{
        if(err!=null){
        
        if(err.code=="EEXIST"){}
        else throw err}
    })}
    }

const sortContent=async(request)=>{
 let url=request.url()
 let type=null
 let intresting=false
 let flag=await request.response().headers()["content-type"]
 if(!flag){noteUri(await request.url(),"wierd.txt");return null}
 if(flag.includes("javascript")){type="js"}
 else if(flag.includes("xhtml+xml")){type="other",intresting=true}
 else if(flag.includes("json")){intresting=true;type="other"}
 else if(flag.includes("csv")){intresting=true;type="other"}
 else if(flag.includes("html")){type="html"}
 else if(flag.includes("x-7z-compressed")){type="other",intresting=true}
 else if(flag.includes("zip")){type="other",intresting=true}

  if(type && request){
     await saveResponse(request,type)
 }

  if(intresting){
     await noteUri(request.url(),"intresting.txt")
 }
  await noteUri(request.url(),"all-urls.txt")
  await saveHeaders(request)
}


const main =async () => {
  const list=fetchtargets()
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("requestfinished",async (request)=>{
        count++
      if(!await request.response().headers()['location']){
          if(!request.url().match(/^https?\:\/\//)){ if(await request.url().match(/^data\:image/)){return null} else {noteUri(request.url()+"    ->NON HTTP","wierd.txt")}}
          else { await sortContent(request)}
  }})
  for(let i of list){
     await page.goto(i); 
     visited++
     console.log(visited +'/'+list.length+'\t'+i)
     await page.screenshot({path:"./screenshots/"+i.replace(/\//g,'\u2215')+".png" })
     if((visited/list.length)==1){setTimeout(()=>{browser.close();
        console.log("----->",count,'Requests Intercepted'+'From',list.length,'Hosts')},5000)}
    
 }

 
}

if((process.argv.length<=2) || process.argv[2]=="-h"){
    console.log("Specify the targets file as argument\n      Example: node index.js targets.txt")
    process.exit()
} 

makefolders()
main()
