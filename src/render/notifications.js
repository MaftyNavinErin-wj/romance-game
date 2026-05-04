// src/render/notifications.js
//
// showNotif — 右上角浮动通知(3 秒后自动消失)
//
// 来源:从 project_romance_v181.html L17661-L17666 整体抽离(Session 2.1 / 阶段 2)
// 抽离方式:**只搬运,不改逻辑**(verbatim relocation)。
// 接口风格:全局函数(同 v181 + events.js 100+ 调用点保持兼容,hoisted function
// 跨同 realm classic <script> 全局可见)。
//
// 依赖:
//   - DOM:document.createElement / appendChild / setTimeout(原生 API)
//   - CSS:.notif 类(在 v181 内联 <style> 中,phase 2 不抽 CSS)
//   - CSS 变量:var(--ink-l)(在 v181 内联 <style> 中)
// 无外部 JS 函数依赖、无状态变量、无队列、完全自包含。

function showNotif(msg,type='info'){
  const cols={info:'var(--ink-l)',warn:'#8a6a10',battle:'#c03030'};
  const el=document.createElement('div');
  el.className='notif';el.style.borderLeftColor=cols[type]||cols.info;el.textContent=msg;
  document.body.appendChild(el);setTimeout(()=>el.remove(),3000);
}
