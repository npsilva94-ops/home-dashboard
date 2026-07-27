(function(){
var DB="https://home-dashboard-61d63-default-rtdb.europe-west1.firebasedatabase.app";
var state={shopping:{},tasks:{},events:{},menu:{},expenses:{}};
function el(x){return document.getElementById(x)}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function req(method,path,data,cb){
 var x=new XMLHttpRequest(); x.onreadystatechange=function(){if(x.readyState===4){if(x.status>=200&&x.status<300){el("sync").className="sync ok";el("sync").innerHTML="●";if(cb)cb(x.responseText)}else{el("sync").className="sync bad";el("sync").innerHTML="●"}}};
 x.open(method,DB+"/"+path+".json",true);x.setRequestHeader("Content-Type","application/json");x.send(data===null?null:JSON.stringify(data));
}
function id(){return "i"+(new Date().getTime())+"_"+Math.floor(Math.random()*100000)}
function loadAll(){req("GET","dashboard",null,function(t){try{var d=JSON.parse(t)||{};state.shopping=d.shopping||{};state.tasks=d.tasks||{};state.events=d.events||{};state.menu=d.menu||{};render()}catch(e){}})}
function renderList(target,obj,type){var a=[],k;for(k in obj)if(obj.hasOwnProperty(k))a.push({id:k,t:obj[k].text||"",done:!!obj[k].done});var o="";for(var i=0;i<a.length;i++)o+='<div class="row '+(a[i].done?"done":"")+'"><input class="check" type="checkbox" data-type="'+type+'" data-id="'+a[i].id+'" '+(a[i].done?"checked":"")+'><span class="txt">'+esc(a[i].t)+'</span><button class="remove" data-remove="'+type+'" data-id="'+a[i].id+'">×</button></div>';el(target).innerHTML=o}
function niceDate(s){var p=s.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]),ds=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],ms=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];return ds[d.getDay()]+", "+d.getDate()+" "+ms[d.getMonth()]}
function addDays(date,n){var d=new Date(date.getFullYear(),date.getMonth(),date.getDate()+n);return d}
function isoDate(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function occurrences(e,limit){
 var out=[],p=e.date.split("-"),base=new Date(+p[0],+p[1]-1,+p[2]),now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),i,d;
 if(!e.repeat||e.repeat==="none"){if(base>=today)out.push({date:e.date,time:e.time,text:e.text,who:e.who,_id:e._id,repeat:"none"});return out}
 if(e.repeat==="weekly"){
   for(i=0;i<104;i++){d=addDays(base,i*7);if(d>=today)out.push({date:isoDate(d),time:e.time,text:e.text,who:e.who,_id:e._id,repeat:"weekly"});if(out.length>=limit)break}
 }
 if(e.repeat==="monthly"){
   for(i=0;i<36;i++){d=new Date(base.getFullYear(),base.getMonth()+i,base.getDate());if(d.getDate()!==base.getDate())continue;if(d>=today)out.push({date:isoDate(d),time:e.time,text:e.text,who:e.who,_id:e._id,repeat:"monthly"});if(out.length>=limit)break}
 }
 return out
}
function renderEvents(){
 var source=[],k,i,j,a=[],e,oc;
 for(k in state.events)if(state.events.hasOwnProperty(k)){e=state.events[k];e._id=k;source.push(e)}
 for(i=0;i<source.length;i++){oc=occurrences(source[i],12);for(j=0;j<oc.length;j++)a.push(oc[j])}
 a.sort(function(x,y){return(x.date+x.time).localeCompare(y.date+y.time)});
 if(a.length>30)a=a.slice(0,30);
 var o="",last="",rep;
 for(i=0;i<a.length;i++){
  if(a[i].date!==last){last=a[i].date;o+='<div class="eventDate">'+niceDate(last)+'</div>'}
  rep=a[i].repeat==="weekly"?"↻ semanal":a[i].repeat==="monthly"?"↻ mensal":"";
  o+='<div class="event"><span class="time">'+esc(a[i].time)+'</span><span class="dot '+esc(a[i].who)+'"></span><span>'+esc(a[i].text)+'</span>'+(rep?'<span class="repeatBadge">'+rep+'</span>':'')+'<button class="editEvent" data-edit-event="'+a[i]._id+'">✎</button><button class="remove" data-remove="events" data-id="'+a[i]._id+'">×</button></div>'
 }
 el("events").innerHTML=o||'<div style="padding:20px;color:#777">Sem eventos futuros.</div>'
}

var menuDays=[["mon","Segunda"],["tue","Terça"],["wed","Quarta"],["thu","Quinta"],["fri","Sexta"],["sat","Sábado"],["sun","Domingo"]];
function renderMenu(){
 var box=el("weeklyMenu"),o="",i,key,val;
 for(i=0;i<menuDays.length;i++){key=menuDays[i][0];val=state.menu[key]||"";o+='<div class="menuDay"><b>'+menuDays[i][1]+'</b><textarea data-menu="'+key+'" placeholder="Ementa…">'+esc(val)+'</textarea></div>'}
 box.innerHTML=o
}
function saveMenu(target){var key=target.getAttribute("data-menu");if(!key)return;state.menu[key]=target.value;req("PUT","dashboard/menu/"+key,target.value)}
function renderCore(){renderList("shopping",state.shopping,"shopping");renderList("tasks",state.tasks,"tasks");renderEvents();renderMenu()}
document.body.onclick=function(e){var ee=e.target.getAttribute("data-edit-expense"),ed=e.target.getAttribute("data-delete-expense");if(ee){openEditExpense(ee);return}if(ed){if(state.expenses&&state.expenses[ed]){delete state.expenses[ed];req("DELETE","dashboard/expenses/"+ed);renderExpenses()}return}var t=e.target,edit=t.getAttribute("data-edit-event"),type=t.getAttribute("data-type"),rid=t.getAttribute("data-id"),rem=t.getAttribute("data-remove");if(edit){openEditEvent(edit);return;}if(type&&t.type==="checkbox"){var v=!!t.checked;state[type][rid].done=v;req("PATCH","dashboard/"+type+"/"+rid,{done:v});render()}if(rem){delete state[rem][rid];req("DELETE","dashboard/"+rem+"/"+rid,null);render()}};
document.body.onchange=function(e){var t=e.target;if(t&&t.getAttribute("data-menu"))saveMenu(t)};
function render(){renderCore();if(document.getElementById("expenseList"))renderExpenses()}

function bindAdd(form,input,type){el(form).onsubmit=function(e){e.preventDefault();var x=el(input),v=x.value.replace(/^\s+|\s+$/g,"");if(v){var k=id(),item={text:v,done:false};state[type][k]=item;req("PUT","dashboard/"+type+"/"+k,item);x.value="";render()}return false}}
bindAdd("shoppingForm","shoppingInput","shopping");bindAdd("taskForm","taskInput","tasks");
function pad(n){return n<10?"0"+n:""+n}
function fillSelects(){var d=new Date(),i;for(i=1;i<=31;i++)el("day").options.add(new Option(i,i));var mons=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];for(i=0;i<12;i++)el("month").options.add(new Option(mons[i],i+1));for(i=d.getFullYear();i<=d.getFullYear()+4;i++)el("year").options.add(new Option(i,i));for(i=0;i<24;i++)el("hour").options.add(new Option(pad(i),pad(i)));for(i=0;i<60;i+=5)el("minute").options.add(new Option(pad(i),pad(i)));el("day").value=d.getDate();el("month").value=d.getMonth()+1;el("year").value=d.getFullYear();el("hour").value=pad(d.getHours());el("minute").value="00"}
fillSelects();var modal=el("modal");
function resetEventForm(){
 el("editEventId").value="";
 el("eventModalTitle").innerHTML="Novo evento";
 el("saveEvent").innerHTML="Guardar evento";
 el("eventText").value="";
 el("repeat").value="none";
 el("who").value="maryli";
 var d=new Date();
 el("day").value=d.getDate();el("month").value=d.getMonth()+1;el("year").value=d.getFullYear();el("hour").value=pad(d.getHours());el("minute").value="00"
}
function openEditEvent(k){
 var e=state.events[k];if(!e)return;
 var p=e.date.split("-"),tm=e.time.split(":");
 el("editEventId").value=k;
 el("eventModalTitle").innerHTML="Editar evento";
 el("saveEvent").innerHTML="Guardar alterações";
 el("day").value=+p[2];el("month").value=+p[1];el("year").value=+p[0];
 el("hour").value=tm[0];el("minute").value=tm[1];
 el("eventText").value=e.text||"";
 el("who").value=e.who||"maryli";
 el("repeat").value=e.repeat||"none";
 modal.style.display="block"
}
el("showEvent").onclick=function(){resetEventForm();modal.style.display="block"};
el("closeEvent").onclick=function(){modal.style.display="none"};
el("eventForm").onsubmit=function(e){
 e.preventDefault();
 var text=el("eventText").value.replace(/^\s+|\s+$/g,"");if(!text)return false;
 var date=el("year").value+"-"+pad(+el("month").value)+"-"+pad(+el("day").value),
 time=el("hour").value+":"+el("minute").value,
 editId=el("editEventId").value,
 k=editId||id(),
 item={date:date,time:time,text:text,who:el("who").value,repeat:el("repeat").value};
 state.events[k]=item;
 req("PUT","dashboard/events/"+k,item);
 modal.style.display="none";
 resetEventForm();
 render();
 return false
};
var days=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"],months=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function tick(){var d=new Date(),h=d.getHours(),m=d.getMinutes();el("greet").innerHTML=h<12?"Bom dia!":h<20?"Boa tarde!":"Boa noite!";el("dateText").innerHTML=days[d.getDay()]+", "+d.getDate()+" de "+months[d.getMonth()];el("clock").innerHTML=pad(h)+":"+pad(m)}tick();setInterval(tick,30000);

function exportShoppingPDF(){
 var items=[],k;
 for(k in state.shopping){
  if(state.shopping.hasOwnProperty(k) && !state.shopping[k].done){
   items.push(state.shopping[k].text||"")
  }
 }
 var now=new Date(),dateTxt=pad(now.getDate())+"/"+pad(now.getMonth()+1)+"/"+now.getFullYear();
 var rows="";
 if(items.length){
  for(var i=0;i<items.length;i++)rows+='<li>'+esc(items[i])+'</li>'
 }else{
  rows='<li>Nenhum item por comprar.</li>'
 }
 var doc='<!doctype html><html><head><meta charset="utf-8"><title>Lista de compras</title>'
 +'<style>body{font-family:Arial,sans-serif;color:#222;padding:28px;max-width:700px;margin:auto}h1{font-size:25px;margin:0 0 5px}.date{color:#777;margin-bottom:22px}ul{list-style:none;padding:0;margin:0}li{font-size:18px;padding:11px 0;border-bottom:1px solid #ddd}li:before{content:"☐";display:inline-block;width:30px;color:#555}@media print{button{display:none}body{padding:8px}}</style>'
 +'</head><body><h1>Lista de compras</h1><div class="date">'+dateTxt+'</div><ul>'+rows+'</ul>'
 +'<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>';
 var win=window.open("","_blank");
 if(win){win.document.open();win.document.write(doc);win.document.close()}
 else{alert("Não foi possível abrir a lista para impressão. Permita janelas pop-up para este site.")}
}

var expenseView=new Date();expenseView.setDate(1);
var EXPENSE_CATS={credit:{name:"Crédito",cls:"cat-credit",color:"#7e9fc1"},supermarket:{name:"Supermercado",cls:"cat-supermarket",color:"#86b28e"},house:{name:"Casa",cls:"cat-house",color:"#d5bd6d"},leisure:{name:"Lazer",cls:"cat-leisure",color:"#b48db7"},restaurant:{name:"Restauração",cls:"cat-restaurant",color:"#d59b77"},other:{name:"Outros",cls:"cat-other",color:"#9b9fa3"}};
function euro(v){var n=Number(v||0).toFixed(2).replace(".",","),p=n.split(","),x=p[0],r="";while(x.length>3){r="."+x.substr(x.length-3)+r;x=x.substr(0,x.length-3)}return x+r+","+p[1]+" €"}
function expenseMonthKey(){return expenseView.getFullYear()+"-"+pad(expenseView.getMonth()+1)}
function renderExpensePie(t,sum){var s="",l="",off=0;if(!sum){el("expensePie").innerHTML='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e7eaec" stroke-width="7"></circle>';el("expenseLegend").innerHTML="";return}for(var k in EXPENSE_CATS){var v=t[k]||0;if(!v)continue;var pct=v/sum*100,c=EXPENSE_CATS[k];s+='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+c.color+'" stroke-width="7" stroke-dasharray="'+pct+' '+(100-pct)+'" stroke-dashoffset="'+(-off)+'"></circle>';off+=pct;l+='<div class="legendRow"><span class="legendDot '+c.cls+'"></span><span class="legendName">'+c.name+'</span><span class="legendValue">'+euro(v)+'</span><span class="legendPct">'+Math.round(pct)+'%</span></div>'}el("expensePie").innerHTML=s;el("expenseLegend").innerHTML=l}
function renderExpenses(){if(!state.expenses)state.expenses={};var mn=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];el("expenseMonth").innerHTML=mn[expenseView.getMonth()]+" "+expenseView.getFullYear();var mk=expenseMonthKey(),a=[],k,t={credit:0,supermarket:0,house:0,leisure:0,restaurant:0,other:0},sum=0,o="";for(k in state.expenses){var x=state.expenses[k];if(x&&x.date&&x.date.substr(0,7)===mk){x._id=k;a.push(x)}}a.sort(function(x,y){return y.date.localeCompare(x.date)});for(var i=0;i<a.length;i++){var x=a[i],cat=EXPENSE_CATS[x.category]||EXPENSE_CATS.other,v=Number(x.value||0),p=x.date.split("-");sum+=v;t[x.category in t?x.category:"other"]+=v;o+='<div class="expenseRow"><span class="expenseDate">'+p[2]+"/"+p[1]+'</span><span class="expenseCatDot '+cat.cls+'"></span><span class="expenseDesc">'+esc(x.text||"")+'</span><span class="expenseAmount">'+euro(v)+'</span><button class="expenseEdit" data-edit-expense="'+x._id+'">✎</button><button class="expenseDelete" data-delete-expense="'+x._id+'">×</button></div>'}el("expenseList").innerHTML=o||'<div class="empty">Ainda não existem despesas neste mês.</div>';el("expenseTotal").innerHTML=euro(sum);renderExpensePie(t,sum)}
function resetExpenseForm(){el("editExpenseId").value="";el("expenseModalTitle").innerHTML="Nova despesa";el("saveExpense").innerHTML="Guardar despesa";var d=new Date();el("expenseDate").value=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());el("expenseText").value="";el("expenseValue").value="";el("expenseCategory").value="supermarket"}
function openEditExpense(k){var x=state.expenses[k];if(!x)return;el("editExpenseId").value=k;el("expenseModalTitle").innerHTML="Editar despesa";el("saveExpense").innerHTML="Guardar alterações";el("expenseDate").value=x.date;el("expenseText").value=x.text;el("expenseValue").value=x.value;el("expenseCategory").value=x.category;el("expenseModal").style.display="block"}
function initExpenses(){el("showExpense").onclick=function(){resetExpenseForm();el("expenseModal").style.display="block"};el("closeExpense").onclick=function(){el("expenseModal").style.display="none"};el("expensePrev").onclick=function(){expenseView.setMonth(expenseView.getMonth()-1);renderExpenses()};el("expenseNext").onclick=function(){expenseView.setMonth(expenseView.getMonth()+1);renderExpenses()};el("expenseForm").onsubmit=function(e){e.preventDefault();var tx=el("expenseText").value.replace(/^\s+|\s+$/g,""),v=parseFloat(el("expenseValue").value);if(!tx||!v)return false;var k=el("editExpenseId").value||id(),it={date:el("expenseDate").value,text:tx,value:v,category:el("expenseCategory").value};state.expenses[k]=it;req("PUT","dashboard/expenses/"+k,it);el("expenseModal").style.display="none";renderExpenses();return false};renderExpenses()}
function wi(c){if(c===0)return"☀";if(c<=3)return"⛅";if(c<=48)return"☁";if(c<=67)return"☂";if(c<=77)return"❄";if(c<=82)return"☂";return"☂"}
var WEATHER_KEY="home.weather.cache.v2.5days",WEATHER_MAX_AGE=10800000;
function weatherReadLocal(){try{var x=localStorage.getItem(WEATHER_KEY);return x?JSON.parse(x):null}catch(e){return null}}
function weatherSaveLocal(d){try{localStorage.setItem(WEATHER_KEY,JSON.stringify(d))}catch(e){}}
function weatherRender(d){
 if(!d||!d.days||d.days.length<5)return false;
 var o="",n=["Hoje","Amanhã","Depois"],nowDate=new Date();
 for(var ni=3;ni<5;ni++){var nd=new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate()+ni),wd=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];n.push(wd[nd.getDay()])}
 for(var i=0;i<5;i++){
  o+='<div class="weatherLine"><span class="weatherSymbol">'+wi(d.days[i].code)+'</span><span class="weatherName">'+n[i]+'</span><span class="weatherRange">'+Math.round(d.days[i].max)+'° <small>mín. '+Math.round(d.days[i].min)+'°</small></span></div>'
 }
 el("forecast").innerHTML=o;
 if(el("weatherUpdated")&&d.updated){var age=(new Date().getTime()-d.updated),h=Math.floor(age/3600000);el("weatherUpdated").innerHTML=h<1?"agora":h+"h"}
 return true
}
function weatherRefresh(){
 var now=new Date().getTime(),lock={time:now};
 req("GET","dashboard/weatherRefresh",null,function(t){
  var current=null;try{current=JSON.parse(t)}catch(e){}
  if(current&&current.time&&now-current.time<120000)return;
  req("PUT","dashboard/weatherRefresh",lock);
  var w=new XMLHttpRequest();
  w.onreadystatechange=function(){
   if(w.readyState===4&&w.status>=200&&w.status<300){
    try{
     var j=JSON.parse(w.responseText),d={updated:new Date().getTime(),days:[]};
     for(var i=0;i<5;i++)d.days.push({code:j.daily.weather_code[i],max:j.daily.temperature_2m_max[i],min:j.daily.temperature_2m_min[i]});
     weatherSaveLocal(d);weatherRender(d);req("PUT","dashboard/weather",d)
    }catch(e){}
   }
  };
  w.open("GET","https://api.open-meteo.com/v1/forecast?latitude=39.2362&longitude=-8.6859&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLisbon&forecast_days=5",true);
  w.send()
 })
}
function weatherStart(){
 var local=weatherReadLocal(),now=new Date().getTime();
 if(local)weatherRender(local);
 req("GET","dashboard/weather",null,function(t){
  var remote=null;try{remote=JSON.parse(t)}catch(e){}
  if(remote&&(!local||remote.updated>local.updated)){local=remote;weatherSaveLocal(remote);weatherRender(remote)}
  if(!local||!local.updated||now-local.updated>WEATHER_MAX_AGE)weatherRefresh()
 })
}
el("exportShopping").onclick=exportShoppingPDF;

function refreshSharedExpenses(){
 req("GET","dashboard/expenses",null,function(t){
  try{state.expenses=JSON.parse(t)||{};renderExpenses()}catch(e){}
 })
}
setInterval(refreshSharedExpenses,15000);

initExpenses();
weatherStart();
loadAll();setInterval(loadAll,5000);
})();