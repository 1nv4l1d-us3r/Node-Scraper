const puppeteer = require('puppeteer');
const fs=require("fs");
const url=require('url')
let count=0
let visited=0
let errcount=0


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
const saveHeaders=async(request,location)=>{
    const line="--------------------------------------------------"
    const headers=await request.response().headers()
    let blacklist=['age','date','expires']
    let iurl=new URL(request.url())
    let path=btoa(iurl.pathname.replace(/\/$/,'')).replace(/=*$/,'')
    let filename= (path)?iurl.host+path:iurl.host
  await fs.appendFile(location+"/"+filename,line+"\n"+request.url()+"\n"+line+"\n",(error)=>{if(error){throw error}})
    for(x in headers){
        let match=false
        for(i of blacklist){
            if(i==x){match=true}
        }
        if(!match){ await fs.appendFile(location+"/"+filename,x+":"+headers[x]+"\n",(error)=>{if(error){throw error}})

        }
    }

}


const saveRoots=async(request) =>{
    await saveResponse(request,"roots")
    await saveHeaders(request,"headers") 

}


const noteUri=async (url,file)=>{
    await fs.appendFile(file,url+"\n",(error)=>
    {if(error){throw error}
})}

const saveResponse=async (request,folder)=>{
    const line="--------------------------------------------------\n"
    let iurl=new URL(request.url())
    let path=btoa(iurl.pathname.replace(/\/$/,'')).replace(/=*$/,'')
    let filename= (path)?iurl.host+path:iurl.host
    let response=await request.response().text()
    if(response==null || response==""){return null}
    //await fs.writeFile(folder+"/"+filename,line+request.url()+'\n'+line,(err)=>{if(err) throw err})
    await fs.writeFile(folder+"/"+filename,line+request.url()+'\n'+line+response,(err)=>{if(err){if(err.code=="ENAMETOOLONG"){noteUri('<--Too Long-->  '+request.url(),"wierd.txt")} else throw err}})
}


const makefolders=async ()=>{
    const folders=["resources","resources/html-files","resources/headers","roots","other","headers","js","screenshots","noContentType"]
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
 else if(flag.includes("html")){type="resources/html-files"}
 else if(flag.includes("x-7z-compressed")){type="other",intresting=true}
 else if(flag.includes("zip")){type="other",intresting=true}

  if(type && request){
     await saveResponse(request,type)
 }

  if(intresting){
     await noteUri(request.url(),"intresting.txt")
 }
  await noteUri(request.url(),"all-urls.txt")
  await saveHeaders(request,"resources/headers")
}

const main =async () => {
  const list=fetchtargets()
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const checkAndExit=()=>{
    if((visited/list.length)==1){setTimeout(()=>{browser.close();
        console.log("----->",count,'Requests Intercepted '+'From',list.length,'Hosts')},5000)}
    }

  page.on("requestfinished",async (request)=>{
        count++
      if(!await request.response().headers()['location']){
          if(!request.url().match(/^https?\:\/\//)){ if(await request.url().match(/^data\:image/)){return null} else {noteUri(request.url()+"    ->NON HTTP","wierd.txt")}}
          else { await sortContent(request)}
          if(request.url()==page.url()){await saveRoots(request)}
  }})
  for(let i of list){
     visited++
      
     try {await page.goto(i)}
     catch(err){if(err){errcount++;noteUri(i,".errors.txt");await checkAndExit();continue}}
     
     console.log(Math.floor(visited/list.length*100)+"%"+'   '+i)
     await page.screenshot({path:"./screenshots/"+i.split(':')[1].slice(2)+".png" })
     await checkAndExit()
    
     }

 
}

if((process.argv.length<=2) || process.argv[2]=="-h"){
    console.log("Specify the targets file as argument\n      Example: node index.js targets.txt")
    process.exit()
} 

makefolders()
main()
