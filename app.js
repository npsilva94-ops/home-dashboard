(function(){
var STORE={shopping:"home.shopping",tasks:"home.tasks",events:"home.events"};
function load(k, fallback){try{var x=localStorage.getItem(k);return x?JSON.parse(x):fallback}catch(e){return fallback}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var shopping=load(STORE.shopping,[{t:"Leite",d:false},{t:"Pão",d:false},{t:"Fruta",d:false}]);
var tasks=load(STORE.tasks,[{t:"Regar plantas",d:false},{t:"Levar lixo",d:false}]);
var events=load(STORE.events,[{time:"17:30",t:"Ginásio"},{time:"20:00",t:"Jantar"}]);

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function renderList(id,data,key){
 var el=document.getElementById(id), out="";
 for(var i=0;i<data.length;i++){
  out+='<div class="row '+(data[i].d?'done':'')+'"><input type="checkbox" data-key="'+key+'" data-i="'+i+'" '+(data[i].d?'checked':'')+'><span>'+esc(data[i].t)+'</span><button class="delete" data-del="'+key+'" data-i="'+i+'">×</button></div>';
 }
 el.innerHTML=out;
}
function renderEvents(){
 var out="";
 for(var i=0;i<events.length;i++) out+='<div class="row"><strong style="width:58px">'+esc(events[i].time)+'</strong><span>'+esc(events[i].t)+'</span><button class="delete" data-del="events" data-i="'+i+'">×</button></div>';
 document.getElementById("events").innerHTML=out;
}
function allRender(){renderList("shoppingList",shopping,"shopping");renderList("taskList",tasks,"tasks");renderEvents()}
document.body.onclick=function(e){
 var t=e.target, key=t.getAttribute("data-key"), del=t.getAttribute("data-del"), i=parseInt(t.getAttribute("data-i"),10);
 if(key){var a=key==="shopping"?shopping:tasks;a[i].d=t.checked;save(STORE[key],a);allRender()}
 if(del){var a2=del==="shopping"?shopping:(del==="tasks"?tasks:events);a2.splice(i,1);save(STORE[del],a2);allRender()}
};
function bindForm(form,input,data,key){
 document.getElementById(form).onsubmit=function(e){e.preventDefault();var el=document.getElementById(input),v=el.value.replace(/^\s+|\s+$/g,"");if(v){data.push({t:v,d:false});save(STORE[key],data);el.value="";allRender()}return false}
}
bindForm("shoppingForm","shoppingInput",shopping,"shopping");
bindForm("taskForm","taskInput",tasks,"tasks");
document.getElementById("eventForm").onsubmit=function(e){e.preventDefault();var a=document.getElementById("eventTime"),b=document.getElementById("eventText"),v=b.value.replace(/^\s+|\s+$/g,"");if(v){events.push({time:a.value||"--:--",t:v});save(STORE.events,events);a.value="";b.value="";allRender()}return false};

var days=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
var months=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function tick(){var d=new Date(),h=d.getHours(),m=d.getMinutes();document.getElementById("greeting").innerHTML=h<12?"Bom dia!":(h<20?"Boa tarde!":"Boa noite!");document.getElementById("dateText").innerHTML=days[d.getDay()]+", "+d.getDate()+" de "+months[d.getMonth()];document.getElementById("clock").innerHTML=(h<10?"0":"")+h+":"+(m<10?"0":"")+m}
tick();setInterval(tick,30000);

var week=document.getElementById("week"), now=new Date(), w="";
for(var j=0;j<7;j++){var d2=new Date(now.getTime()+j*86400000);w+='<div class="day"><strong>'+days[d2.getDay()].substr(0,3)+'</strong><div class="symbol">'+(j%3===2?"☁":"☀")+'</div><span>'+d2.getDate()+'</span></div>'}week.innerHTML=w;

/* Weather: Open-Meteo, no API key. Santarem default coordinates. */
function weather(){
 var xhr=new XMLHttpRequest();
 var url="https://api.open-meteo.com/v1/forecast?latitude=39.2362&longitude=-8.6859&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FLisbon";
 xhr.onreadystatechange=function(){if(xhr.readyState===4&&xhr.status>=200&&xhr.status<300){try{var x=JSON.parse(xhr.responseText);document.querySelector(".temperature").innerHTML=Math.round(x.current.temperature_2m)+"°C";document.getElementById("weatherInfo").innerHTML="Máx. "+Math.round(x.daily.temperature_2m_max[0])+"° · Mín. "+Math.round(x.daily.temperature_2m_min[0])+"°"}catch(e){}}};
 try{xhr.open("GET",url,true);xhr.send()}catch(e){}
}
weather();allRender();
})();