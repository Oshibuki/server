import{u as n}from"./siteStatus-c580ce27.js";import{h as r,a as c,c as l,d as s,k as i,t as e,g as t,F as u}from"./index-4c4125fd.js";const _={id:"online_users",class:"info-box-number text-green"},p={id:"servers_count"},S={class:"label label-success"},d={class:"label label-success"},x={__name:"regionStatus",setup(m){const o=n(),a=r();return(g,b)=>(c(),l(u,null,[s("span",_,[i(e(t(o).regionUsers)+" ",1),s("small",null,"ONLINE USERS | "+e(t(a).region),1)]),s("div",p,[s("span",S,"BATTLES: "+e(t(o).battleCount),1),s("span",d,"GROUPFIGHTS: "+e(t(o).groupfightCount),1)])],64))}};export{x as _};