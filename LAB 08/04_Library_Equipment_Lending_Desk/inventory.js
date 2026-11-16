const fs=require("fs/promises"),path=require("path");
const FILE=path.join(__dirname,"data","inventory.json");
async function readInventory(){return JSON.parse(await fs.readFile(FILE,"utf8"));}
async function saveInventory(items){await fs.writeFile(FILE,JSON.stringify(items,null,2),"utf8");}
async function createLoan(id,quantity){
 if(!Number.isInteger(quantity)||quantity<=0)throw Error("Quantity must be a positive whole number.");
 const items=await readInventory(),item=items.find(x=>x.id===id);
 if(!item)throw Error("Item does not exist.");
 if(item.quantity<quantity)throw Error("Not enough stock.");
 item.quantity-=quantity;await saveInventory(items);
 return {item:item.name,loaned:quantity,remaining:item.quantity};
}
module.exports={readInventory,saveInventory,createLoan};
