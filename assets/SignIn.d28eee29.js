import{b as e,u as a,i as l}from"./index.aa929f76.js";import{E as t,r as o,l as s,o as d,n,p as r,x as i,u as c,s as p,t as u,Q as m,K as f,q as y,M as g}from"./vendor.5c059efe.js";const v=y("span",null," Boring Days ",-1),b=p(" Sign In "),x={setup(y){const x="bd-signed-in",I=e(),V=a(),_=t(!0),h=o({appId:"",appKey:""}),K=o({model:!1,indication:""}),w=o({model:!1,indication:""}),k=o({appId:"",appKey:""}),j=t(!1);function S(e="all"){let a;a="all"===e?Object.keys(h):[e],a.forEach((e=>{k[e]=""}))}const E=(e="all")=>{let a,l=!0;return a="all"===e?Object.keys(h):[e],a.forEach((e=>{h[e]||(k[e]=`${e} 不可为空`,l=!1)})),l},U=async()=>{K.model=!1,w.model=!1;if(E()){j.value=!0;const e=await l(h.appId,h.appKey);!0===e?(V.commit("SET_SIGNED_IN",h),_.value?localStorage.setItem(x,JSON.stringify(h)):sessionStorage.setItem(x,JSON.stringify(h)),I.push("/")):(w.model=!0,w.indication=!1===e?"登录失败，请检查输入是否正确":e),j.value=!1}else K.model=!0,K.indication="请先确保输入有效"},N=e=>{"Enter"===e.key&&U()};return(e,a)=>{const l=s("v-img"),t=s("v-col"),o=s("v-alert"),y=s("v-text-field"),x=s("v-checkbox"),I=s("v-progress-circular"),V=s("v-btn"),O=s("v-card"),B=s("v-container");return d(),n(B,{class:"justify-center d-flex align-center flex-wrap align-content-center",style:{height:"100vh"},fluid:""},{default:r((()=>[i(t,{cols:"12",md:"6",lg:"4",class:"pt-0"},{default:r((()=>[i(O,{width:"100%",flat:"",color:"transparent",class:"d-flex flex-wrap"},{default:r((()=>[i(t,{cols:"12",class:"d-flex align-center text-h5 justify-center mb-6 pt-0"},{default:r((()=>[i(l,{src:"logo.svg",width:"28",class:"flex-grow-0 mr-4"}),v])),_:1}),i(t,{cols:"12",class:"py-0"},{default:r((()=>[i(o,{modelValue:c(K).model,"onUpdate:modelValue":a[0]||(a[0]=e=>c(K).model=e),closable:"",type:"warning",variant:"contained-text"},{default:r((()=>[p(u(c(K).indication),1)])),_:1},8,["modelValue"])])),_:1}),i(t,{cols:"12",class:m(["py-0",{"mt-4":c(w).model}])},{default:r((()=>[i(o,{modelValue:c(w).model,"onUpdate:modelValue":a[1]||(a[1]=e=>c(w).model=e),closable:"",type:"error",variant:"contained-text"},{default:r((()=>[p(u(c(w).indication),1)])),_:1},8,["modelValue"])])),_:1},8,["class"]),i(t,{cols:"12",class:"py-0 mt-6"},{default:r((()=>[i(y,{modelValue:c(h).appId,"onUpdate:modelValue":a[2]||(a[2]=e=>c(h).appId=e),label:"App Id*",variant:"outlined",density:"comfortable","error-messages":c(k).appId,onInput:a[3]||(a[3]=e=>S("appId")),onBlur:a[4]||(a[4]=e=>E("appId"))},null,8,["modelValue","error-messages"])])),_:1}),i(t,{cols:"12",class:"py-0"},{default:r((()=>[i(y,{modelValue:c(h).appKey,"onUpdate:modelValue":a[5]||(a[5]=e=>c(h).appKey=e),label:"App Key*",variant:"outlined",density:"comfortable","error-messages":c(k).appKey,onInput:a[6]||(a[6]=e=>S("appKey")),onBlur:a[7]||(a[7]=e=>E("appKey")),onKeydown:N},null,8,["modelValue","error-messages"])])),_:1}),i(t,{cols:"12",class:"py-0 px-1"},{default:r((()=>[i(x,{modelValue:_.value,"onUpdate:modelValue":a[8]||(a[8]=e=>_.value=e),label:"记住我的登录信息","hide-details":"",density:"comfortable",color:"primary",class:"flex-grow-0"},null,8,["modelValue"])])),_:1}),i(t,{cols:"12",class:"d-flex align-center justify-center mt-4"},{default:r((()=>[i(V,{color:"primary",block:"",disabled:j.value,onClick:U},{default:r((()=>[j.value?(d(),n(I,{key:0,indeterminate:"",width:"2",size:"20"})):(d(),f(g,{key:1},[b],64))])),_:1},8,["disabled"])])),_:1})])),_:1})])),_:1})])),_:1})}}};export{x as default};
