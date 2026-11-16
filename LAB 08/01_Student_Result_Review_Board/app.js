const students=[
{id:1,name:"Ayesha Khan",marks:86},{id:2,name:"Ali Ahmed",marks:42},
{id:3,name:"Sara Malik",marks:73},{id:4,name:"Hamza Shah",marks:31},
{id:5,name:"Noor Fatima",marks:91},{id:6,name:"Usman Tariq",marks:58}
];
const PASS_MARK=50, list=document.querySelector("#students"), message=document.querySelector("#message");
const valid=n=>Number.isFinite(n)&&n>=0&&n<=100;
function summary(){
 const good=students.filter(s=>valid(s.marks)), passed=good.filter(s=>s.marks>=PASS_MARK).length;
 const avg=good.length?good.reduce((sum,s)=>sum+s.marks,0)/good.length:0;
 document.querySelector("#total").textContent=students.length;
 document.querySelector("#pass").textContent=passed;
 document.querySelector("#fail").textContent=good.length-passed;
 document.querySelector("#average").textContent=avg.toFixed(1)+"%";
}
function render(){
 const q=document.querySelector("#search").value.toLowerCase().trim(), f=document.querySelector("#filter").value;
 const shown=students.filter(s=>s.name.toLowerCase().includes(q)&&(f==="all"||(f==="pass"&&valid(s.marks)&&s.marks>=50)||(f==="fail"&&valid(s.marks)&&s.marks<50)));
 list.innerHTML="";
 if(!shown.length){list.innerHTML='<p class="empty">No students match your search.</p>';return;}
 shown.forEach(s=>{
  const ok=valid(s.marks), status=!ok?"Invalid mark":s.marks>=50?"Passing":"Failing";
  const card=document.createElement("article");card.className="student";
  card.innerHTML='<div><h3></h3><small></small></div><input type="number" min="0" max="100"><b></b>';
  card.querySelector("h3").textContent=s.name;card.querySelector("small").textContent="ID: "+s.id;
  const field=card.querySelector("input");field.value=ok?s.marks:"";
  const label=card.querySelector("b");label.textContent=status;label.className=ok&&s.marks>=50?"pass":"fail";
  field.addEventListener("change",()=>{
   const n=Number(field.value);
   if(field.value.trim()===""||!valid(n)){message.textContent="Enter a mark from 0 to 100. Stored mark was not changed.";field.value=ok?s.marks:"";return;}
   s.marks=n;message.textContent=s.name+"'s marks updated.";summary();render();
  });list.append(card);
 });
}
document.querySelector("#search").addEventListener("input",render);
document.querySelector("#filter").addEventListener("change",render);
summary();render();
