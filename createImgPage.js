const fs=require('fs')
fs.readdir("screenshots",async (err,files)=>{
    if(err){console.log("Error While detecting Screenshots folder"); return null}
    let start='<html><body>\n'
    let end='</body></html>'
    fs.writeFile('screenshots.html',start,(err)=>{if(err)throw err})
    for(let x of files){
        await fs.appendFile('screenshots.html',`<img src=screenshots/${x}></img>\n`,(err)=>{if(err) throw err})
    }
    console.log(files.length+' Image Files Found')
    await fs.appendFile('screenshots.html',end,(err)=>{if(err) throw err})
})
