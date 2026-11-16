const {SMTPServer}=require("smtp-server");
const server=new SMTPServer({authOptional:true,disabledCommands:["AUTH"],onData(stream,session,callback){
 let mail="";stream.on("data",chunk=>mail+=chunk.toString());
 stream.on("end",()=>{console.log("\n===== LOCAL SMTP EMAIL =====\n"+mail+"\n===== END EMAIL =====\n");callback(null,"Received locally");});
}});
server.listen(1025,"127.0.0.1",()=>console.log("Local SMTP receiver on 127.0.0.1:1025"));
