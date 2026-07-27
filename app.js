(function(){
var DB="https://home-dashboard-61d63-default-rtdb.europe-west1.firebasedatabase.app";
var state={shopping:{},tasks:{},events:{},menu:{}};
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
function render(){renderList("shopping",state.shopping,"shopping");renderList("tasks",state.tasks,"tasks");renderEvents();renderMenu()}
document.body.onclick=function(e){var t=e.target,edit=t.getAttribute("data-edit-event"),type=t.getAttribute("data-type"),rid=t.getAttribute("data-id"),rem=t.getAttribute("data-remove");if(edit){openEditEvent(edit);return;}if(type&&t.type==="checkbox"){var v=!!t.checked;state[type][rid].done=v;req("PATCH","dashboard/"+type+"/"+rid,{done:v});render()}if(rem){delete state[rem][rid];req("DELETE","dashboard/"+rem+"/"+rid,null);render()}};
document.body.onchange=function(e){var t=e.target;if(t&&t.getAttribute("data-menu"))saveMenu(t)};
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
function wi(c){if(c===0)return"☀";if(c<=3)return"⛅";if(c<=48)return"☁";if(c<=67)return"☂";if(c<=77)return"❄";if(c<=82)return"☂";return"☂"}
var w=new XMLHttpRequest();
w.onreadystatechange=function(){
 if(w.readyState===4&&w.status>=200&&w.status<300){
  try{
   var j=JSON.parse(w.responseText),o="",n=["Hoje","Amanhã","Depois"];
   for(var i=0;i<3;i++){
    o+='<div class="weatherLine"><span class="weatherSymbol">'+wi(j.daily.weather_code[i])+'</span><span class="weatherName">'+n[i]+'</span><span class="weatherRange">'+Math.round(j.daily.temperature_2m_max[i])+'° <small>mín. '+Math.round(j.daily.temperature_2m_min[i])+'°</small></span></div>'
   }
   el("forecast").innerHTML=o
  }catch(e){}
 }
};
w.open("GET","https://api.open-meteo.com/v1/forecast?latitude=39.2362&longitude=-8.6859&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLisbon&forecast_days=3",true);
w.send();
loadAll();setInterval(loadAll,5000);
})();